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

/** Local data directory paths */
const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'photos.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

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

/**
 * Initialize and return Google Drive client with automatic authentication fallback
 * 
 * Authentication priority:
 * 1. Service Account (GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY)
 * 2. OAuth 2.0 (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN
)
 * 3. null (triggers local storage fallback)
 * 
 * @returns Google Drive client instance or null if no credentials are configured
 */
const getDriveClient = () => {
  // Return cached client if already initialized
  if (driveClientInitialized) return driveClient;

  // === Try Service Account (preferred) ===
  const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (serviceAccountEmail && privateKey) {
    try {
      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey.replace(/\\n/g, '\n'), // Unescape newlines in private key
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

  // === No credentials - use local storage ===
  console.log('[Google Drive] No credentials configured, using local storage fallback');
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
// DATABASE (photos.json) OPERATIONS
// ===========================

/**
 * Sync Google Drive folder with local database.
 * 
 * - Discovers new files manually uploaded to the Drive folder.
 * - Removes records for files deleted from Drive.
 * - Always keeps the local database as the source of truth for metadata (captions, custom dates).
 * 
 * @returns Synchronized array of photos
 */
async function syncWithDrive() {
  const drive = getDriveClient();
  const folderId = getFolderId();

  if (!drive || !folderId) return null;

  try {
    console.log('[Google Drive] Starting background sync...');

    // 1. Get all image files from Drive folder
    const driveFilesRes = await retryWithBackoff(async () => {
      return await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name, createdTime, webContentLink)',
      });
    });

    const driveFiles = driveFilesRes.data.files || [];
    const localPhotos = await getDatabaseRaw(); // Internal get without sync loop

    // 2. Identify new files on Drive not in our database
    const newFiles = driveFiles.filter((df: any) =>
      !localPhotos.some((lp: any) => lp.src.includes(df.id))
    );

    // 3. Identify files in our database that no longer exist on Drive
    // (Only for Drive-hosted photos)
    const deadPhotos = localPhotos.filter((lp: any) => {
      if (!lp.src.includes('drive.google.com')) return false;
      const urlParams = new URLSearchParams(new URL(lp.src).search);
      const id = urlParams.get('id');
      return !driveFiles.some((df: any) => df.id === id);
    });

    if (newFiles.length === 0 && deadPhotos.length === 0) {
      console.log('[Google Drive] Sync complete: Already in sync');
      return localPhotos;
    }

    console.log(`[Google Drive] Syncing: ${newFiles.length} new, ${deadPhotos.length} removed`);

    // 4. Create new photo objects for new files
    const newPhotoObjects = newFiles.map((file: any) => ({
      id: Date.now() + Math.floor(Math.random() * 1000), // Unique-ish ID
      src: `https://drive.google.com/uc?export=view&id=${file.id}`,
      caption: '', // Empty caption as per user request
      date: file.createdTime || new Date().toISOString()
    }));

    // 5. Build final list
    const updatedPhotos = [
      ...newPhotoObjects,
      ...localPhotos.filter((lp: any) => !deadPhotos.includes(lp))
    ];

    // 6. Save updated database
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
 * 
 * Priority:
 * 1. Google Drive (if configured) with automatic sync
 * 2. Local file (fallback)
 * 3. Empty array (if both fail)
 * 
 * @returns Array of photo objects
 */
export async function getDatabase() {
  const drive = getDriveClient();

  if (drive) {
    // Attempt sync on every load as requested
    const syncedPhotos = await syncWithDrive();
    if (syncedPhotos) return syncedPhotos;
  }

  // Fallback to local raw if Drive sync fails or is not configured
  return await getDatabaseRaw();
}

/**
 * Save photos database to local storage and optionally to Google Drive
 * 
 * Strategy:
 * - Always saves to local first (fast, reliable backup)
 * - Also saves to Drive if configured (persistent across deployments)
 * 
 * @param data - Array of photo objects to save
 */
export async function saveDatabase(data: any[]) {
  const drive = getDriveClient();
  const folderId = getFolderId();

  // === Always save locally first (immediate backup) ===
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
      LOCAL_DB_PATH,
      JSON.stringify({ photos: data }, null, 2),
      'utf-8'
    );
    console.log('[Local DB] Database saved successfully');
  } catch (error) {
    console.error('[Local DB] Failed to save local database:', error);
    // Don't throw - try Drive anyway
  }

  // === Also save to Drive if configured ===
  if (!drive || !folderId) {
    console.log('[Google Drive] Not configured, using local storage only');
    return;
  }

  try {
    const file = await findFile(DB_FILENAME);
    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2),
    };

    await retryWithBackoff(async () => {
      if (file) {
        // Update existing file
        return await drive.files.update({
          fileId: file.id!,
          media: media,
        });
      } else {
        // Create new file
        return await drive.files.create({
          requestBody: {
            name: DB_FILENAME,
            parents: [folderId],
          },
          media: media,
        });
      }
    });
    console.log('[Google Drive] Database saved to Drive successfully');
  } catch (e) {
    console.error('[Google Drive] Failed to save database to Drive (local backup exists):', e);
    // Don't throw - local save succeeded
  }
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
