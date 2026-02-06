/**
 * Photos API Route
 * 
 * Handles GET and POST requests for photo management.
 * - GET: Retrieve all photos sorted by date (newest first)
 * - POST: Upload new photo to Google Drive or local storage
 */

import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, uploadFile } from '@/lib/google-drive';

/**
 * GET /api/photos
 * Retrieve all photos from database, sorted by date descending
 * 
 * @returns JSON array of photo objects
 */
export async function GET() {
  try {
    const photos = await getDatabase();

    // Sort by date descending (newest first)
    photos.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(photos);
  } catch (error: any) {
    console.error('Failed to read photos database:', error);
    // Return empty array on error (handles first run gracefully)
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * POST /api/photos
 * Upload a new photo and save to database
 * 
 * Accepts either:
 * - File upload (multipart/form-data with 'file' field)
 * - External URL (form data with 'src' field)
 * 
 * Required fields: caption, date, and either file or src
 * 
 * @param request - FormData containing photo details
 * @returns JSON with newly created photo object
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const caption = formData.get('caption') as string;
    const date = formData.get('date') as string;
    const srcUrl = formData.get('src') as string;
    const file = formData.get('file') as File;

    let finalUrl = srcUrl || '';

    // Upload file to Google Drive or local storage if provided
    if (file) {
      finalUrl = await uploadFile(file);
    }

    // Validate required fields (only finalUrl is strictly required)
    if (!finalUrl) {
      return NextResponse.json(
        { error: 'Missing image source (file or URL)' },
        { status: 400 }
      );
    }

    // Default values for optional fields
    const finalCaption = caption || '';
    const finalDate = date || new Date().toISOString();

    // Create new photo object
    const newPhoto = {
      id: Date.now(), // Use timestamp as unique ID
      src: finalUrl,
      caption: finalCaption,
      date: finalDate
    };

    // Save to database (both local and Drive)
    const photos = await getDatabase();
    photos.push(newPhoto);
    await saveDatabase(photos);

    return NextResponse.json(newPhoto);

  } catch (error: any) {
    console.error('Photo upload failed:', error);
    return NextResponse.json(
      { error: error.message || 'Photo upload failed' },
      { status: 500 }
    );
  }
}
