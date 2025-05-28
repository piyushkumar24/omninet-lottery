# Cloudflare R2 Storage Setup

This guide explains how to set up Cloudflare R2 for storing profile pictures in the lottery application.

## Overview

The application uses Cloudflare R2 as an S3-compatible storage service for user profile pictures. This provides:

- Reliable and scalable cloud storage
- Improved performance with Cloudflare's global network
- Better organization of user files
- Cost-effective storage solution

## Configuration Details

The following credentials are used to connect to Cloudflare R2:

```
Access Key ID: 55fc5f80c61658b7e377f24753627533
Secret Access Key: eeb26ad402ad81e3a9b4ae5cbf8105ec9a01cda43403dffe76759179d5d09217
S3-compatible Endpoint: https://bd5e8fdcf204f2176a5054c83d305f64.r2.cloudflarestorage.com
Bucket Name: profile-pictures
Public URL: https://pub-bd5e8fdcf204f2176a5054c83d305f64.r2.dev
```

## Setup Steps

### 1. Environment Configuration

Run the setup script to configure your environment:

```bash
npm run setup:r2
```

This will add the required environment variables to your `.env.local` file:

```
# Cloudflare R2 Storage Configuration
R2_ACCESS_KEY_ID="55fc5f80c61658b7e377f24753627533"
R2_SECRET_ACCESS_KEY="eeb26ad402ad81e3a9b4ae5cbf8105ec9a01cda43403dffe76759179d5d09217"
R2_ENDPOINT="https://bd5e8fdcf204f2176a5054c83d305f64.r2.cloudflarestorage.com"
R2_BUCKET_NAME="profile-pictures"
R2_PUBLIC_URL="https://pub-bd5e8fdcf204f2176a5054c83d305f64.r2.dev"
```

### 2. Manual Bucket Creation (REQUIRED)

The application CANNOT automatically create the bucket due to permission restrictions. You must create it manually:

1. Log in to Cloudflare dashboard at https://dash.cloudflare.com
2. Navigate to R2 from the sidebar
3. Click "Create bucket"
4. Enter "profile-pictures" as the bucket name
5. Click "Create bucket"

### 3. Configure Public Access (REQUIRED)

Enable Public Access for your R2 bucket (required for direct image URLs):

1. In your Cloudflare dashboard, go to R2
2. Select the "profile-pictures" bucket
3. Go to "Settings" > "Public access"
4. Toggle "Public access" to On
5. This will create a public endpoint with the format: `https://pub-{account-id}.r2.dev`

### 4. Set Up CORS Configuration (REQUIRED)

1. Select your bucket in the R2 dashboard
2. Go to the "Settings" tab
3. Scroll to "Cross-Origin Resource Sharing (CORS)"
4. Add a new rule with:
   - Allowed origins: `*` (or your specific domain)
   - Allowed methods: `GET`, `PUT`, `DELETE`
   - Allowed headers: `*`
   - Max age: `86400`

## Local Storage Fallback

The system includes a fallback to local storage if R2 is unavailable:

1. If the R2 bucket doesn't exist or isn't accessible, the system will automatically save files to local storage
2. The files will be saved in `/public/uploads/` with a unique filename
3. The user will still get their profile picture, just from a different source
4. The response will indicate which storage method was used

## Troubleshooting

If you encounter issues with R2 storage:

### Bucket Access Denied Error

If you see "Access denied to R2 bucket" or a similar error:

1. Verify that you have created the bucket manually in your Cloudflare dashboard
2. Check that the bucket name exactly matches "profile-pictures"
3. Ensure your API token has proper permissions (R2 Admin permission is needed)
4. Try running the connection test: `npm run setup:r2`

### Public Access Not Working

If images are uploaded but not displaying:

1. Make sure you've enabled public access for your bucket in Cloudflare settings
2. Verify that the R2_PUBLIC_URL format is correct: `https://pub-{account-id}.r2.dev`
3. Check that images are being stored with the correct path structure

### Authentication Errors

If you get authentication errors:

1. Check that the Access Key ID and Secret Access Key are correct in your .env.local file
2. Ensure the token is not expired in your Cloudflare dashboard
3. Create a new API token if necessary with R2 permissions

## File Organization

Profile pictures are stored with the following path structure:

```
profiles/
  ├── {userId1}/
  │     ├── profile-{timestamp}-{randomString}.jpg
  │     └── profile-{timestamp}-{randomString2}.jpg
  └── {userId2}/
        └── profile-{timestamp}-{randomString}.jpg
```

This organization ensures:
- Files are grouped by user ID
- Unique filenames prevent overwriting
- Easy cleanup of old files 