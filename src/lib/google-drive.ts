import { google } from 'googleapis';
import { Readable } from 'stream';

// Scope for full Drive access
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Singleton client instance
let driveClient: any = null;

const getDriveClient = () => {
  if (driveClient) return driveClient;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  // Graceful failure if credentials are missing
  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Google Drive] Missing credentials. Backend is running in "Offline Mode" (mock/empty).');
    return null;
  }

  try {
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    // Auto-refresh logic is built-in to google-auth-library when refresh_token is present
    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (error) {
    console.error('[Google Drive] Auth init failed:', error);
    return null;
  }
};

const getFolderId = () => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    console.warn('[Google Drive] GOOGLE_DRIVE_FOLDER_ID is missing.');
    return null;
  }
  return folderId;
};

// --- Database (photos.json) Helpers ---

const DB_FILENAME = 'photos.json';

async function findFile(name: string) {
  const drive = getDriveClient();
  const folderId = getFolderId();
  if (!drive || !folderId) return null;

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and name = '${name}' and trashed = false`,
      fields: 'files(id, name)',
    });
    return res.data.files?.[0] || null;
  } catch (e) {
    console.error('Drive List Error:', e);
    return null;
  }
}

export async function getDatabase() {
  const drive = getDriveClient();
  if (!drive) return []; // Return empty if no auth

  try {
    const file = await findFile(DB_FILENAME);
    if (!file) return []; // No DB yet

    const res = await drive.files.get({
      fileId: file.id!,
      alt: 'media',
    });

    return res.data as any[];
  } catch (e) {
    console.error('Drive DB Read Error:', e);
    return [];
  }
}

export async function saveDatabase(data: any[]) {
  const drive = getDriveClient();
  const folderId = getFolderId();
  if (!drive || !folderId) {
    console.warn('Cannot save database: Auth or Folder ID missing');
    return;
  }

  const file = await findFile(DB_FILENAME);
  const media = {
    mimeType: 'application/json',
    body: JSON.stringify(data, null, 2),
  };

  try {
    if (file) {
      // Update existing
      await drive.files.update({
        fileId: file.id!,
        media: media,
      });
    } else {
      // Create new
      await drive.files.create({
        requestBody: {
          name: DB_FILENAME,
          parents: [folderId],
        },
        media: media,
      });
    }
  } catch (e) {
    console.error('Failed to save database to Drive:', e);
    throw new Error('Database save failed');
  }
}

// --- Image Helpers ---

export async function uploadFile(file: File): Promise<string> {
  const drive = getDriveClient();
  const folderId = getFolderId();
  if (!drive || !folderId) throw new Error('Google Drive not configured (Auth or Folder ID missing)');

  const buffer = Buffer.from(await file.arrayBuffer());
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  try {
    const res = await drive.files.create({
      requestBody: {
        name: `${Date.now()}-${file.name}`,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, thumbnailLink, webContentLink',
    });

    const fileId = res.data.id!;
    const thumbnailLink = res.data.thumbnailLink;

    // Make Public (Reader: Anyone)
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return high-res thumbnail URL (hack: replace s220 with s2048 or s4000)
    // Fallback to webContentLink if thumbnail is missing (unlikely for images)
    if (thumbnailLink) {
      return thumbnailLink.replace('=s220', '=s4000');
    }

    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (e: any) {
    console.error('Upload Error:', e);
    throw new Error('File upload to Drive failed: ' + e.message);
  }
}

export async function deleteFileFromDrive(url: string) {
  const drive = getDriveClient();
  if (!drive) return;

  // Extract ID from URL
  // URL: https://drive.google.com/uc?export=view&id=THE_ID
  try {
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get('id');

    if (id) {
      await drive.files.delete({ fileId: id });
    }
  } catch (e) {
    console.error("Failed to delete drive file", e);
  }
}
