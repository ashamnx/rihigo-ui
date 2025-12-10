/**
 * Media Types and Interfaces
 * Defines types for the file upload system using Cloudflare Images and R2
 */

// Storage and classification types
export type MediaType = 'image' | 'video' | 'document';
export type PrivacyLevel = 'public' | 'user' | 'vendor' | 'admin';
export type StorageProvider = 'cloudflare_images' | 'cloudflare_r2';
export type OwnerType = 'user' | 'vendor' | 'activity' | 'booking' | 'category';

// Variant names for responsive images
export type VariantName = 'thumbnail' | 'small' | 'medium' | 'large' | 'hero' | 'public';

/**
 * Image variant with URL and dimensions
 */
export interface MediaVariant {
  name: VariantName;
  url: string;
  width?: number;
  height?: number;
}

/**
 * Media metadata for additional information
 */
export interface MediaMetadata {
  alt?: string;
  description?: string;
  caption?: string;
  [key: string]: unknown;
}

/**
 * Main media item interface
 */
export interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_provider: StorageProvider;
  storage_key: string;
  privacy_level: PrivacyLevel;
  owner_type: OwnerType;
  owner_id: string;
  cdn_url?: string;
  variants?: MediaVariant[];
  tags?: string[];
  metadata?: MediaMetadata;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

/**
 * Configuration for file uploads
 */
export interface UploadConfig {
  maxSizeMB: number;
  allowedTypes: string[];
  privacyLevel: PrivacyLevel;
  ownerType: OwnerType;
  ownerId: string;
  tags?: string[];
  metadata?: MediaMetadata;
}

/**
 * Request to create a media record
 */
export interface CreateMediaRequest {
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_provider: StorageProvider;
  storage_key: string;
  privacy_level: PrivacyLevel;
  owner_type: OwnerType;
  owner_id: string;
  cdn_url?: string;
  variants?: MediaVariant[];
  tags?: string[];
  metadata?: MediaMetadata;
}

/**
 * Filters for listing media
 */
export interface MediaFilters {
  owner_type?: OwnerType;
  owner_id?: string;
  privacy_level?: PrivacyLevel;
  type?: MediaType;
  tags?: string[];
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * Request for presigned upload URL
 */
export interface PresignedUploadRequest {
  filename: string;
  content_type: string;
  file_size: number;
}

/**
 * Response for presigned upload URL
 * Note: This only returns the upload URL and storage key.
 * The media record must be created separately via POST /api/media after upload.
 */
export interface PresignedUploadResponse {
  upload_url: string;
  key: string;
  expires_at: string;
}

/**
 * Signed URL response for private files
 */
export interface SignedUrlResponse {
  url: string;
  expires_at: string;
}

/**
 * Upload result from Cloudflare
 */
export interface CloudflareUploadResult {
  success: boolean;
  id: string;
  filename: string;
  cdn_url?: string;
  variants?: MediaVariant[];
  error?: string;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  type: MediaType | null;
  error?: string;
}

// File type constants
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/mov',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// Size limits in bytes
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 200 * 1024 * 1024, // 200MB
  document: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * Get the media type from MIME type
 */
export function getMediaType(mimeType: string): MediaType | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
  return null;
}

/**
 * Validate a file for upload
 */
export function validateFile(
  file: { type: string; size: number },
  config?: Partial<UploadConfig>
): FileValidationResult {
  const mediaType = getMediaType(file.type);

  if (!mediaType) {
    return {
      valid: false,
      type: null,
      error: `Unsupported file type: ${file.type}`,
    };
  }

  // Check against custom allowed types if provided
  if (config?.allowedTypes && !config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      type: null,
      error: `File type not allowed: ${file.type}`,
    };
  }

  // Check size limit
  const maxSize = config?.maxSizeMB
    ? config.maxSizeMB * 1024 * 1024
    : FILE_SIZE_LIMITS[mediaType];

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      type: null,
      error: `File too large. Maximum size is ${maxSizeMB}MB`,
    };
  }

  return {
    valid: true,
    type: mediaType,
  };
}

/**
 * Determine which storage provider to use based on media type
 */
export function getStorageProvider(mediaType: MediaType): StorageProvider {
  // Images go to Cloudflare Images for automatic optimization
  if (mediaType === 'image') {
    return 'cloudflare_images';
  }
  // Videos and documents go to R2
  return 'cloudflare_r2';
}

/**
 * Check if a user has access to a media item based on privacy level
 */
export function canAccessMedia(
  media: MediaItem,
  userId?: string,
  userRole?: string,
  vendorId?: string
): boolean {
  // Public files are accessible to everyone
  if (media.privacy_level === 'public') {
    return true;
  }

  // Admins can access everything
  if (userRole === 'admin') {
    return true;
  }

  // User-private files are only accessible to the owning user
  if (media.privacy_level === 'user') {
    return media.owner_type === 'user' && media.owner_id === userId;
  }

  // Vendor-private files are accessible to the owning vendor
  if (media.privacy_level === 'vendor') {
    return media.owner_type === 'vendor' && media.owner_id === vendorId;
  }

  // Admin-only files (privacy_level === 'admin' at this point)
  // Already checked userRole === 'admin' above, so this is unreachable for admins
  return false;
}
