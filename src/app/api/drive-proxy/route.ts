import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

/**
 * Cached Drive client for the proxy
 */
let driveClient: any = null;

const getDriveClient = () => {
  if (driveClient) return driveClient;

  const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  console.log('[Proxy] Environment check:', {
    hasEmail: !!serviceAccountEmail,
    hasKey: !!privateKey,
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN
  });

  if (serviceAccountEmail && privateKey) {
    try {
      // Robustly handle both literal newlines and escaped \n
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      // Remove any accidental quotes at start/end
      privateKey = privateKey.trim().replace(/^["']|["']$/g, '');

      console.log('[Proxy] Initializing Drive with Service Account:', serviceAccountEmail);

      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: SCOPES,
      });
      driveClient = google.drive({ version: 'v3', auth });
      return driveClient;
    } catch (error: any) {
      console.error('[Proxy] Service Account init failed:', error.message);
    }
  } else {
    console.log('[Proxy] Service Account credentials missing, trying OAuth...');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    try {
      console.log('[Proxy] Initializing Drive with OAuth...');
      const auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ refresh_token: refreshToken });
      driveClient = google.drive({ version: 'v3', auth });
      return driveClient;
    } catch (error: any) {
      console.error('[Proxy] OAuth init failed:', error.message);
    }
  }

  console.error('[Proxy] No Drive credentials found in environment variables');
  return null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
  }

  const drive = getDriveClient();
  if (!drive) {
    console.error('[Proxy] Drive client not configured');
    return NextResponse.json({ error: 'Drive client not configured' }, { status: 500 });
  }

  console.log(`[Proxy] Fetching file: ${fileId}`);

  try {
    // 1. Get file metadata for Content-Type
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType, name',
    });

    const mimeType = metadata.data.mimeType || 'application/octet-stream';

    // 2. Fetch file content as a stream
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // 3. Convert Node.js Readable stream to Web ReadableStream
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

  } catch (error: any) {
    console.error(`[Proxy] Failed to fetch file ${fileId}:`, error.message);
    return NextResponse.json(
      {
        error: 'Failed to fetch image from Google Drive',
        details: error.message,
        code: error.code
      },
      { status: error.code === 404 ? 404 : 500 }
    );
  }
}
