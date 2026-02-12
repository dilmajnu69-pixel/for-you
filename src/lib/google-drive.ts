/**
 * Google Drive Integration Module
 * 
 * Handles photo storage with dual authentication support (Service Account + OAuth 2.0),
 * automatic retry mechanism, and seamless fallback to local storage.
 * 
 * Features:
 * - Service Account authentication (preferred for server-to-server)
 * - OAuth 2.0 fallback for user-delegated access
 * - Exponential backoff retry mechanism (3 attempts)
 * - Automatic local storage fallback
 * - Dual database storage (local + Drive) for redundancy
 */

import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';

// ===========================
// CONFIGURATION CONSTANTS
// ===========================

/** Full Drive access scope - required for creating, reading, updating, and deleting files */
const SCOPES = ['https://www.googleapis.com/auth/drive'];

/** Local data directory paths - Use robust temporary path in production/Vercel */
const DATA_DIR = process.env.NODE_ENV === 'production'
  ? path.join('/tmp', 'data')
  : path.join(process.cwd(), 'data');

const LOCAL_DB_PATH = path.join(DATA_DIR, 'photos.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads'); // Still public for static serving locally

/** Retry configuration for transient errors */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second, doubles exponentially

/** Database filename on Google Drive */
const DB_FILENAME = 'photos.json';

// ===========================
// SINGLETON DRIVE CLIENT
// ===========================

/** Cached Drive client instance to avoid re-initialization */
let driveClient: any = null;
/** Flag to track if initialization has been attempted */
let driveClientInitialized = false;

const getDriveClient = () => {
  // Return cached client if already initialized
  if (driveClientInitialized) return driveClient;

  // === Try Service Account (preferred) ===
  const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (serviceAccountEmail && privateKey) {
    try {
      // Robust key formatting: Remove surrounding quotes and handle newlines
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      const formattedKey = privateKey.replace(/\\n/g, '\n');

      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: formattedKey,
        scopes: SCOPES,
      });
      driveClient = google.drive({ version: 'v3', auth });
      driveClientInitialized = true;
      console.log('[Google Drive] Service Account initialized successfully');
      return driveClient;
    } catch (error) {
      console.error('[Google Drive] Service Account init failed:', error);
      // Continue to OAuth fallback
    }
  }

  // === Try OAuth 2.0 (fallback) ===
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    try {
      const auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ refresh_token: refreshToken });
      driveClient = google.drive({ version: 'v3', auth });
      driveClientInitialized = true;
      console.log('[Google Drive] OAuth client initialized successfully');
      return driveClient;
    } catch (error) {
      console.error('[Google Drive] OAuth init failed:', error);
    }
  }

  // === No credentials - log explicitly ===
  console.warn('[Google Drive] No valid credentials found. Data will NOT persist across deployments.');
  driveClientInitialized = true;
  return null;
};

/**
 * Get Google Drive folder ID from environment
 * @returns Folder ID string or null if not configured
 */
const getFolderId = () => process.env.GOOGLE_DRIVE_FOLDER_ID || null;

// ===========================
// RETRY UTILITIES
// ===========================

/**
 * Sleep utility for retry delays
 * @param ms - Milliseconds to wait
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry async function with exponential backoff
 * 
 * Only retries on transient errors (network issues, rate limits, server errors).
 * Throws immediately on permanent errors (auth, bad requests, permissions).
 * 
 * @param fn - Async function to execute with retries
 * @param retries - Number of retry attempts remaining
 * @param delay - Current retry delay in milliseconds (doubles each retry)
 * @returns Result of the async function
 * @throws Error after all retries exhausted or on non-retryable errors
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // No retries left - throw the error
    if (retries <= 0) {
      throw error;
    }

    // Check if error is worth retrying
    const isRetryable =
      error.code === 'ECONNRESET' ||    // Connection reset
      error.code === 'ETIMEDOUT' ||     // Request timeout
      error.code === 'ENOTFOUND' ||     // DNS lookup failed
      error.code === 429 ||              // Rate limit exceeded
      error.code === 500 ||              // Internal server error
      error.code === 503;                // Service unavailable

    // Don't retry permanent errors (auth, bad request, forbidden, etc.)
    if (!isRetryable) {
      throw error;
    }

    // Log retry attempt
    console.log(`[Retry] Attempt failed, retrying in ${delay}ms... (${retries} retries left)`);
    await sleep(delay);

    // Recursive retry with exponential backoff
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

// ===========================
// GOOGLE DRIVE FILE OPERATIONS
// ===========================

/**
 * Find a file in Google Drive by name within the configured folder
 * @param name - Filename to search for
 * @returns File metadata or null if not found/Drive unavailable
 */
async function findFile(name: string) {
  const drive = getDriveClient();
  const folderId = getFolderId();

  // Drive not configured
  if (!drive || !folderId) return null;

  try {
    const res = await retryWithBackoff(async () => {
      return await drive.files.list({
        q: `'${folderId}' in parents and name = '${name}' and trashed = false`,
        fields: 'files(id, name)',
      });
    });
    return res.data.files?.[0] || null;
  } catch (e) {
    console.error('[Google Drive] File list error:', e);
    return null;
  }
}

