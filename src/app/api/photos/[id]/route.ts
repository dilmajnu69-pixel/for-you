import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { unlink, writeFile } from 'fs/promises';

const DB_PATH = path.join(process.cwd(), 'data', 'photos.json');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function getPhotos() {
  if (!fs.existsSync(DB_PATH)) return [];
  const content = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    const json = JSON.parse(content);
    return Array.isArray(json) ? json : (json.photos || []);
  } catch (e) {
    return [];
  }
}

function savePhotos(photos: any[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ photos }, null, 2));
}

// PUT: Update Photo
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    const formData = await request.formData();

    const caption = formData.get('caption') as string;
    const date = formData.get('date') as string;
    const srcUrl = formData.get('src') as string;
    const file = formData.get('file') as File;

    const photos = getPhotos();
    const photoIndex = photos.findIndex((p: any) => p.id === id);

    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const currentPhoto = photos[photoIndex];
    let newSrc = currentPhoto.src;

    // Handle Image Update
    if (file) {
      // 1. Delete old file if it was local
      if (currentPhoto.src && currentPhoto.src.startsWith('/uploads/')) {
        const oldPath = path.join(PUBLIC_DIR, currentPhoto.src);
        try {
          if (fs.existsSync(oldPath)) await unlink(oldPath);
        } catch (e) { console.error("Failed to delete old file", e); }
      }

      // 2. Save new file
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      await writeFile(filePath, buffer);

      newSrc = `/uploads/${fileName}`;

    } else if (srcUrl && srcUrl !== currentPhoto.src) {
      // Handle URL change (delete old file if we are switching FROM local TO url)
      if (currentPhoto.src && currentPhoto.src.startsWith('/uploads/')) {
        const oldPath = path.join(PUBLIC_DIR, currentPhoto.src);
        try {
          if (fs.existsSync(oldPath)) await unlink(oldPath);
        } catch (e) { console.error("Failed to delete old file", e); }
      }
      newSrc = srcUrl;
    }

    // Update Object
    const updatedPhoto = {
      ...currentPhoto,
      caption: caption || currentPhoto.caption,
      date: date || currentPhoto.date,
      src: newSrc
    };

    photos[photoIndex] = updatedPhoto;
    savePhotos(photos);

    return NextResponse.json(updatedPhoto);

  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update photo' },
      { status: 500 }
    );
  }
}

// DELETE: Remove Photo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    const photos = getPhotos();
    const photoIndex = photos.findIndex((p: any) => p.id === id);

    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = photos[photoIndex];

    // 1. Delete from Filesystem (if it's a local upload)
    if (photo.src && photo.src.startsWith('/uploads/')) {
      const filePath = path.join(PUBLIC_DIR, photo.src);
      try {
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (err) {
        console.error('Failed to look up or delete file:', err);
      }
    }

    // 2. Remove from JSON
    photos.splice(photoIndex, 1);
    savePhotos(photos);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
