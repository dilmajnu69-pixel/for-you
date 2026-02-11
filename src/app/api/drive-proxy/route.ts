import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Force dynamic to avoid caching issues in Vercel
export const dynamic = 'force-dynamic';

/**
 * Cache for different auth clients
 */
let clients: {
  serviceAccount: any;
  oauth: any;
} = {
  serviceAccount: null,
  oauth: null,
};

const initServiceAccount = () => {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !key) return null;

  try {
    // Robustly handle newlines
    key = key.replace(/\\n/g, '\n');
    // Remove quotes
    key = key.trim().replace(/^["']|["']$/g, '');

    // Ensure it has the headers if they are missing (sometimes happens in copy-paste)
    if (!key.includes('BEGIN PRIVATE KEY')) {
      key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
    }

    const auth = new google.auth.JWT({
      email,
      key,
      scopes: SCOPES,
    });
    return google.drive({ version: 'v3', auth });
  } catch (e) {
    console.error('[Proxy] Service Account init error:', e);
    return null;
  }
};

const initOAuth = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth });
  } catch (e) {
    console.error('[Proxy] OAuth init error:', e);
    return null;
  }
};

async function tryFetch(drive: any, fileId: string) {
  // 1. Get file metadata
  const metadata = await drive.files.get({
    fileId: fileId,
    fields: 'mimeType, name, thumbnailLink',
  });

  let mimeType = (metadata.data.mimeType || 'application/octet-stream').toLowerCase();
  let response;

  console.log(`[Proxy] Processing ${fileId} (${mimeType})`);

  // 2. Special handling for HEIC/HEIF (not natively supported by browsers)
  // We fetch a high-res thumbnail version which Google Drive generates as a JPEG
  if (mimeType.includes('heic') || mimeType.includes('heif')) {
    console.log(`[Proxy] Converting HEIC/HEIF for ${fileId} to JPEG...`);
    let thumbUrl = metadata.data.thumbnailLink;
    if (thumbUrl) {
      // Remove the size constraint (usually ends in =s220) and replace with high res
      thumbUrl = thumbUrl.replace(/=s\d+$/, '=s2000');

      // Fetch the thumbnail using the drive's auth
      const auth = drive.context?._options?.auth || drive.auth;
      const thumbResponse = await auth.request({
        url: thumbUrl,
        responseType: 'stream'
      });

      response = { data: thumbResponse.data };
      mimeType = 'image/jpeg';
      console.log(`[Proxy] HEIC conversion successful for ${fileId}`);
    } else {
      console.warn(`[Proxy] No thumbnailLink for HEIC ${fileId}`);
      response = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
      );
    }
  } else {
    // Standard photo
    response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );
  }

  return { metadata, response, mimeType };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
  }

  // Initialize clients if not already cached
  if (!clients.serviceAccount) clients.serviceAccount = initServiceAccount();
  if (!clients.oauth) clients.oauth = initOAuth();

  const errors: any[] = [];

  // 1. Try Service Account first
  if (clients.serviceAccount) {
    try {
      console.log(`[Proxy] Trying Service Account for ${fileId}`);
      const result = await tryFetch(clients.serviceAccount, fileId);
      return serveStream(result);
    } catch (e: any) {
      console.warn('[Proxy] Service Account fetch failed:', e.message);
      errors.push({ method: 'Service Account', message: e.message, code: e.code });
      // If it's a permanent auth error, clear the client to force re-init next time
      if (e.message.includes('grant') || e.code === 400 || e.code === 401) {
        clients.serviceAccount = null;
      }
    }
  }

  // 2. Try OAuth fallback
  if (clients.oauth) {
    try {
      console.log(`[Proxy] Trying OAuth for ${fileId}`);
      const result = await tryFetch(clients.oauth, fileId);
      return serveStream(result);
    } catch (e: any) {
      console.warn('[Proxy] OAuth fetch failed:', e.message);
      errors.push({ method: 'OAuth', message: e.message, code: e.code });
      if (e.message.includes('grant') || e.code === 400 || e.code === 401) {
        clients.oauth = null;
      }
    }
  }

  // All methods failed
  console.error(`[Proxy] All fetch methods failed for ${fileId}`);
  return NextResponse.json({
    error: 'Failed to fetch image from Google Drive',
    attempts: errors,
    message: 'Please check your Google Drive credentials in Vercel environment variables.'
  }, { status: 500 });
}

function serveStream({ metadata, response, mimeType }: any) {
  const nodeStream = response.data;
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: any) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err: any) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  return new Response(webStream, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${metadata.data.name}"`,
    },
  });
}
