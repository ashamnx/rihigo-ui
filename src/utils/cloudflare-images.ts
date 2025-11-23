/**
 * Cloudflare Images API utilities
 * Handles upload, management, and CDN delivery of images and videos
 */

export interface CloudflareImageUploadResult {
  result: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

export interface CloudflareImageListResult {
  result: {
    images: Array<{
      id: string;
      filename: string;
      uploaded: string;
      requireSignedURLs: boolean;
      variants: string[];
      meta?: Record<string, any>;
    }>;
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

export interface MediaItem {
  id: string;
  filename: string;
  uploaded: string;
  type: 'image' | 'video';
  variants: string[];
  accountHash?: string;
  meta?: {
    activityId?: string;
    tags?: string[];
    description?: string;
    alt?: string;
  };
}

/**
 * Upload image or video to Cloudflare Images
 */
export async function uploadToCloudflare(
  file: File,
  metadata?: { activityId?: string; tags?: string[]; description?: string; alt?: string }
): Promise<CloudflareImageUploadResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_IMAGES_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Images configuration missing');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Add metadata if provided
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudflare Images upload failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get list of uploaded images
 */
export async function getCloudflareImages(page = 1, perPage = 50): Promise<CloudflareImageListResult> {
  console.log('getCloudflareImages: Starting fetch, page:', page, 'perPage:', perPage);

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_IMAGES_TOKEN;

  console.log('getCloudflareImages: Config check - accountId:', accountId ? 'present' : 'missing', 'apiToken:', apiToken ? 'present' : 'missing');

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Images configuration missing');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1?page=${page}&per_page=${perPage}`;
  console.log('getCloudflareImages: Fetching URL:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
  });

  console.log('getCloudflareImages: Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('getCloudflareImages: Error response:', errorText);
    throw new Error(`Failed to fetch Cloudflare Images: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('getCloudflareImages: Success, images count:', result.result?.images?.length || 0);

  return result;
}

/**
 * Delete image from Cloudflare
 */
export async function deleteCloudflareImage(imageId: string): Promise<{ success: boolean }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_IMAGES_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Images configuration missing');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete Cloudflare Image: ${response.statusText}`);
  }

  const result = await response.json();
  return { success: result.success };
}

/**
 * Get Cloudflare Images CDN URL
 */
export function getCloudflareImageUrl(
  imageId: string,
  variant: string = 'public',
  accountHash: string
): string {
  if (!accountHash) {
    throw new Error('Cloudflare Images hash not provided');
  }

  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}

/**
 * Generate responsive image variants URLs
 */
export function getResponsiveImageUrls(imageId: string, accountHash: string) {
  return {
    thumbnail: getCloudflareImageUrl(imageId, 'thumbnail', accountHash), // 200x200
    small: getCloudflareImageUrl(imageId, 'small', accountHash),         // 400x400
    medium: getCloudflareImageUrl(imageId, 'medium', accountHash),       // 800x800
    large: getCloudflareImageUrl(imageId, 'large', accountHash),         // 1200x1200
    public: getCloudflareImageUrl(imageId, 'public', accountHash),       // Original
  };
}

/**
 * Validate file type for upload
 */
export function isValidMediaFile(file: File): { valid: boolean; type: 'image' | 'video' | null; error?: string } {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];

  // Check file size (Cloudflare Images: 10MB for images, 200MB for videos)
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 200 * 1024 * 1024; // 200MB

  if (imageTypes.includes(file.type)) {
    if (file.size > maxImageSize) {
      return { valid: false, type: null, error: 'Image file too large (max 10MB)' };
    }
    return { valid: true, type: 'image' };
  }

  if (videoTypes.includes(file.type)) {
    if (file.size > maxVideoSize) {
      return { valid: false, type: null, error: 'Video file too large (max 200MB)' };
    }
    return { valid: true, type: 'video' };
  }

  return { valid: false, type: null, error: 'Unsupported file type' };
}

/**
 * Create image variants configuration for Cloudflare
 */
export const CLOUDFLARE_VARIANTS = {
  thumbnail: {
    width: 200,
    height: 200,
    fit: 'cover',
  },
  small: {
    width: 400,
    height: 400,
    fit: 'scale-down',
  },
  medium: {
    width: 800,
    height: 800,
    fit: 'scale-down',
  },
  large: {
    width: 1200,
    height: 1200,
    fit: 'scale-down',
  },
  hero: {
    width: 1920,
    height: 1080,
    fit: 'cover',
  }
};