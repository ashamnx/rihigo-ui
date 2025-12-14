/**
 * Unified Media Client
 * Routes uploads to appropriate storage provider (Cloudflare Images or R2)
 * based on file type and provides a consistent API
 */

import { uploadToCloudflare, getCloudflareImageUrl } from './cloudflare-images';
import {
  uploadToR2,
  deleteFromR2,
  generateR2SignedUrl,
  generatePresignedUploadUrl,
  getExpirationForPrivacy,
} from './cloudflare-r2';
import {
  validateFile,
  getMediaType,
  getStorageProvider,
  type MediaType,
  type PrivacyLevel,
  type OwnerType,
  type MediaItem,
  type MediaVariant,
  type SignedUrlResponse,
  type FileValidationResult,
  type UploadConfig,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
} from '~/types/media';

/**
 * Upload options for the unified client
 */
export interface MediaUploadOptions {
  privacyLevel: PrivacyLevel;
  ownerType: OwnerType;
  ownerId: string;
  tags?: string[];
  metadata?: {
    alt?: string;
    description?: string;
    [key: string]: unknown;
  };
}

/**
 * Upload result from the unified client
 */
export interface MediaUploadResult {
  success: boolean;
  mediaType: MediaType | null;
  storageProvider: 'cloudflare_images' | 'cloudflare_r2' | null;
  storageKey: string;
  filename: string;
  cdnUrl?: string;
  variants?: MediaVariant[];
  error?: string;
}

/**
 * Upload a file to the appropriate storage provider
 * - Images go to Cloudflare Images for automatic optimization
 * - Videos and documents go to Cloudflare R2
 */
