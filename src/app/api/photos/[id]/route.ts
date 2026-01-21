import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, uploadFile, deleteFileFromDrive } from '@/lib/google-drive';

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

    const photos = await getDatabase();
    const photoIndex = photos.findIndex((p: any) => p.id === id);

    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const currentPhoto = photos[photoIndex];
    let newSrc = currentPhoto.src;

    if (file) {
      // 1. Delete old file if from Drive
      if (currentPhoto.src && currentPhoto.src.includes('drive.google.com')) {
        await deleteFileFromDrive(currentPhoto.src);
      }

      // 2. Upload new
      newSrc = await uploadFile(file);

    } else if (srcUrl && srcUrl !== currentPhoto.src) {
      if (currentPhoto.src && currentPhoto.src.includes('drive.google.com')) {
        await deleteFileFromDrive(currentPhoto.src);
      }
      newSrc = srcUrl;
    }

    const updatedPhoto = {
      ...currentPhoto,
      caption: caption || currentPhoto.caption,
      date: date || currentPhoto.date,
      src: newSrc
    };

    photos[photoIndex] = updatedPhoto;
    await saveDatabase(photos);

    return NextResponse.json(updatedPhoto);

  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update photo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    const photos = await getDatabase();
    const photoIndex = photos.findIndex((p: any) => p.id === id);

    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = photos[photoIndex];

    // 1. Delete from Drive
    if (photo.src && photo.src.includes('drive.google.com')) {
      await deleteFileFromDrive(photo.src);
    }

    // 2. Remove from DB
    photos.splice(photoIndex, 1);
    await saveDatabase(photos);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
