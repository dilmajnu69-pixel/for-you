/**
 * Data Persistence API Route
 * 
 * Handles GET and POST requests for persisting non-photo data to JSON files.
 * Supports: messages, special-dates, and music/songs
 * 
 * This ensures data changes in the UI are saved to the filesystem.
 */

import { NextResponse } from 'next/server';
import { getPersistentJSON, savePersistentJSON } from '@/lib/google-drive';

/**
 * Supported data types and their file mappings
 */
const DATA_TYPE_MAP = {
  messages: { filename: 'messages.json', storageKey: 'messages' },
  'special-dates': { filename: 'special-dates.json', storageKey: 'specialDates' },
  music: { filename: 'music.json', storageKey: 'songs' },
  songs: { filename: 'music.json', storageKey: 'songs' },
  'pet-names': { filename: 'pet-names.json', storageKey: 'petNames' },
  'love-letter': { filename: 'love-letter.json', storageKey: 'content' },
} as const;

type DataType = keyof typeof DATA_TYPE_MAP;

/**
 * POST /api/save-data
 * Save data array to corresponding JSON file with Google Drive sync
 */
export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    // Validate request
    if (!type || !(type in DATA_TYPE_MAP)) {
      return NextResponse.json(
        { error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Get file configuration
    const config = DATA_TYPE_MAP[type as DataType];

    // Wrap data in appropriate key
    const content = {
      [config.storageKey]: data
    };

    // Save with Google Drive sync
    await savePersistentJSON(config.filename, content);

    console.log(`[Save Data] ${type} persisted successfully (${Array.isArray(data) ? data.length : 'object'} items)`);
    return NextResponse.json({ success: true, message: `Saved ${type}` });

  } catch (error) {
    console.error('[Save Data] Failed to save:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/save-data?type=<DataType>
 * Retrieve data array with Google Drive sync
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !(type in DATA_TYPE_MAP)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter' },
        { status: 400 }
      );
    }

    const config = DATA_TYPE_MAP[type as DataType];
    const json = await getPersistentJSON<any>(config.filename);

    if (!json) {
      return NextResponse.json([]);
    }

    // Extract data array from JSON structure
    const data = json[config.storageKey];

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('[Save Data] Failed to read:', error);
    return NextResponse.json([], { status: 200 });
  }
}
