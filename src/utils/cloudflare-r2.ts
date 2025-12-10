/**
 * Cloudflare R2 Storage Utilities
 * S3-compatible client for videos, documents, and private files
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  MediaType,
  PrivacyLevel,
  CloudflareUploadResult,
  SignedUrlResponse,
} from '~/types/media';

/**
 * R2 Configuration interface
 */
interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBucket?: string;
  endpoint: string;
}

/**
 * Get R2 configuration from environment variables
 */
function getR2Config(): R2Config {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicBucket = process.env.CLOUDFLARE_R2_PUBLIC_BUCKET;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
    throw new Error('Cloudflare R2 configuration missing. Check environment variables.');
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBucket,
    endpoint,
  };
}

/**
 * Create an S3 client configured for Cloudflare R2
 */
function createR2Client(): S3Client {
  const config = getR2Config();

  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * Generate a unique storage key for a file
 */
export function generateStorageKey(
  filename: string,
  privacyLevel: PrivacyLevel,
  ownerType: string,
  ownerId: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = filename.split('.').pop() || '';

  // Structure: {privacy}/{ownerType}/{ownerId}/{timestamp}-{random}.{ext}
  return `${privacyLevel}/${ownerType}/${ownerId}/${timestamp}-${random}.${extension}`;
}

/**
 * Get the appropriate bucket for the privacy level
 */
function getBucketForPrivacy(privacyLevel: PrivacyLevel): string {
  const config = getR2Config();

  // Public files go to public bucket if configured, otherwise use private with public access
  if (privacyLevel === 'public' && config.publicBucket) {
    return config.publicBucket;
  }

  return config.bucketName;
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  file: File | Buffer,
  options: {
    filename: string;
    contentType: string;
    privacyLevel: PrivacyLevel;
    ownerType: string;
    ownerId: string;
    metadata?: Record<string, string>;
  }
): Promise<CloudflareUploadResult> {
  const client = createR2Client();
  const config = getR2Config();

  const storageKey = generateStorageKey(
    options.filename,
    options.privacyLevel,
    options.ownerType,
    options.ownerId
  );

  const bucket = getBucketForPrivacy(options.privacyLevel);

  // Convert File to Buffer if needed
  let body: Buffer;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    body = Buffer.from(arrayBuffer);
  } else {
    body = file;
  }

  const putParams: PutObjectCommandInput = {
    Bucket: bucket,
    Key: storageKey,
    Body: body,
    ContentType: options.contentType,
    Metadata: {
      'original-filename': options.filename,
      'privacy-level': options.privacyLevel,
      'owner-type': options.ownerType,
      'owner-id': options.ownerId,
      ...options.metadata,
    },
  };

  // Set cache control for public files
  if (options.privacyLevel === 'public') {
    putParams.CacheControl = 'public, max-age=31536000'; // 1 year
  }

  try {
    await client.send(new PutObjectCommand(putParams));

    // Generate CDN URL for public files
    let cdnUrl: string | undefined;
    if (options.privacyLevel === 'public' && config.publicBucket) {
      // Public bucket should have a custom domain configured
      cdnUrl = `https://${config.publicBucket}.${config.accountId}.r2.cloudflarestorage.com/${storageKey}`;
    }

    return {
      success: true,
      id: storageKey,
      filename: options.filename,
      cdn_url: cdnUrl,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      id: '',
      filename: options.filename,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(
  storageKey: string,
  privacyLevel: PrivacyLevel = 'public'
): Promise<{ success: boolean; error?: string }> {
  const client = createR2Client();
  const bucket = getBucketForPrivacy(privacyLevel);

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    );

    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Generate a signed URL for accessing a private file
 */
export async function generateR2SignedUrl(
  storageKey: string,
  privacyLevel: PrivacyLevel = 'user',
  expiresIn: number = 3600 // 1 hour default
): Promise<SignedUrlResponse> {
  const client = createR2Client();
  const bucket = getBucketForPrivacy(privacyLevel);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  });

  const url = await getSignedUrl(client, command, { expiresIn });

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    url,
    expires_at: expiresAt,
  };
}

/**
 * Generate a presigned URL for direct client uploads
 */
export async function generatePresignedUploadUrl(
  options: {
    filename: string;
    contentType: string;
    privacyLevel: PrivacyLevel;
    ownerType: string;
    ownerId: string;
  },
  expiresIn: number = 3600 // 1 hour default
): Promise<{
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
}> {
  const client = createR2Client();

  const storageKey = generateStorageKey(
    options.filename,
    options.privacyLevel,
    options.ownerType,
    options.ownerId
  );

  const bucket = getBucketForPrivacy(options.privacyLevel);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: options.contentType,
    Metadata: {
      'original-filename': options.filename,
      'privacy-level': options.privacyLevel,
      'owner-type': options.ownerType,
      'owner-id': options.ownerId,
    },
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    uploadUrl,
    storageKey,
    expiresAt,
  };
}

/**
 * Check if a file exists in R2
 */
export async function fileExistsInR2(
  storageKey: string,
  privacyLevel: PrivacyLevel = 'public'
): Promise<boolean> {
  const client = createR2Client();
  const bucket = getBucketForPrivacy(privacyLevel);

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the public URL for a file (only works for public files)
 */
export function getR2PublicUrl(storageKey: string): string | null {
  const publicBucket = process.env.CLOUDFLARE_R2_PUBLIC_BUCKET;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!publicBucket || !accountId) {
    return null;
  }

  // This assumes you have a custom domain or public access configured
  return `https://${publicBucket}.${accountId}.r2.cloudflarestorage.com/${storageKey}`;
}

/**
 * Expiration times for different privacy levels
 */
export const SIGNED_URL_EXPIRATION = {
  user: 3600, // 1 hour for user documents
  vendor: 86400, // 24 hours for vendor files
  admin: 3600, // 1 hour for admin files
  public: 0, // Public files don't need signed URLs
} as const;

/**
 * Get the appropriate expiration time for a privacy level
 */
export function getExpirationForPrivacy(privacyLevel: PrivacyLevel): number {
  return SIGNED_URL_EXPIRATION[privacyLevel] || 3600;
}

/**
 * Determine media type from content type
 */
export function getMediaTypeFromContentType(contentType: string): MediaType {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return 'document';
}
