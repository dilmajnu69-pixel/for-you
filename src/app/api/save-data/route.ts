/**
 * Data Persistence API Route
 * 
 * Handles GET and POST requests for persisting non-photo data to JSON files.
 * Supports: messages, special-dates, and music/songs
 * 
 * This ensures data changes in the UI are saved to the filesystem.
 */

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Supported data types and their file mappings
 */
const DATA_TYPE_MAP = {
  messages: { filename: 'messages.json', storageKey: 'messages' },
  'special-dates': { filename: 'special-dates.json', storageKey: 'specialDates' },
  music: { filename: 'music.json', storageKey: 'songs' },
  songs: { filename: 'music.json', storageKey: 'songs' },
} as const;

type DataType = keyof typeof DATA_TYPE_MAP;

/**
 * POST /api/save-data
 * Save data array to corresponding JSON file
 * 
 * Request body: { type: DataType, data: Array }
 * 
 * @param request - JSON body with type and data
 * @returns Success status
 */
export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    // Validate request
    if (!type || !(type in DATA_TYPE_MAP)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: messages, special-dates, music, or songs' },
        { status: 400 }
      );
    }

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Missing or invalid data. Must be an array' },
        { status: 400 }
      );
    }

    // Get file configuration
    const config = DATA_TYPE_MAP[type as DataType];
    const filePath = path.join(process.cwd(), 'data', config.filename);

    // Wrap data in appropriate key and save
    const content = {
      [config.storageKey]: data
    };

    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');

    console.log(`[Save Data] ${type} saved successfully (${data.length} items)`);
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
 * Retrieve data array from corresponding JSON file
 * 
 * Query param: type (messages | special-dates | music | songs)
 * 
 * @param request - Request with type query parameter
 * @returns JSON array of data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Validate type parameter
    if (!type || !(type in DATA_TYPE_MAP)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter' },
        { status: 400 }
      );
    }

    // Get file configuration and read file
    const config = DATA_TYPE_MAP[type as DataType];
    const filePath = path.join(process.cwd(), 'data', config.filename);

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(fileContent);

    // Extract data array from JSON structure
    const data = json[config.storageKey];

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('[Save Data] Failed to read:', error);
    // Return empty array on error (handles first run gracefully)
    return NextResponse.json([], { status: 200 });
  }
}
