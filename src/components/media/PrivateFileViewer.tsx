import { component$, useSignal, useTask$, $, type QRL } from '@builder.io/qwik';
import type { MediaItem, SignedUrlResponse } from '~/types/media';

export interface PrivateFileViewerProps {
  /** The media item to display */
  media: MediaItem;
  /** Function to fetch the signed URL (should call backend API) */
  getSignedUrl: QRL<(mediaId: string) => Promise<SignedUrlResponse | null>>;
  /** CSS class for the container */
  class?: string;
  /** Whether to auto-load the signed URL on mount */
  autoLoad?: boolean;
  /** Callback when URL is successfully loaded */
  onUrlLoaded?: QRL<(url: string) => void>;
  /** Callback when URL load fails */
  onError?: QRL<(error: string) => void>;
  /** Alt text for images */
  alt?: string;
  /** Whether to show download button */
  showDownload?: boolean;
}

export const PrivateFileViewer = component$<PrivateFileViewerProps>((props) => {
  const {
    media,
    getSignedUrl,
    autoLoad = true,
    alt,
    showDownload = true,
    onUrlLoaded,
    onError,
  } = props;

  const signedUrl = useSignal<string | null>(null);
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);
  const expiresAt = useSignal<Date | null>(null);
  const isExpired = useSignal(false);

  // Load signed URL
  const loadSignedUrl = $(async () => {
    isLoading.value = true;
    error.value = null;
    isExpired.value = false;

    try {
      const response = await getSignedUrl(media.id);

      if (!response) {
        error.value = 'Failed to get access URL';
        if (onError) {
          onError('Failed to get access URL');
        }
        return;
      }

      signedUrl.value = response.url;
      expiresAt.value = new Date(response.expires_at);

      if (onUrlLoaded) {
        onUrlLoaded(response.url);
      }

      // Set up expiration check
      const now = new Date();
      const expirationTime = expiresAt.value.getTime() - now.getTime();

      if (expirationTime > 0) {
        // Set timeout to mark as expired
        setTimeout(() => {
          isExpired.value = true;
          signedUrl.value = null;
        }, expirationTime);
      } else {
        isExpired.value = true;
        signedUrl.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load file';
      if (onError) {
        onError(error.value);
      }
    } finally {
      isLoading.value = false;
    }
  });

  // Auto-load on mount if enabled
  useTask$(({ track }) => {
    track(() => media.id);
    if (autoLoad && media.privacy_level !== 'public') {
      loadSignedUrl();
    }
  });

  // Handle download
  const handleDownload = $(async () => {
    if (!signedUrl.value) return;

    try {
      const response = await fetch(signedUrl.value);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = media.original_filename || media.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  });

  // For public files, just show the CDN URL directly
  if (media.privacy_level === 'public' && media.cdn_url) {
    return (
      <div class={`relative ${props.class || ''}`}>
        {media.mime_type.startsWith('image/') ? (
          <img
            src={media.cdn_url}
            alt={alt || media.metadata?.alt || media.original_filename}
            class="w-full h-full object-contain"
            width={800}
            height={600}
          />
        ) : media.mime_type.startsWith('video/') ? (
          <video src={media.cdn_url} controls class="w-full h-full">
            <track kind="captions" />
          </video>
        ) : (
          <div class="flex items-center justify-center p-4 bg-base-200 rounded-lg">
            <a
              href={media.cdn_url}
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-primary"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              View Document
            </a>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading.value) {
    return (
      <div class={`flex items-center justify-center p-8 bg-base-200 rounded-lg ${props.class || ''}`}>
        <div class="flex flex-col items-center gap-3">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-sm text-base-content/60">Loading secure file...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error.value) {
    return (
      <div class={`flex items-center justify-center p-8 bg-error/10 rounded-lg ${props.class || ''}`}>
        <div class="flex flex-col items-center gap-3 text-center">
          <svg class="w-12 h-12 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p class="text-sm text-error">{error.value}</p>
          <button type="button" class="btn btn-sm btn-outline" onClick$={loadSignedUrl}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Expired state
  if (isExpired.value) {
    return (
      <div class={`flex items-center justify-center p-8 bg-warning/10 rounded-lg ${props.class || ''}`}>
        <div class="flex flex-col items-center gap-3 text-center">
          <svg class="w-12 h-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-sm text-warning">Access link expired</p>
          <button type="button" class="btn btn-sm btn-primary" onClick$={loadSignedUrl}>
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Not loaded yet
  if (!signedUrl.value) {
    return (
      <div class={`flex items-center justify-center p-8 bg-base-200 rounded-lg ${props.class || ''}`}>
        <div class="flex flex-col items-center gap-3 text-center">
          <svg class="w-12 h-12 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p class="text-sm text-base-content/60">Private file</p>
          <button type="button" class="btn btn-sm btn-primary" onClick$={loadSignedUrl}>
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View File
          </button>
        </div>
      </div>
    );
  }

  // Render content with signed URL
  return (
    <div class={`relative ${props.class || ''}`}>
      {media.mime_type.startsWith('image/') ? (
        <img
          src={signedUrl.value}
          alt={alt || media.metadata?.alt || media.original_filename}
          class="w-full h-full object-contain"
          width={800}
          height={600}
        />
      ) : media.mime_type.startsWith('video/') ? (
        <video src={signedUrl.value} controls class="w-full h-full">
          <track kind="captions" />
        </video>
      ) : (
        <div class="flex flex-col items-center justify-center p-8 bg-base-200 rounded-lg gap-4">
          <svg
            class="w-16 h-16 text-base-content/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p class="text-sm font-medium">{media.original_filename}</p>
          <a
            href={signedUrl.value}
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-primary"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Open Document
          </a>
        </div>
      )}

      {/* Action Buttons */}
      {showDownload && (
        <div class="absolute top-2 right-2 flex gap-2">
          <button
            type="button"
            class="btn btn-circle btn-sm btn-ghost bg-black/50 hover:bg-black/70 text-white"
            onClick$={handleDownload}
            title="Download"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            type="button"
            class="btn btn-circle btn-sm btn-ghost bg-black/50 hover:bg-black/70 text-white"
            onClick$={loadSignedUrl}
            title="Refresh access"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Expiration Indicator */}
      {expiresAt.value && (
        <div class="absolute bottom-2 left-2">
          <span class="badge badge-warning badge-sm">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Secure
          </span>
        </div>
      )}
    </div>
  );
});

export default PrivateFileViewer;
