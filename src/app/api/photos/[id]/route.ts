/**
 * Individual Photo API Route
 * 
 * Handles PUT and DELETE requests for individual photos by ID.
 * - PUT: Update photo details (caption, date, or replace image)
 * - DELETE: Remove photo and associated file from storage
 */

import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, uploadFile, deleteFileFromDrive } from '@/lib/google-drive';

/**
 * PUT /api/photos/[id]
 * Update an existing photo's details or replace its image
 * 
 * Can update:
 * - Caption and/or date (keep same image)
 * - Replace image with new file upload
 * - Replace image with external URL
 * 
 * When replacing image, automatically deletes old image from Drive
 * 
 * @param request - FormData with updated fields
 * @param params - Route params containing photo ID
 * @returns JSON with updated photo object
 */
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

    // Find photo in database
    const photos = await getDatabase();
    const photoIndex = photos.findIndex((p: any) => p.id === id);

    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const currentPhoto = photos[photoIndex];
    let newSrc = currentPhoto.src;

    // Handle image replacement
    if (file) {
      // Delete old image if it's on Drive
      if (currentPhoto.src && currentPhoto.src.includes('drive.google.com')) {
        await deleteFileFromDrive(currentPhoto.src);
      }

      // Upload new image
      newSrc = await uploadFile(file);

    } else if (srcUrl && srcUrl !== currentPhoto.src) {
      // Replace with external URL
      if (currentPhoto.src && currentPhoto.src.includes('drive.google.com')) {
        await deleteFileFromDrive(currentPhoto.src);
      }
      newSrc = srcUrl;
    }

    // Update photo object
    const updatedPhoto = {
      ...currentPhoto,
      caption: caption !== null ? caption : currentPhoto.caption,
      date: date !== null ? date : currentPhoto.date,
      src: newSrc
    };

    // Save to database
    photos[photoIndex] = updatedPhoto;
    await saveDatabase(photos);

    return NextResponse.json(updatedPhoto);

  } catch (error: any) {
    console.error('Failed to update photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update photo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/photos/[id]
 * Delete a photo and its associated file from storage
 * 
 * Process:
 * 1. Delete file from Google Drive (if stored there)
 * 2. Remove entry from database
 * 
 * @param request - Request object
 * @param params - Route params containing photo ID
 * @returns JSON with success status
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);

    // Find photo in database
    const photos = await getDatabase();
    const photoIndex = photos.findIndex((p: any) => p.id === id);

    if (photoIndex === -1) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = photos[photoIndex];

    // Delete file from Drive if stored there
    if (photo.src && photo.src.includes('drive.google.com')) {
      await deleteFileFromDrive(photo.src);
    }

    // Remove from database
    photos.splice(photoIndex, 1);
    await saveDatabase(photos);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
