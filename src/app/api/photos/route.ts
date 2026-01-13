import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

// Helper to read/write JSON DB
const DB_PATH = path.join(process.cwd(), 'data', 'photos.json');
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

export async function GET() {
  const photos = getPhotos();
  const sorted = [...photos].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const caption = formData.get('caption') as string;
    const date = formData.get('date') as string;

    // Check for web URL first
    const srcUrl = formData.get('src') as string;
    let finalUrl = srcUrl || '';

    // If file provided, upload it
    const file = formData.get('file') as File;

    if (file) {
      // Local Filesystem Upload
      // Ensure directory exists
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      // Sanitize filename
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      await writeFile(filePath, buffer);

      finalUrl = `/uploads/${fileName}`;
    }

    if (!finalUrl || !caption || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update JSON Database
    const photos = getPhotos();
    const newPhoto = {
      id: Date.now(),
      src: finalUrl,
      caption,
      date
    };

    photos.push(newPhoto);
    savePhotos(photos);

    return NextResponse.json(newPhoto);

  } catch (error: any) {
    console.error('Server Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Server upload failed' },
      { status: 500 }
    );
  }
}