// ===========================
// GENERIC JSON PERSISTENCE (Universal Sync)
// ===========================

/**
 * Get data from a JSON file with Google Drive sync
 * 
 * @param filename - Name of the file in the data/ directory (e.g., 'messages.json')
 * @returns Parsed JSON content or null if failed
 */
export async function getPersistentJSON<T>(filename: string): Promise<T | null> {
  const drive = getDriveClient();
  const filePath = path.join(DATA_DIR, filename);

  // 1. If Drive is available, try to get from Drive first to stay in sync
  if (drive) {
    try {
      const driveFile = await findFile(filename);
      if (driveFile) {
        const res = await retryWithBackoff(async () => {
          return await drive.files.get(
            { fileId: driveFile.id!, alt: 'media' },
            { responseType: 'stream' }
          );
        });

        // Read stream to string
        const chunks: any[] = [];
        const content = await new Promise<string>((resolve, reject) => {
          res.data.on('data', (chunk: any) => chunks.push(chunk));
          res.data.on('error', reject);
          res.data.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        });

        const data = JSON.parse(content);

        // Save locally as a cache/backup
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

        return data as T;
      }
    } catch (error) {
      console.error(`[Google Drive] Failed to fetch ${filename} from Drive:`, error);
    }
  }

  // 2. Fallback to local filesystem
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(`[Local DB] Failed to read ${filename}:`, error);
    return null;
  }
}

/**
 * Save data to a JSON file and sync to Google Drive
 * 
 * @param filename - Name of the file in the data/ directory
 * @param data - Object to save
 */
export async function savePersistentJSON(filename: string, data: any) {
  const drive = getDriveClient();
  const folderId = getFolderId();
  const filePath = path.join(DATA_DIR, filename);

  // 1. Always save locally first (immediate backup)
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[Local DB] ${filename} saved successfully`);
  } catch (error) {
    console.error(`[Local DB] Failed to save ${filename}:`, error);
  }

  // 2. Sync to Google Drive
  if (!drive || !folderId) {
    console.warn(`[Google Drive] Sync skipped for ${filename}: No credentials or folder ID`);
    return;
  }

  try {
    const file = await findFile(filename);
    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2),
    };

    await retryWithBackoff(async () => {
      if (file) {
        return await drive.files.update({
          fileId: file.id!,
          media: media,
        });
      } else {
        return await drive.files.create({
          requestBody: {
            name: filename,
            parents: [folderId],
          },
          media: media,
        });
      }
    });
    console.log(`[Google Drive] ${filename} synced to Drive successfully`);
  } catch (e) {
    console.error(`[Google Drive] CRITICAL: Failed to sync ${filename} to Drive:`, e);
    // Rethrow so the API can report failure to the user
    throw new Error(`Cloud sync failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

// ===========================
// SPECIFIC PHOTO DATABASE OPERATIONS
// ===========================

/**
 * Sync Google Drive folder with local database.
 * 
 * - Loads the latest photos.json from Drive (for metadata like captions).
 * - Discovers new files manually uploaded to the Drive folder.
 * - Removes records for files deleted from Drive.
 */
async function syncWithDrive() {
  const drive = getDriveClient();
  const folderId = getFolderId();

  if (!drive || !folderId) return null;

  try {
    console.log('[Google Drive] Starting background sync...');

    // 1. Get current metadata from Drive (or local fallback)
    const remoteData = await getPersistentJSON<{ photos: any[] }>(DB_FILENAME);
    const localPhotos = remoteData?.photos || [];

    // 2. Get all image files from Drive folder to check for new/dead files
    const driveFilesRes = await retryWithBackoff(async () => {
      return await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name, createdTime)',
      });
    });

    const driveFiles = driveFilesRes.data.files || [];

    // 3. Identify new files on Drive not in our database
    const newFiles = driveFiles.filter((df: any) =>
      !localPhotos.some((lp: any) => lp.src.includes(df.id))
    );

    // 4. Identify files in our database that no longer exist on Drive
    const deadPhotos = localPhotos.filter((lp: any) => {
      if (!lp.src.includes('drive.google.com')) return false;
      const urlParams = new URLSearchParams(new URL(lp.src).search);
      const id = urlParams.get('id');
      return !driveFiles.some((df: any) => df.id === id);
    });

    if (newFiles.length === 0 && deadPhotos.length === 0) {
      console.log('[Google Drive] Sync complete: Metadata and files are up to date');
      return localPhotos;
    }

    console.log(`[Google Drive] Syncing: ${newFiles.length} new, ${deadPhotos.length} removed`);

    // 5. Create new photo objects
    const newPhotoObjects = newFiles.map((file: any) => ({
      id: Date.now() + Math.floor(Math.random() * 1000),
      src: `https://drive.google.com/uc?export=view&id=${file.id}`,
      caption: '',
      date: file.createdTime || new Date().toISOString()
    }));

    // 6. Build final list
    const updatedPhotos = [
      ...newPhotoObjects,
      ...localPhotos.filter((lp: any) => !deadPhotos.includes(lp))
    ];

    // 7. Save updated database back to Drive
    await saveDatabase(updatedPhotos);
    return updatedPhotos;

  } catch (error) {
    console.error('[Google Drive] Sync failed:', error);
    return null;
  }
}

