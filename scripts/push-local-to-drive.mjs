#!/usr/bin/env node
/**
 * Push local photos.json database to Google Drive
 * This overwrites the Drive database with the clean local version
 */

import { saveDatabase, getDatabase as getLocalDatabase } from '../src/lib/google-drive.ts';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB = path.join(__dirname, '../data/photos.json');

async function main() {
  try {
    console.log('📖 Reading local photos.json...');
    const content = await fs.readFile(LOCAL_DB, 'utf-8');
    const json = JSON.parse(content);
    const photos = Array.isArray(json) ? json : (json.photos || []);

    console.log(`✅ Found ${photos.length} photo(s) in local database`);
    photos.forEach(p => console.log(`   - ${p.caption} (${p.date})`));

    console.log('\n📤 Pushing to Google Drive...');
    await saveDatabase(photos);

    console.log('\n✅ Success! Drive database updated.');
    console.log('\n🔍 Verifying Drive database...');

    // Import dynamically to get the Drive version
    const { getDatabase } = await import('../src/lib/google-drive.ts');
    const drivePhotos = await getDatabase();

    console.log(`✅ Drive now has ${drivePhotos.length} photo(s)`);
    drivePhotos.forEach(p => console.log(`   - ${p.caption} (${p.date})`));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
