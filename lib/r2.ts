import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  HeadBucketCommand,
  ListBucketsCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Cloudflare R2 configuration
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '55fc5f80c61658b7e377f24753627533';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'eeb26ad402ad81e3a9b4ae5cbf8105ec9a01cda43403dffe76759179d5d09217';
const R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://bd5e8fdcf204f2176a5054c83d305f64.r2.cloudflarestorage.com';
// Use a simple bucket name that's easier to work with
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'profile-pictures';
// Use the public URL for direct access with the correct Cloudflare public endpoint format
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-bd5e8fdcf204f2176a5054c83d305f64.r2.dev';

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Check if bucket exists - no longer tries to create it
export async function checkBucketAccess(): Promise<boolean> {
  try {
    // First check if we can access the bucket
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
      console.log(`R2 bucket ${R2_BUCKET_NAME} exists and is accessible`);
      return true;
    } catch (error: any) {
      // If it's a 404 error, the bucket doesn't exist
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        console.log(`R2 bucket ${R2_BUCKET_NAME} doesn't exist`);
        console.log("Please create the bucket manually in your Cloudflare dashboard");
        return false;
      }
      
      // If it's an access denied error, we don't have permission
      if (error.name === "AccessDenied" || error.Code === "AccessDenied" || error.$metadata?.httpStatusCode === 403) {
        console.log(`Access denied to R2 bucket ${R2_BUCKET_NAME}`);
        console.log("Please check your R2 credentials and permissions");
        return false;
      }
      
      // Any other error
      console.error("Unknown error checking bucket:", error);
      return false;
    }
  } catch (error) {
    console.error('Error checking bucket access:', error);
    return false;
  }
}

/**
 * Upload a file to Cloudflare R2
 * @param file - The file buffer to upload
 * @param userId - The user ID (used for creating unique paths)
 * @param mimeType - The MIME type of the file
 * @returns The URL of the uploaded file
 */
export async function uploadFileToR2(
  file: Buffer,
  userId: string,
  mimeType: string
): Promise<string> {
  try {
    // Check bucket access before attempting upload
    const bucketAccessible = await checkBucketAccess();
    if (!bucketAccessible) {
      throw new Error(`R2 bucket "${R2_BUCKET_NAME}" is not accessible. Please check your R2 configuration and ensure the bucket exists.`);
    }
    
    // Generate a unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileExtension = getExtensionFromMimeType(mimeType);
    
    // Create a path with user ID for organization
    const fileName = `profiles/${userId}/profile-${timestamp}-${randomString}${fileExtension}`;
    
    // Upload to R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: mimeType,
        ACL: 'public-read', // Make file publicly accessible
        Metadata: {
          userId: userId,
          uploadedAt: new Date().toISOString(),
        },
      })
    );
    
    // Return the public URL for the object using the Cloudflare public endpoint
    return `${R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}

/**
 * Get a presigned URL for a file in R2
 * @param filePath - The full path to the file in R2
 * @returns A presigned URL that allows temporary access to the file
 */
export async function getPresignedUrl(filePath: string): Promise<string> {
  try {
    // If the file is already using the public URL, just return it
    if (filePath.startsWith(R2_PUBLIC_URL)) {
      return filePath;
    }
    
    // Extract the key from the full path
    const key = filePath.replace(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/`, '');
    
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    
    // Create a presigned URL that expires in 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return filePath; // Return original URL if failed
  }
}

/**
 * Delete a file from R2
 * @param filePath - The full path to the file in R2
 */
export async function deleteFileFromR2(filePath: string): Promise<void> {
  try {
    // Extract the key from the URL - handle both direct public URLs and S3 endpoint URLs
    let key;
    if (filePath.startsWith(R2_PUBLIC_URL)) {
      key = filePath.replace(`${R2_PUBLIC_URL}/`, '');
    } else if (filePath.includes(R2_BUCKET_NAME)) {
      key = filePath.replace(`${R2_ENDPOINT}/${R2_BUCKET_NAME}/`, '');
    } else {
      throw new Error(`Cannot extract key from URL: ${filePath}`);
    }
    
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    throw error;
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  
  return mimeToExt[mimeType] || '.jpg';
}

/**
 * Check if a file path is a valid R2 URL
 */
export function isR2Url(url: string): boolean {
  if (!url) return false;
  return url.includes(R2_ENDPOINT) || url.includes(R2_PUBLIC_URL);
}

/**
 * Create a direct URL for a file in R2 that works in the browser
 */
export function getPublicUrl(filePath: string): string {
  // If it's already a full URL, return it
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  // If it's just a key, create the full public URL
  return `${R2_PUBLIC_URL}/${filePath}`;
} 