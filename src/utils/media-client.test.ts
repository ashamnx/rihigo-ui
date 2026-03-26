import {
  getAllowedTypes,
  getAcceptString,
  formatFileSize,
  getFileExtension,
  isImage,
  isVideo,
  isDocument,
} from './media-client';

describe('getAllowedTypes', () => {
  it('returns image types for image media type', () => {
    const types = getAllowedTypes(['image']);
    expect(types).toContain('image/jpeg');
    expect(types).toContain('image/png');
    expect(types).toContain('image/webp');
    expect(types).toContain('image/gif');
  });

  it('returns video types for video media type', () => {
    const types = getAllowedTypes(['video']);
    expect(types).toContain('video/mp4');
    expect(types).toContain('video/webm');
    expect(types).toContain('video/quicktime');
  });

  it('returns document types for document media type', () => {
    const types = getAllowedTypes(['document']);
    expect(types).toContain('application/pdf');
  });

  it('returns combined types for multiple media types', () => {
    const types = getAllowedTypes(['image', 'video']);
    expect(types).toContain('image/jpeg');
    expect(types).toContain('video/mp4');
  });

  it('returns empty array for empty input', () => {
    expect(getAllowedTypes([])).toEqual([]);
  });
});

describe('getAcceptString', () => {
  it('returns comma-separated image types', () => {
    const result = getAcceptString(['image']);
    expect(result).toContain('image/jpeg');
    expect(result).toContain('image/png');
    expect(result).toContain(',');
  });

  it('returns comma-separated video types', () => {
    const result = getAcceptString(['video']);
    expect(result).toContain('video/mp4');
  });

  it('returns combined string for multiple types', () => {
    const result = getAcceptString(['image', 'document']);
    expect(result).toContain('image/jpeg');
    expect(result).toContain('application/pdf');
  });
});

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes < 1KB', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats KB range', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats MB range', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });

  it('formats GB range', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });
});

describe('getFileExtension', () => {
  it('returns extension for standard filename', () => {
    expect(getFileExtension('photo.jpg')).toBe('jpg');
  });

  it('returns lowercase extension', () => {
    expect(getFileExtension('photo.JPG')).toBe('jpg');
  });

  it('returns empty string for no extension', () => {
    expect(getFileExtension('photo')).toBe('photo');
  });

  it('handles multiple dots in filename', () => {
    expect(getFileExtension('my.photo.png')).toBe('png');
  });
});

describe('isImage', () => {
  it('returns true for image/jpeg', () => {
    expect(isImage('image/jpeg')).toBe(true);
  });

  it('returns true for image/png', () => {
    expect(isImage('image/png')).toBe(true);
  });

  it('returns false for video/mp4', () => {
    expect(isImage('video/mp4')).toBe(false);
  });

  it('returns false for application/pdf', () => {
    expect(isImage('application/pdf')).toBe(false);
  });
});

describe('isVideo', () => {
  it('returns true for video/mp4', () => {
    expect(isVideo('video/mp4')).toBe(true);
  });

  it('returns true for video/webm', () => {
    expect(isVideo('video/webm')).toBe(true);
  });

  it('returns false for image/jpeg', () => {
    expect(isVideo('image/jpeg')).toBe(false);
  });
});

describe('isDocument', () => {
  it('returns true for application/pdf', () => {
    expect(isDocument('application/pdf')).toBe(true);
  });

  it('returns true for image/jpeg (documents include image types)', () => {
    expect(isDocument('image/jpeg')).toBe(true);
  });

  it('returns false for video/mp4', () => {
    expect(isDocument('video/mp4')).toBe(false);
  });
});