/**
 * Internal raw database retrieval without triggering sync
 */
async function getDatabaseRaw() {
  try {
    const content = await fs.readFile(LOCAL_DB_PATH, 'utf-8');
    const json = JSON.parse(content);
    return Array.isArray(json) ? json : (json.photos || []);
  } catch (error) {
    return [];
  }
}

/**
 * Retrieve photos database from Google Drive or local storage
 */
export async function getDatabase() {
  const drive = getDriveClient();

  if (drive) {
    const syncedPhotos = await syncWithDrive();
    if (syncedPhotos) return syncedPhotos;
  }

  return await getDatabaseRaw();
}

/**
 * Save photos database to local storage and optionally to Google Drive
 */
export async function saveDatabase(data: any[]) {
  await savePersistentJSON(DB_FILENAME, { photos: data });
}

// ===========================
// IMAGE UPLOAD OPERATIONS
// ===========================

/**
 * Upload file to local storage (fallback method)
 * Saves file to public/uploads/ directory with timestamped filename
 * 
 * @param file - File to upload
 * @returns Local URL path (/uploads/filename)
 */
async function uploadToLocal(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-'); // Remove special chars
  const filename = `${Date.now()}-${sanitizedName}`; // Add timestamp for uniqueness

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);

  console.log('[Local Storage] File uploaded:', filename);
  return `/uploads/${filename}`;
}

/**
 * Upload file to Google Drive with automatic retry
 * Sets public read permissions on uploaded file
 * 
 * @param file - File to upload
 * @param folderId - Google Drive folder ID
 * @param drive - Drive client instance
 * @returns Google Drive URL (high-quality thumbnail or direct link)
 */
async function uploadToDrive(file: File, folderId: string, drive: any): Promise<string> {
  // Convert file to readable stream
  const buffer = Buffer.from(await file.arrayBuffer());
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Signal end of stream

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
  const filename = `${Date.now()}-${sanitizedName}`;

  // Upload file with retry
  const res = await retryWithBackoff(async () => {
    return await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: stream,
      },
      fields: 'id, thumbnailLink, webContentLink',
    });
  });

  const fileId = res.data.id!;

  // Make file publicly readable with retry
  await retryWithBackoff(async () => {
    return await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  });

  // CRITICAL: Use direct view link, NOT thumbnailLink
  // thumbnailLink (lh3.googleusercontent.com/drive-storage/) requires authentication
  // and expires, causing images to break after a few days
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Upload file with automatic Google Drive/local storage fallback
 * 
 * Strategy:
 * 1. Try Google Drive if configured (with 3 retries)
 * 2. Fall back to local storage if Drive fails
 * 
 * @param file - File to upload
 * @returns URL to uploaded file (Drive URL or local path)
 */
export async function uploadFile(file: File): Promise<string> {
  const drive = getDriveClient();
  const folderId = getFolderId();

  // === Try Google Drive first if configured ===
  if (drive && folderId) {
    try {
      const driveUrl = await uploadToDrive(file, folderId, drive);
      console.log('[Google Drive] File uploaded successfully:', driveUrl);
      return driveUrl;
    } catch (error) {
      console.error('[Google Drive] Upload failed after retries, falling back to local storage:', error);
      // Continue to local storage fallback
    }
  }

  // === Fallback to local storage ===
  return await uploadToLocal(file);
}

// ===========================
// FILE DELETION OPERATIONS
// ===========================

/**
 * Delete file from Google Drive or local storage based on URL
 * 
 * @param url - File URL (Drive URL or local path)
 */
export async function deleteFileFromDrive(url: string) {
  const drive = getDriveClient();

  // === Local storage deletion ===
  if (!drive) {
    if (url.startsWith('/uploads/')) {
      try {
        const filename = url.replace('/uploads/', '');
        await fs.unlink(path.join(UPLOADS_DIR, filename));
        console.log('[Local Storage] File deleted:', filename);
      } catch (e) {
        console.warn('[Local Storage] Failed to delete local file:', e);
      }
    }
    return;
  }

  // === Google Drive deletion ===
  try {
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get('id'); // Extract file ID from URL

    if (id) {
      await retryWithBackoff(async () => {
        return await drive.files.delete({ fileId: id });
      });
      console.log('[Google Drive] File deleted:', id);
    }
  } catch (e) {
    console.warn('[Google Drive] Failed to delete file:', e);
  }
}
