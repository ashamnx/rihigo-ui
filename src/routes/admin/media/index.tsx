import { component$, useSignal, useStore, $, noSerialize, type NoSerialize } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, zod$, z } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { MediaItem, MediaFilters, PrivacyLevel, OwnerType } from '~/types/media';
import { formatFileSize, validateMediaFile, getAcceptString } from '~/utils/media-client';
import type { PaginatedResponse } from '~/types/api';
import { ErrorState } from '~/components/error-state/error-state';

// Route loader to get Cloudflare config for building media URLs
export const useCloudflareConfig = routeLoader$(() => {
  return {
    accountHash: process.env.CLOUDFLARE_IMAGES_HASH || '',
    r2PublicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || '',
  };
});

// Route loader to fetch media list
export const useMediaList = routeLoader$<PaginatedResponse<MediaItem>>(async (requestEvent) => {
  const url = requestEvent.url;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('page_size') || '24');
  const ownerType = url.searchParams.get('owner_type') as OwnerType | undefined;
  const privacyLevel = url.searchParams.get('privacy_level') as PrivacyLevel | undefined;
  const search = url.searchParams.get('search') || undefined;

  const filters: MediaFilters = {
    page,
    page_size: pageSize,
    owner_type: ownerType,
    privacy_level: privacyLevel,
    search,
  };

  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.media.list(token, filters);
  });
});

// Route action to get presigned upload URL (Step 1: Get upload URL and storage key)
export const useGetPresignedUrl = routeAction$(
  async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
      const result = await apiClient.media.getPresignedUpload(
        {
          filename: data.filename,
          content_type: data.content_type,
          file_size: data.file_size,
        },
        token
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          error_message: result.error_message || 'Failed to get upload URL',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    });
  },
  zod$({
    filename: z.string(),
    content_type: z.string(),
    file_size: z.number(),
  })
);

// Route action to create media record (Step 2: After client uploads to Cloudflare R2)
export const useCreateMediaRecord = routeAction$(
  async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
      // Presigned uploads go to R2, so always use cloudflare_r2
      const storageProvider = 'cloudflare_r2';

      // Construct CDN URL for public files
      // R2 public bucket URL format: https://pub-{hash}.r2.dev/{key}
      // or custom domain if configured
      let cdnUrl: string | undefined;
      if (data.privacy_level === 'public' || !data.privacy_level) {
        const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
        if (r2PublicUrl) {
          cdnUrl = `${r2PublicUrl}/${data.storage_key}`;
        }
      }

      // Create media record
      const result = await apiClient.media.create(
        {
          filename: data.storage_key.split('/').pop() || data.original_filename,
          original_filename: data.original_filename,
          mime_type: data.content_type,
          file_size: data.file_size,
          storage_provider: storageProvider,
          storage_key: data.storage_key,
          cdn_url: cdnUrl,
          privacy_level: (data.privacy_level as PrivacyLevel) || 'public',
          owner_type: (data.owner_type as OwnerType) || 'activity',
          owner_id: data.owner_id || 'general',
          tags: data.tags ? JSON.parse(data.tags) : undefined,
          metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
        },
        token
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          error_message: result.error_message || 'Failed to create media record',
        };
      }

      return {
        success: true,
        data: result.data,
        message: 'File uploaded successfully',
      };
    });
  },
  zod$({
    original_filename: z.string(),
    content_type: z.string(),
    file_size: z.number(),
    storage_key: z.string(),
    privacy_level: z.string().optional(),
    owner_type: z.string().optional(),
    owner_id: z.string().optional(),
    tags: z.string().optional(),
    metadata: z.string().optional(),
  })
);

// Route action to delete media
// Note: The backend API should handle both database and storage deletion
export const useDeleteMedia = routeAction$(
  async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
      const mediaId = data.mediaId;

      // Delete via backend API - it handles storage deletion
      const result = await apiClient.media.delete(mediaId, token);

      if (!result.success) {
        return {
          success: false,
          error_message: result.error_message || 'Failed to delete media',
        };
      }

      return {
        success: true,
        message: 'Media deleted successfully',
      };
    });
  },
  zod$({
    mediaId: z.string(),
  })
);

