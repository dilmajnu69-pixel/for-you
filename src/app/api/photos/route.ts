import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, uploadFile } from '@/lib/google-drive';

export async function GET() {
  try {
    const photos = await getDatabase();
    // Sort by date descending
    photos.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return NextResponse.json(photos);
  } catch (error: any) {
    console.error('Drive DB Read Error:', error);
    return NextResponse.json([], { status: 200 }); // Return empty if failed (first run)
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const caption = formData.get('caption') as string;
    const date = formData.get('date') as string;
    const srcUrl = formData.get('src') as string;
    let finalUrl = srcUrl || '';

    const file = formData.get('file') as File;

    // Upload to Drive if file provided
    if (file) {
      finalUrl = await uploadFile(file);
    }

    if (!finalUrl || !caption || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update Drive DB
    const photos = await getDatabase();
    const newPhoto = {
      id: Date.now(),
      src: finalUrl,
      caption,
      date
    };

    photos.push(newPhoto);
    await saveDatabase(photos);

    return NextResponse.json(newPhoto);

  } catch (error: any) {
    console.error('Server Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Server upload failed' },
      { status: 500 }
    );
  }
}
