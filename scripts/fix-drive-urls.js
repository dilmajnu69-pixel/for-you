/**
 * Migration Script: Fix Broken Google Drive Image URLs
 * 
 * Problem: Existing photos use thumbnail URLs (lh3.googleusercontent.com/drive-storage/)
 * that require authentication and expire, causing images to break.
 * 
 * Solution: Extract file IDs from broken URLs and convert to public direct links.
 * 
 * Run: node scripts/fix-drive-urls.js
 */

const fs = require('fs');
const path = require('path');

const PHOTOS_JSON_PATH = path.join(__dirname, '..', 'data', 'photos.json');

// Extract Google Drive file ID from various URL formats
function extractDriveFileId(url) {
  // Format 1: lh3.googleusercontent.com/drive-storage/...
  // These URLs don't contain the file ID, they're temporary thumbnails
  // We can't recover from these - they need to be reuploaded

  // Format 2: drive.google.com/uc?export=view&id=FILE_ID
  const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  // Format 3: drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  return null;
}

function fixPhotosUrls() {
  try {
    // Read photos.json
    const data = fs.readFileSync(PHOTOS_JSON_PATH, 'utf-8');
    const photosData = JSON.parse(data);
    let photos = photosData.photos || [];

    console.log(`\n🔍 Checking ${photos.length} photos...\n`);

    let fixed = 0;
    let broken = 0;
    let unchanged = 0;

    photos = photos.map(photo => {
      const url = photo.src;

      // Skip non-Drive URLs
      if (!url.includes('googleusercontent.com') && !url.includes('drive.google.com')) {
        unchanged++;
        return photo;
      }

      // Check if it's a broken thumbnail URL
      if (url.includes('lh3.googleusercontent.com/drive-storage/')) {
        console.log(`❌ BROKEN (can't recover): ${photo.caption}`);
        console.log(`   URL: ${url.substring(0, 80)}...`);
        console.log(`   → This photo needs to be re-uploaded manually\n`);
        broken++;
        return photo;
      }

      // Try to extract file ID and fix URL
      const fileId = extractDriveFileId(url);
      if (fileId) {
        const newUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        if (url !== newUrl) {
          console.log(`✅ FIXED: ${photo.caption}`);
          console.log(`   Old: ${url.substring(0, 60)}...`);
          console.log(`   New: ${newUrl}\n`);
          fixed++;
          return { ...photo, src: newUrl };
        }
      }

      unchanged++;
      return photo;
    });

    // Save updated photos
    if (fixed > 0) {
      fs.writeFileSync(
        PHOTOS_JSON_PATH,
        JSON.stringify({ photos }, null, 2),
        'utf-8'
      );
      console.log(`\n✅ Migration complete!`);
      console.log(`   Fixed: ${fixed}`);
      console.log(`   Broken (need re-upload): ${broken}`);
      console.log(`   Unchanged: ${unchanged}\n`);
    } else {
      console.log(`\n⚠️  No URLs needed fixing.`);
      console.log(`   Broken (need re-upload): ${broken}`);
      console.log(`   Unchanged: ${unchanged}\n`);
    }

    if (broken > 0) {
      console.log(`\n⚠️  ACTION REQUIRED:`);
      console.log(`   ${broken} photo(s) have broken URLs that can't be automatically recovered.`);
      console.log(`   These photos need to be re-uploaded via /manage/gallery\n`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
fixPhotosUrls();
