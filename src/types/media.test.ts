import {
  getMediaType,
  validateFile,
  getStorageProvider,
  canAccessMedia,
  type MediaItem,
} from './media';

describe('getMediaType', () => {
  it('returns image for image/jpeg', () => {
    expect(getMediaType('image/jpeg')).toBe('image');
  });

  it('returns image for image/png', () => {
    expect(getMediaType('image/png')).toBe('image');
  });

  it('returns image for image/webp', () => {
    expect(getMediaType('image/webp')).toBe('image');
  });

  it('returns image for image/gif', () => {
    expect(getMediaType('image/gif')).toBe('image');
  });

  it('returns video for video/mp4', () => {
    expect(getMediaType('video/mp4')).toBe('video');
  });

  it('returns video for video/webm', () => {
    expect(getMediaType('video/webm')).toBe('video');
  });

  it('returns video for video/quicktime', () => {
    expect(getMediaType('video/quicktime')).toBe('video');
  });

  it('returns document for application/pdf', () => {
    expect(getMediaType('application/pdf')).toBe('document');
  });

  it('returns null for unsupported types', () => {
    expect(getMediaType('application/json')).toBeNull();
    expect(getMediaType('text/plain')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getMediaType('')).toBeNull();
  });
});

describe('validateFile', () => {
  it('returns valid for a small jpeg image', () => {
    const result = validateFile({ type: 'image/jpeg', size: 1024 });
    expect(result.valid).toBe(true);
    expect(result.type).toBe('image');
  });

  it('returns valid for image under 10MB default limit', () => {
    const result = validateFile({ type: 'image/png', size: 9 * 1024 * 1024 });
    expect(result.valid).toBe(true);
  });

  it('returns invalid for unsupported file type', () => {
    const result = validateFile({ type: 'text/plain', size: 100 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported file type');
  });

  it('returns invalid for image exceeding 10MB default limit', () => {
    const result = validateFile({ type: 'image/jpeg', size: 11 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File too large');
  });

  it('respects custom maxSizeMB config', () => {
    const result = validateFile(
      { type: 'image/jpeg', size: 3 * 1024 * 1024 },
      { maxSizeMB: 2 }
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2MB');
  });

  it('respects custom allowedTypes config', () => {
    const result = validateFile(
      { type: 'image/gif', size: 1024 },
      { allowedTypes: ['image/jpeg', 'image/png'] }
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File type not allowed');
  });

  it('validates video with correct size limit', () => {
    const result = validateFile({ type: 'video/mp4', size: 199 * 1024 * 1024 });
    expect(result.valid).toBe(true);
    expect(result.type).toBe('video');
  });

  it('rejects video exceeding 200MB limit', () => {
    const result = validateFile({ type: 'video/mp4', size: 201 * 1024 * 1024 });
    expect(result.valid).toBe(false);
  });
});

describe('getStorageProvider', () => {
  it('returns cloudflare_images for image', () => {
    expect(getStorageProvider('image')).toBe('cloudflare_images');
  });

  it('returns cloudflare_r2 for video', () => {
    expect(getStorageProvider('video')).toBe('cloudflare_r2');
  });

  it('returns cloudflare_r2 for document', () => {
    expect(getStorageProvider('document')).toBe('cloudflare_r2');
  });
});

describe('canAccessMedia', () => {
  const makeMedia = (overrides: Partial<MediaItem>): MediaItem => ({
    id: '1',
    filename: 'test.jpg',
    original_filename: 'test.jpg',
    mime_type: 'image/jpeg',
    file_size: 1024,
    storage_provider: 'cloudflare_images',
    storage_key: 'key-1',
    privacy_level: 'public',
    owner_type: 'user',
    owner_id: 'user-1',
    created_at: '2024-01-01',
    ...overrides,
  });

  it('allows anyone to access public media', () => {
    const media = makeMedia({ privacy_level: 'public' });
    expect(canAccessMedia(media)).toBe(true);
    expect(canAccessMedia(media, undefined, undefined)).toBe(true);
  });

  it('allows admin to access any privacy level', () => {
    expect(canAccessMedia(makeMedia({ privacy_level: 'user' }), 'admin-1', 'admin')).toBe(true);
    expect(canAccessMedia(makeMedia({ privacy_level: 'vendor' }), 'admin-1', 'admin')).toBe(true);
    expect(canAccessMedia(makeMedia({ privacy_level: 'admin' }), 'admin-1', 'admin')).toBe(true);
  });

  it('allows owner user to access user-private media', () => {
    const media = makeMedia({ privacy_level: 'user', owner_type: 'user', owner_id: 'user-1' });
    expect(canAccessMedia(media, 'user-1', 'user')).toBe(true);
  });

  it('denies non-owner user access to user-private media', () => {
    const media = makeMedia({ privacy_level: 'user', owner_type: 'user', owner_id: 'user-1' });
    expect(canAccessMedia(media, 'user-2', 'user')).toBe(false);
  });

  it('allows owner vendor to access vendor-private media', () => {
    const media = makeMedia({ privacy_level: 'vendor', owner_type: 'vendor', owner_id: 'vendor-1' });
    expect(canAccessMedia(media, 'user-1', 'user', 'vendor-1')).toBe(true);
  });

  it('denies non-vendor access to vendor-private media', () => {
    const media = makeMedia({ privacy_level: 'vendor', owner_type: 'vendor', owner_id: 'vendor-1' });
    expect(canAccessMedia(media, 'user-1', 'user', 'vendor-2')).toBe(false);
  });

  it('denies regular user access to admin-only media', () => {
    const media = makeMedia({ privacy_level: 'admin' });
    expect(canAccessMedia(media, 'user-1', 'user')).toBe(false);
  });
});
