import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';

// Parse .env.local manually
const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=["']?([^"']+)["']?$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

async function deleteDriveDatabase() {
  try {
    const serviceAccountEmail = env.GOOGLE_CLIENT_EMAIL;
    const privateKey = env.GOOGLE_PRIVATE_KEY;
    const folderId = env.GOOGLE_DRIVE_FOLDER_ID;

    if (!serviceAccountEmail || !privateKey || !folderId) {
      console.log('❌ Google Drive not configured. Nothing to delete.');
      return;
    }

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('🔍 Searching for photos.json on Google Drive...');
    const res = await drive.files.list({
      q: `'${folderId}' in parents and name = 'photos.json' and trashed = false`,
      fields: 'files(id, name)',
    });

    const file = res.data.files?.[0];
    
    if (!file) {
      console.log('✅ No photos.json found on Drive. Local file will be used.');
      return;
    }

    console.log(`📁 Found photos.json (ID: ${file.id})`);
    console.log('🗑️  Deleting from Google Drive...');

    await drive.files.delete({ fileId: file.id });

    console.log('✅ Successfully deleted photos.json from Google Drive!');
    console.log('📝 The app will now use the local photos.json file.');
    console.log('💡 New uploads will recreate the file on Drive with correct URLs.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteDriveDatabase();