export async function uploadMedia(
  file: File,
  options: MediaUploadOptions
): Promise<MediaUploadResult> {
  // Validate the file
  const validation = validateFile(file);

  if (!validation.valid || !validation.type) {
    return {
      success: false,
      mediaType: null,
      storageProvider: null,
      storageKey: '',
      filename: file.name,
      error: validation.error || 'Invalid file',
    };
  }

  const mediaType = validation.type;
  const storageProvider = getStorageProvider(mediaType);

  try {
    if (storageProvider === 'cloudflare_images') {
      // Upload images to Cloudflare Images
      const result = await uploadToCloudflare(file, {
        activityId: options.ownerType === 'activity' ? options.ownerId : undefined,
        tags: options.tags,
        description: options.metadata?.description,
        alt: options.metadata?.alt,
      });

      if (!result.success) {
        return {
          success: false,
          mediaType,
          storageProvider,
          storageKey: '',
          filename: file.name,
          error: result.errors[0]?.message || 'Upload failed',
        };
      }

      // Get responsive image URLs
      const accountHash = process.env.CLOUDFLARE_IMAGES_HASH;
      const variants: MediaVariant[] = accountHash
        ? [
            { name: 'thumbnail', url: getCloudflareImageUrl(result.result.id, 'thumbnail', accountHash), width: 200, height: 200 },
            { name: 'small', url: getCloudflareImageUrl(result.result.id, 'small', accountHash), width: 400, height: 400 },
            { name: 'medium', url: getCloudflareImageUrl(result.result.id, 'medium', accountHash), width: 800, height: 800 },
            { name: 'large', url: getCloudflareImageUrl(result.result.id, 'large', accountHash), width: 1200, height: 1200 },
            { name: 'public', url: getCloudflareImageUrl(result.result.id, 'public', accountHash) },
          ]
        : [];

      return {
        success: true,
        mediaType,
        storageProvider,
        storageKey: result.result.id,
        filename: result.result.filename,
        cdnUrl: variants.find((v) => v.name === 'public')?.url,
        variants,
      };
    } else {
      // Upload videos and documents to R2
      const result = await uploadToR2(file, {
        filename: file.name,
        contentType: file.type,
        privacyLevel: options.privacyLevel,
        ownerType: options.ownerType,
        ownerId: options.ownerId,
        metadata: options.metadata
          ? Object.fromEntries(
              Object.entries(options.metadata).map(([k, v]) => [k, String(v)])
            )
          : undefined,
      });

      if (!result.success) {
        return {
          success: false,
          mediaType,
          storageProvider,
          storageKey: '',
          filename: file.name,
          error: result.error || 'Upload failed',
        };
      }

      return {
        success: true,
        mediaType,
        storageProvider,
        storageKey: result.id,
        filename: result.filename,
        cdnUrl: result.cdn_url,
      };
    }
  } catch (error) {
    console.error('Media upload error:', error);
    return {
      success: false,
      mediaType,
      storageProvider,
      storageKey: '',
      filename: file.name,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete media from storage
 */
export async function deleteMedia(
  storageKey: string,
  storageProvider: 'cloudflare_images' | 'cloudflare_r2',
  privacyLevel: PrivacyLevel = 'public'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (storageProvider === 'cloudflare_images') {
      // Import and use deleteCloudflareImage
      const { deleteCloudflareImage } = await import('./cloudflare-images');
      const result = await deleteCloudflareImage(storageKey);
      return { success: result.success };
    } else {
      return await deleteFromR2(storageKey, privacyLevel);
    }
  } catch (error) {
    console.error('Media delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Get a URL for accessing media
 * - Public files return CDN URL directly
 * - Private files return a signed URL
 */
export async function getMediaUrl(
  media: Pick<MediaItem, 'storage_provider' | 'storage_key' | 'privacy_level' | 'cdn_url' | 'variants'>,
  variant?: string
): Promise<string | null> {
  // For public files, return CDN URL
  if (media.privacy_level === 'public') {
    if (media.storage_provider === 'cloudflare_images') {
      // Return variant URL if available
      if (variant && media.variants) {
        const variantData = media.variants.find((v) => v.name === variant);
        if (variantData) return variantData.url;
      }
      // Fall back to public variant or cdn_url
      return media.variants?.find((v) => v.name === 'public')?.url || media.cdn_url || null;
    }
    return media.cdn_url || null;
  }

  // For private files, generate signed URL
  if (media.storage_provider === 'cloudflare_r2') {
    const expiration = getExpirationForPrivacy(media.privacy_level);
    const signedUrl = await generateR2SignedUrl(
      media.storage_key,
      media.privacy_level,
      expiration
    );
    return signedUrl.url;
  }

  // Cloudflare Images with requireSignedURLs would need different handling
  // For now, return null for private Cloudflare Images
  return null;
}

/**
 * Get signed URL for a private file
 */
export async function getSignedMediaUrl(
  storageKey: string,
  storageProvider: 'cloudflare_images' | 'cloudflare_r2',
  privacyLevel: PrivacyLevel
): Promise<SignedUrlResponse | null> {
  if (storageProvider === 'cloudflare_r2') {
    const expiration = getExpirationForPrivacy(privacyLevel);
    return await generateR2SignedUrl(storageKey, privacyLevel, expiration);
  }

  // Cloudflare Images signed URLs would need additional implementation
  return null;
}

/**
 * Get a presigned upload URL for direct client uploads (large files)
 */
export async function getPresignedUpload(options: {
  filename: string;
  contentType: string;
  privacyLevel: PrivacyLevel;
  ownerType: OwnerType;
  ownerId: string;
}): Promise<{
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
} | null> {
  const mediaType = getMediaType(options.contentType);

  // Only R2 supports presigned uploads
  if (!mediaType || getStorageProvider(mediaType) !== 'cloudflare_r2') {
    return null;
  }

  return await generatePresignedUploadUrl(options);
}

/**
 * Validate a file before upload
 */
export function validateMediaFile(
  file: { type: string; size: number },
  config?: Partial<UploadConfig>
): FileValidationResult {
  return validateFile(file, config);
}

/**
 * Get allowed file types based on media type
 */
export function getAllowedTypes(mediaTypes: MediaType[]): string[] {
  const types: string[] = [];

  if (mediaTypes.includes('image')) {
    types.push(...ALLOWED_IMAGE_TYPES);
  }
  if (mediaTypes.includes('video')) {
    types.push(...ALLOWED_VIDEO_TYPES);
  }
  if (mediaTypes.includes('document')) {
    types.push(...ALLOWED_DOCUMENT_TYPES);
  }

  return types;
}

/**
 * Get accept string for file input
 */
export function getAcceptString(mediaTypes: MediaType[]): string {
  const accepts: string[] = [];

  if (mediaTypes.includes('image')) {
    accepts.push('image/jpeg', 'image/png', 'image/webp', 'image/gif');
  }
  if (mediaTypes.includes('video')) {
    accepts.push('video/mp4', 'video/webm', 'video/quicktime');
  }
  if (mediaTypes.includes('document')) {
    accepts.push('application/pdf');
  }

  return accepts.join(',');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if a file is an image
 */
export function isImage(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

/**
 * Check if a file is a video
 */
export function isVideo(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
}

/**
 * Check if a file is a document
 */
export function isDocument(mimeType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
}
