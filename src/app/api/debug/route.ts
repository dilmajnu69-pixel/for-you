import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const status = {
    timestamp: new Date().toISOString(),
    environment: {
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REFRESH_TOKEN: !!process.env.GOOGLE_REFRESH_TOKEN,
      GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
    },
    serviceAccountTest: 'Not Run',
    oauthTest: 'Not Run',
    overallStatus: 'Checking...',
  };

  // 1. Test Service Account
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      let key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim().replace(/^["']|["']$/g, '');
      if (!key.includes('BEGIN PRIVATE KEY')) {
        key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
      }
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: key,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      const drive = google.drive({ version: 'v3', auth });
      await drive.about.get({ fields: 'user' });
      status.serviceAccountTest = '✅ Working';
    } catch (e: any) {
      status.serviceAccountTest = `❌ Failed: ${e.message}`;
    }
  } else {
    status.serviceAccountTest = '⚠️ Skipped (Missing variables)';
  }

  // 2. Test OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      const drive = google.drive({ version: 'v3', auth });
      await drive.about.get({ fields: 'user' });
      status.oauthTest = '✅ Working';
    } catch (e: any) {
      status.oauthTest = `❌ Failed: ${e.message}`;
    }
  } else {
    status.oauthTest = '⚠️ Skipped (Missing variables)';
  }

  status.overallStatus = (status.serviceAccountTest.includes('✅') || status.oauthTest.includes('✅'))
    ? '✅ READY'
    : '❌ NOT CONFIGURED';

  return NextResponse.json(status);
}
