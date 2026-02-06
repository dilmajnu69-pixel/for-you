const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function deleteDriveDatabase() {
  try {
    // Initialize Drive client
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

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

    // Find photos.json on Drive
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
