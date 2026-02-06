# Google Drive Setup Guide

This guide will help you set up Google Drive integration for persistent photo storage in production.

## Why Google Drive?

When deployed to Vercel (or similar platforms), the filesystem is ephemeral. Photos uploaded to `/public/uploads/` will be **lost** on the next deployment. Google Drive provides free, permanent storage (15GB) for your photos.

## How It Works

```
Upload Flow with Retry:
1. Try Google Drive (3 attempts with exponential backoff)
   ├─ Success → Photo URL saved to photos.json
   └─ Fail → Automatic fallback to local storage
2. Local storage always works as backup
```

## Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it (e.g., "Compliments App") → Click "Create"
4. Wait for project creation to complete

### Step 2: Enable Google Drive API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click on it → Click **"Enable"**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: "Compliments App"
   - User support email: your email
   - Developer contact: your email
   - Click **Save and Continue** through all steps
4. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Compliments App Client"
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
   - Click **Create**
5. **IMPORTANT**: Copy your **Client ID** and **Client Secret** - save them somewhere safe!

### Step 4: Generate Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in top right → Check **"Use your own OAuth credentials"**
3. Enter your **Client ID** and **Client Secret** from Step 3
4. In the left sidebar:
   - Find **"Drive API v3"**
   - Check `https://www.googleapis.com/auth/drive`
5. Click **"Authorize APIs"**
6. Sign in with your Google account
7. Click **"Allow"** to grant permissions
8. Click **"Exchange authorization code for tokens"**
9. **Copy the Refresh Token** - you'll need this!

### Step 5: Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder (e.g., "Compliments App Photos")
3. Open the folder
4. Copy the **Folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/1ABC...XYZ
                                           ^^^^^^^^^^
                                           This is the folder ID
   ```

### Step 6: Configure Environment Variables

#### For Local Development:

1. Create `.env.local` file in your project root (if it doesn't exist)
2. Add these variables (replace with your actual values):

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

3. **IMPORTANT**: Never commit `.env.local` to Git! (It's in `.gitignore`)

#### For Vercel Production:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these 4 variables one by one:
   - `GOOGLE_CLIENT_ID` = your client ID
   - `GOOGLE_CLIENT_SECRET` = your client secret
   - `GOOGLE_REFRESH_TOKEN` = your refresh token
   - `GOOGLE_DRIVE_FOLDER_ID` = your folder ID
4. Click **Save**
5. **Redeploy** your app (required for env vars to take effect)

### Step 7: Test the Integration

1. **Local test**: 
   ```bash
   npm run dev
   ```
   - Check console for: `[Google Drive] Client initialized successfully`
   - Upload a photo via `/manage/gallery`
   - Look for: `[Google Drive] File uploaded successfully: https://...`
   - Check your Google Drive folder - photo should be there!

2. **Production test** (after deploying to Vercel):
   - Upload a photo
   - Check Google Drive folder
   - Redeploy your app
   - Photo should still be visible ✅

## Troubleshooting

### "Client initialized successfully" but uploads fail

- Check that the folder ID is correct
- Verify the Google account that created the OAuth credentials has access to the folder
- Check Vercel logs for error details

### "Credentials not configured, using local storage fallback"

- Environment variables not set or incorrect
- Make sure variable names match exactly (case-sensitive)
- For Vercel: Did you redeploy after adding variables?

### Uploads work locally but not on Vercel

- Verify all 4 environment variables are in Vercel
- Check you redeployed after adding them
- Check Vercel function logs for errors

### Photos still disappear after Vercel redeploy

- Google Drive might not be configured properly
- Check server logs during upload - should see `[Google Drive] File uploaded successfully`
- If you see `[Local Storage] File uploaded` instead, Drive isn't working

## Retry Mechanism

The implementation includes automatic retries with exponential backoff:

- **3 retry attempts** for transient errors (network issues, timeouts, rate limits)
- **Exponential backoff**: 1s → 2s → 4s delays between retries
- **Smart error detection**: Only retries on recoverable errors
- **Automatic fallback**: Falls back to local storage after all retries fail

**Error types that trigger retry:**
- Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND)
- Rate limiting (429)
- Server errors (500, 503)

**Error types that don't retry:**
- Authentication errors (fixes needed in config)
- Bad requests (fixes needed in code)
- Permission errors (check Drive folder permissions)

## Fallback Behavior

The system is designed to **never fail completely**:

1. **Google Drive configured + working** → Photos go to Drive ✅
2. **Google Drive configured + API fails** → Retries 3 times → Falls back to local storage ⚠️
3. **Google Drive not configured** → Uses local storage immediately ℹ️

This means:
- ✅ **Local development**: Works perfectly without Drive setup
- ✅ **Production**: Set up Drive for persistence, but uploads won't break if Drive fails temporarily
- ⚠️ **Note**: Local storage photos are ephemeral in production (lost on redeploy)

## Security Notes

- **Never commit** `.env.local` or any file containing secrets to Git
- **Refresh tokens** grant permanent access - keep them secret!
- **Folder permissions**: The folder you created will be accessible to anyone with the link (photos are public)
- **Revoke access**: You can revoke the OAuth token anytime from [Google Account Security](https://myaccount.google.com/permissions)

## Benefits of This Implementation

✅ **Persistent storage** in production (photos survive redeployments)  
✅ **Free** (15GB Google Drive storage)  
✅ **Automatic fallback** ensures uploads never completely fail  
✅ **Retry mechanism** handles temporary network issues  
✅ **Works offline** (local dev doesn't require Drive)  
✅ **Easy migration** from local to cloud storage  

---

**Need help?** Check the console logs - they'll tell you exactly what's happening with each upload!
