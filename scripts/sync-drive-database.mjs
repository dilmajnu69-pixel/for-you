#!/usr/bin/env node
/**
 * Overwrite Google Drive photos.json with clean local version
 * This fixes the issue where Drive has broken photos
 */

import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const LOCAL_DB = path.join(__dirname, '../data/photos.json');


const DB_FILENAME = 'photos.json';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function main() {
  // === Initialize Drive client ===
  const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!serviceAccountEmail || !privateKey || !folderId) {
    console.error('❌ Missing Google Drive credentials in environment');
    process.exit(1);
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });
  console.log('✅ Drive client initialized');

  // === Read local database ===
  console.log('\n📖 Reading local photos.json...');
  const content = await fs.readFile(LOCAL_DB, 'utf-8');
  const json = JSON.parse(content);
  const photos = Array.isArray(json) ? json : (json.photos || []);

  console.log(`✅ Found ${photos.length} photo(s) in local database:`);
  photos.forEach(p => console.log(`   - ${p.caption} (${p.date})`));

  // === Find existing Drive database ===
  console.log('\n🔍 Looking for photos.json on Drive...');
  const query = `name='${DB_FILENAME}' and '${folderId}' in parents and trashed=false`;
  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });

  const file = res.data.files?.[0];

  // === Update or create Drive database ===
  const media = {
    mimeType: 'application/json',
    body: JSON.stringify(photos, null, 2),
  };

  if (file) {
    console.log(`✅ Found existing file (ID: ${file.id})`);
    console.log('📤 Updating Drive database...');
    await drive.files.update({
      fileId: file.id,
      media: media,
    });
    console.log('✅ Drive database updated!');
  } else {
    console.log('⚠️  No existing file found, creating new one...');
    console.log('📤 Creating Drive database...');
    await drive.files.create({
      requestBody: {
        name: DB_FILENAME,
        parents: [folderId],
      },
      media: media,
    });
    console.log('✅ Drive database created!');
  }

  // === Verify ===
  console.log('\n🔍 Verifying Drive database...');
  const verifyRes = await drive.files.get({
    fileId: file?.id || (await drive.files.list({ q: query, fields: 'files(id)' })).data.files[0].id,
    alt: 'media',
  });

  const drivePhotos = verifyRes.data;
  console.log(`✅ Drive now has ${drivePhotos.length} photo(s):`);
  drivePhotos.forEach(p => console.log(`   - ${p.caption} (${p.date})`));


  console.log('\n✨ Done! Drive database is now synced with local.');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