// Route action to get media list (for MediaLibrary component)
export const useGetMedia = routeAction$(
  async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
      const filters: MediaFilters = {
        page: parseInt(data.page as string) || 1,
        page_size: parseInt(data.perPage as string) || 50,
      };

      const result = await apiClient.media.list(token, filters);

      if (!result.success) {
        return {
          success: false,
          message: result.error_message || 'Failed to load media',
        };
      }

      // Transform to MediaItem format expected by MediaLibrary
      const accountHash = process.env.CLOUDFLARE_IMAGES_HASH;
      const mediaItems = (result.data || []).map((item: MediaItem) => ({
        id: item.id,
        filename: item.original_filename || item.filename,
        uploaded: item.created_at,
        type: item.mime_type.startsWith('image/') ? 'image' : 'video',
        variants: item.variants?.map((v) => v.url) || [],
        accountHash: accountHash,
        meta: item.metadata,
      }));

      return {
        success: true,
        data: mediaItems,
      };
    });
  },
  zod$({
    page: z.string().optional(),
    perPage: z.string().optional(),
  })
);

export default component$(() => {
  const cfConfig = useCloudflareConfig();
  const mediaListResponse = useMediaList();
  const getPresignedUrlAction = useGetPresignedUrl();
  const createMediaRecordAction = useCreateMediaRecord();
  const deleteAction = useDeleteMedia();

  const deleteModalId = useSignal<string | null>(null);
  const viewMode = useSignal<'grid' | 'list'>('grid');
  const searchQuery = useSignal('');
  const selectedPrivacy = useSignal<string>('');

  // Upload state management
  const uploadState = useStore({
    status: 'idle' as 'idle' | 'preparing' | 'uploading' | 'processing' | 'success' | 'error',
    message: '',
    progress: 0,
  });

  // Store file reference separately with noSerialize to avoid serialization issues
  const fileRef = useSignal<NoSerialize<File> | null>(null);
  const fileInfo = useSignal<{ name: string; type: string; size: number } | null>(null);

  const uploadForm = useStore({
    preview: null as string | null,
    privacy_level: 'public' as PrivacyLevel,
    description: '',
    alt: '',
    tags: [] as string[],
  });

  const mediaItems = mediaListResponse.value.data || [];
  const accountHash = cfConfig.value.accountHash;
  const r2PublicUrl = cfConfig.value.r2PublicUrl;

  // Handle file selection for upload
  const handleFileSelect = $((event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const validation = validateMediaFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Store file reference with noSerialize to avoid browser freeze
    fileRef.value = noSerialize(file);
    fileInfo.value = {
      name: file.name,
      type: file.type,
      size: file.size,
    };
    uploadForm.preview = URL.createObjectURL(file);
  });

  // Handle upload submission using presigned URL flow
  const handleUpload = $(async () => {
    const file = fileRef.value;
    if (!file || !fileInfo.value) return;

    // Step 1: Get presigned URL from backend
    uploadState.status = 'preparing';
    uploadState.message = 'Getting upload URL...';
    uploadState.progress = 10;

    try {
      const presignedResult = await getPresignedUrlAction.submit({
        filename: fileInfo.value.name,
        content_type: fileInfo.value.type,
        file_size: fileInfo.value.size,
      });

      if (!presignedResult.value.success || !presignedResult.value.data) {
        uploadState.status = 'error';
        uploadState.message = presignedResult.value.error_message || 'Failed to get upload URL';
        uploadState.progress = 0;
        return;
      }

      const { upload_url, key: storageKey } = presignedResult.value.data;
      uploadState.progress = 25;

      // Step 2: Upload file directly to Cloudflare
      uploadState.status = 'uploading';
      uploadState.message = `Uploading ${fileInfo.value.name}...`;
      uploadState.progress = 30;

      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': fileInfo.value.type,
        },
      });

      if (!uploadResponse.ok) {
        console.error(`Failed to upload file: ${uploadResponse.statusText}`);
        uploadState.status = 'error';
        uploadState.message = 'Failed to upload file to storage';
        uploadState.progress = 0;
        return;
      }

      uploadState.progress = 80;

      // Step 3: Create media record in database
      uploadState.status = 'processing';
      uploadState.message = 'Creating media record...';

      const createResult = await createMediaRecordAction.submit({
        original_filename: fileInfo.value.name,
        content_type: fileInfo.value.type,
        file_size: fileInfo.value.size,
        storage_key: storageKey,
        privacy_level: uploadForm.privacy_level,
        owner_type: 'activity',
        owner_id: 'general',
        metadata: uploadForm.alt || uploadForm.description
          ? JSON.stringify({ alt: uploadForm.alt, description: uploadForm.description })
          : undefined,
        tags: uploadForm.tags.length > 0 ? JSON.stringify(uploadForm.tags) : undefined,
      });

      if (createResult.value.success) {
        uploadState.status = 'success';
        uploadState.message = createResult.value.message || 'Upload completed successfully!';
        uploadState.progress = 100;

        // Reset form after short delay to show success
        setTimeout(() => {
          fileRef.value = null;
          fileInfo.value = null;
          uploadForm.preview = null;
          uploadForm.description = '';
          uploadForm.alt = '';
          uploadForm.tags = [];
          uploadState.status = 'idle';
          uploadState.message = '';
          uploadState.progress = 0;
          // Reload page to refresh media list
          window.location.reload();
        }, 1500);
      } else {
        uploadState.status = 'error';
        uploadState.message = createResult.value.error_message || 'Upload failed. Please try again.';
        uploadState.progress = 0;
      }
    } catch (err) {
      uploadState.status = 'error';
      uploadState.message = err instanceof Error ? err.message : 'An unexpected error occurred';
      uploadState.progress = 0;
    }
  });

  // Cancel upload
  const cancelUpload = $(() => {
    fileRef.value = null;
    fileInfo.value = null;
    uploadForm.preview = null;
    uploadForm.description = '';
    uploadForm.alt = '';
    uploadForm.tags = [];
    uploadState.status = 'idle';
    uploadState.message = '';
    uploadState.progress = 0;
  });

  // Get image URL for display
  // Cloudflare Images URL format: https://imagedelivery.net/{accountHash}/{imageId}/{variant}
  // Cloudflare R2 public URL format: https://pub-{hash}.r2.dev/{key} or custom domain
  const getDisplayUrl = (media: MediaItem): string => {
    // First try variants if available
    if (media.variants && media.variants.length > 0) {
      const smallVariant = media.variants.find((v) => v.name === 'small');
      return smallVariant?.url || media.variants[0].url;
    }

    // Then try cdn_url
    if (media.cdn_url) {
      return media.cdn_url;
    }

    // For Cloudflare Images, construct URL from storage_key
    if (media.storage_provider === 'cloudflare_images' && media.storage_key && accountHash) {
      // Extract just the UUID if storage_key contains a path
      const imageId = media.storage_key.includes('/')
        ? media.storage_key.split('/').find((part) => /^[0-9a-f-]{36}$/i.test(part)) || media.storage_key
        : media.storage_key;
      // Use 'public' variant as it's the default Cloudflare Images variant
      return `https://imagedelivery.net/${accountHash}/${imageId}/public`;
    }

    // For R2, construct public URL from storage_key
    if (media.storage_provider === 'cloudflare_r2' && media.storage_key && r2PublicUrl) {
      return `${r2PublicUrl}/${media.storage_key}`;
    }

    return '';
  };

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Media Library</h1>
          <p class="text-gray-600 mt-2">Manage images, videos, and documents</p>
        </div>
        <label for="file-upload" class="btn btn-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
          Upload Media
        </label>
        <input
          id="file-upload"
          type="file"
          accept={getAcceptString(['image', 'video', 'document'])}
          class="hidden"
          onChange$={handleFileSelect}
        />
      </div>

      {/* Delete Success Message */}
      {deleteAction.value?.success && (
        <div class="alert alert-success mb-4">
          <span>Media deleted successfully</span>
        </div>
      )}

      {/* Upload Form */}
      {fileInfo.value && (
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title">Upload Media</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                {uploadForm.preview && (
                  <div class="aspect-video bg-base-200 rounded-lg overflow-hidden">
                    {fileInfo.value.type.startsWith('image/') ? (
                      <img
                        src={uploadForm.preview}
                        alt="Preview"
                        class="w-full h-full object-contain"
                        width={400}
                        height={300}
                      />
                    ) : fileInfo.value.type.startsWith('video/') ? (
                      <video src={uploadForm.preview} class="w-full h-full object-contain" controls />
                    ) : (
                      <div class="w-full h-full flex items-center justify-center">
                        <svg
                          class="w-16 h-16 text-gray-400"
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
                      </div>
                    )}
                  </div>
                )}
                <p class="text-sm text-gray-600 mt-2">
                  {fileInfo.value.name} ({formatFileSize(fileInfo.value.size)})
                </p>
              </div>

              {/* Form Fields */}
              <div class="space-y-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Privacy Level</span>
                  </label>
                  <select
                    class="select select-bordered w-full"
                    value={uploadForm.privacy_level}
                    disabled={uploadState.status !== 'idle' && uploadState.status !== 'error'}
                    onChange$={(e) =>
                      (uploadForm.privacy_level = (e.target as HTMLSelectElement)
                        .value as PrivacyLevel)
                    }
                  >
                    <option value="public">Public (accessible to everyone)</option>
                    <option value="user">User (owner only)</option>
                    <option value="vendor">Vendor (vendor and admins)</option>
                    <option value="admin">Admin (admins only)</option>
                  </select>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Alt Text</span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered w-full"
                    placeholder="Describe the image for accessibility"
                    value={uploadForm.alt}
                    disabled={uploadState.status !== 'idle' && uploadState.status !== 'error'}
                    onInput$={(e) => (uploadForm.alt = (e.target as HTMLInputElement).value)}
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Description</span>
                  </label>
                  <textarea
                    class="textarea textarea-bordered w-full"
                    placeholder="Optional description"
                    value={uploadForm.description}
                    disabled={uploadState.status !== 'idle' && uploadState.status !== 'error'}
                    onInput$={(e) =>
                      (uploadForm.description = (e.target as HTMLTextAreaElement).value)
                    }
                  />
                </div>

                {/* Upload Progress & Status */}
                {uploadState.status !== 'idle' && (
                  <div class="space-y-2">
                    {/* Progress Bar */}
                    <div class="w-full bg-base-200 rounded-full h-2.5">
                      <div
                        class={`h-2.5 rounded-full transition-all duration-300 ${
                          uploadState.status === 'error'
                            ? 'bg-error'
                            : uploadState.status === 'success'
                              ? 'bg-success'
                              : 'bg-primary'
                        }`}
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>

                    {/* Status Message */}
                    <div
                      class={`flex items-center gap-2 text-sm ${
                        uploadState.status === 'error'
                          ? 'text-error'
                          : uploadState.status === 'success'
                            ? 'text-success'
                            : 'text-base-content/70'
                      }`}
                    >
                      {uploadState.status === 'preparing' && (
                        <span class="loading loading-spinner loading-xs"></span>
                      )}
                      {uploadState.status === 'uploading' && (
                        <span class="loading loading-spinner loading-xs"></span>
                      )}
                      {uploadState.status === 'processing' && (
                        <span class="loading loading-spinner loading-xs"></span>
                      )}
                      {uploadState.status === 'success' && (
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      )}
                      {uploadState.status === 'error' && (
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      )}
                      <span>{uploadState.message}</span>
                    </div>
                  </div>
                )}

                <div class="flex gap-2 pt-4">
                  <button
                    type="button"
                    class="btn btn-primary"
                    disabled={uploadState.status !== 'idle' && uploadState.status !== 'error'}
                    onClick$={handleUpload}
                  >
                    {uploadState.status === 'preparing' ||
                    uploadState.status === 'uploading' ||
                    uploadState.status === 'processing' ? (
                      <>
                        <span class="loading loading-spinner loading-sm"></span>
                        {uploadState.status === 'preparing' && 'Preparing...'}
                        {uploadState.status === 'uploading' && 'Uploading...'}
                        {uploadState.status === 'processing' && 'Processing...'}
                      </>
                    ) : uploadState.status === 'success' ? (
                      <>
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        Done!
                      </>
                    ) : uploadState.status === 'error' ? (
                      'Retry Upload'
                    ) : (
                      'Upload'
                    )}
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost"
                    onClick$={cancelUpload}
                    disabled={
                      uploadState.status === 'uploading' || uploadState.status === 'processing'
                    }
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body py-4">
          <div class="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div class="form-control flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search media..."
                class="input input-bordered w-full"
                value={searchQuery.value}
                onInput$={(e) => (searchQuery.value = (e.target as HTMLInputElement).value)}
              />
            </div>

            {/* Privacy Filter */}
            <div class="form-control">
              <select
                class="select select-bordered"
                value={selectedPrivacy.value}
                onChange$={(e) =>
                  (selectedPrivacy.value = (e.target as HTMLSelectElement).value)
                }
              >
                <option value="">All Privacy Levels</option>
                <option value="public">Public</option>
                <option value="user">User</option>
                <option value="vendor">Vendor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div class="btn-group">
              <button
                class={`btn btn-sm ${viewMode.value === 'grid' ? 'btn-active' : ''}`}
                onClick$={() => (viewMode.value = 'grid')}
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                class={`btn btn-sm ${viewMode.value === 'list' ? 'btn-active' : ''}`}
                onClick$={() => (viewMode.value = 'list')}
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      {mediaListResponse.value.error_message ? (
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <ErrorState
              title="Failed to load media"
              message={mediaListResponse.value.error_message}
            />
          </div>
        </div>
      ) : mediaItems.length === 0 ? (
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body text-center py-12">
            <svg
              class="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 class="text-lg font-semibold text-gray-600">No media files found</h3>
            <p class="text-gray-500">Upload your first media file to get started</p>
          </div>
        </div>
      ) : (
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            {viewMode.value === 'grid' ? (
              <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mediaItems.map((media) => (
                  <div
                    key={media.id}
                    class="relative group rounded-lg overflow-hidden border border-base-300 hover:border-primary transition-colors"
                  >
                    <div class="aspect-square bg-base-200">
                      {media.mime_type.startsWith('image/') ? (
                        <img
                          src={getDisplayUrl(media)}
                          alt={media.metadata?.alt || media.original_filename}
                          class="w-full h-full object-cover"
                          width={200}
                          height={200}
                        />
                      ) : media.mime_type.startsWith('video/') ? (
                        <div class="w-full h-full flex items-center justify-center bg-base-300">
                          <svg
                            class="w-12 h-12 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                      ) : (
                        <div class="w-full h-full flex items-center justify-center bg-base-300">
                          <svg
                            class="w-12 h-12 text-gray-400"
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
                        </div>
                      )}
                    </div>

                    {/* Privacy Badge */}
                    <div class="absolute top-2 left-2">
                      <span
                        class={`badge badge-sm ${
                          media.privacy_level === 'public'
                            ? 'badge-success'
                            : media.privacy_level === 'user'
                              ? 'badge-info'
                              : media.privacy_level === 'vendor'
                                ? 'badge-warning'
                                : 'badge-error'
                        }`}
                      >
                        {media.privacy_level}
                      </span>
                    </div>

                    {/* Hover Actions */}
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        class="btn btn-circle btn-sm btn-error"
                        onClick$={() => (deleteModalId.value = media.id)}
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Filename */}
                    <div class="p-2 bg-base-100">
                      <p class="text-xs truncate" title={media.original_filename}>
                        {media.original_filename}
                      </p>
                      <p class="text-xs text-gray-500">{formatFileSize(media.file_size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="overflow-x-auto">
                <table class="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Preview</th>
                      <th>Filename</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Privacy</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediaItems.map((media) => (
                      <tr key={media.id}>
                        <td>
                          <div class="w-12 h-12 rounded overflow-hidden bg-base-200">
                            {media.mime_type.startsWith('image/') ? (
                              <img
                                src={getDisplayUrl(media)}
                                alt={media.metadata?.alt || media.original_filename}
                                class="w-full h-full object-cover"
                                width={48}
                                height={48}
                              />
                            ) : (
                              <div class="w-full h-full flex items-center justify-center">
                                <svg
                                  class="w-6 h-6 text-gray-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td class="font-medium">{media.original_filename}</td>
                        <td>{media.mime_type}</td>
                        <td>{formatFileSize(media.file_size)}</td>
                        <td>
                          <span
                            class={`badge ${
                              media.privacy_level === 'public'
                                ? 'badge-success'
                                : media.privacy_level === 'user'
                                  ? 'badge-info'
                                  : media.privacy_level === 'vendor'
                                    ? 'badge-warning'
                                    : 'badge-error'
                            }`}
                          >
                            {media.privacy_level}
                          </span>
                        </td>
                        <td>
                          <button
                            class="btn btn-sm btn-ghost text-error"
                            onClick$={() => (deleteModalId.value = media.id)}
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId.value && (
        <dialog class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Delete Media</h3>
            <p class="py-4">
              Are you sure you want to delete this media file? This action cannot be undone.
            </p>
            <div class="modal-action">
              <button class="btn btn-ghost" onClick$={() => (deleteModalId.value = null)}>
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-error"
                onClick$={async () => {
                  const mediaId = deleteModalId.value;
                  if (mediaId) {
                    deleteModalId.value = null;
                    await deleteAction.submit({ mediaId });
                    // Reload to refresh the list
                    window.location.reload();
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick$={() => (deleteModalId.value = null)} />
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Media Library - Admin',
  meta: [
    {
      name: 'description',
      content: 'Manage media files including images, videos, and documents',
    },
  ],
};
