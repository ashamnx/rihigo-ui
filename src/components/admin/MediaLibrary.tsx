/**
 * MediaLibrary Component
 *
 * A modal-based media picker/manager with upload capability.
 * Uses the native HTML <dialog> element following Qwik's recommended approach
 * for modals, providing automatic top-layer rendering, focus trapping,
 * and scroll locking.
 *
 * @see https://qwik.dev/docs/cookbook/portals/
 */

import {
  component$,
  useSignal,
  useStore,
  $,
  useTask$,
  noSerialize,
  type NoSerialize,
  type QRL,
} from "@builder.io/qwik";
import { getResponsiveImageUrls, isValidMediaFile } from "~/utils/cloudflare-images";
import type { PrivacyLevel } from "~/types/media";
import type { ActionStore } from "@builder.io/qwik-city";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "~/components/ui/Modal";

// Legacy MediaItem interface for backward compatibility with existing cloudflare-images
interface LegacyMediaItem {
  id: string;
  filename: string;
  uploaded: string;
  type: "image" | "video";
  variants: string[];
  accountHash?: string;
  meta?: {
    activityId?: string;
    tags?: string[];
    description?: string;
    alt?: string;
  };
}

// Union type for both old and new media formats
type MediaItem = LegacyMediaItem;

export interface MediaLibraryProps {
  onSelectMedia?: QRL<(media: MediaItem[]) => void>;
  multiSelect?: boolean;
  selectedMedia?: MediaItem[];
  activityId?: string;
  allowUpload?: boolean;
  uploadAction?: ActionStore<any, Record<string, any>>;
  getMediaAction?: ActionStore<any, Record<string, any>>;
  deleteAction?: ActionStore<any, Record<string, any>>;
  /** Default privacy level for uploads */
  defaultPrivacyLevel?: PrivacyLevel;
  /** Owner type for new uploads */
  ownerType?: string;
  /** Owner ID for new uploads */
  ownerId?: string;
}

export const MediaLibrary = component$<MediaLibraryProps>((props) => {
  const {
    multiSelect = false,
    selectedMedia = [],
    activityId,
    allowUpload = true,
    uploadAction,
    getMediaAction,
    defaultPrivacyLevel = "public",
    ownerType = "activity",
    ownerId = "general",
  } = props;

  const isOpen = useSignal(false);
  const isUploading = useSignal(false);
  const currentPage = useSignal(1);
  const searchQuery = useSignal("");
  const viewMode = useSignal<"grid" | "list">("grid");

  const mediaStore = useStore<{
    items: MediaItem[];
    loading: boolean;
    selectedItems: MediaItem[];
    error: string | null;
  }>({
    items: [],
    loading: false,
    selectedItems: [...selectedMedia],
    error: null,
  });

  const uploadForm = useStore({
    file: null as NoSerialize<File> | null,
    description: "",
    alt: "",
    tags: [] as string[],
    preview: null as string | null,
    fileName: "",
    privacyLevel: defaultPrivacyLevel as PrivacyLevel,
  });

  // Load media from server action
  const loadMedia = $(async () => {
    if (!getMediaAction) {
      console.log("MediaLibrary: getMediaAction not available");
      mediaStore.error = "Media loading not available";
      return;
    }

    console.log("MediaLibrary: Starting media load...");
    mediaStore.loading = true;
    mediaStore.error = null;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 10000);
      });

      const submitPromise = getMediaAction.submit({
        page: currentPage.value.toString(),
        perPage: "50",
      });

      console.log("MediaLibrary: Submitting action...");
      await Promise.race([submitPromise, timeoutPromise]);

      console.log("MediaLibrary: Action submitted successfully");
      console.log("MediaLibrary: Action value:", getMediaAction.value);

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (getMediaAction.value?.success) {
        console.log(
          "MediaLibrary: Media loaded successfully, count:",
          getMediaAction.value.data?.length
        );
        mediaStore.items = getMediaAction.value.data || [];
      } else {
        console.error(
          "MediaLibrary: Media load failed:",
          getMediaAction.value?.message
        );
        mediaStore.error =
          getMediaAction.value?.message || "Failed to load media";
      }
    } catch (error) {
      console.error("MediaLibrary: Load error:", error);
      mediaStore.error =
        error instanceof Error ? error.message : "Failed to load media";
    } finally {
      mediaStore.loading = false;
    }
  });

  // Load media when modal opens
  useTask$(async ({ track }) => {
    track(() => isOpen.value);
    if (isOpen.value && getMediaAction) {
      console.log("MediaLibrary: useTask triggered, loading media...");
      await loadMedia();
    }
  });

  // Handle modal close
  const handleClose = $(() => {
    isOpen.value = false;
  });

  // Handle file selection
  const handleFileSelect = $((event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const validation = isValidMediaFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      uploadForm.file = noSerialize(file);
      uploadForm.fileName = file.name;
      uploadForm.preview = URL.createObjectURL(file);
    }
  });

  // Handle upload
  const handleUpload = $(async () => {
    if (!uploadForm.file || !uploadAction) return;

    isUploading.value = true;

    try {
      const fileBuffer = await uploadForm.file.arrayBuffer();
      const fileData = {
        buffer: Array.from(new Uint8Array(fileBuffer)),
        name: uploadForm.file.name,
        type: uploadForm.file.type,
        size: uploadForm.file.size,
      };

      await uploadAction.submit({
        file: fileData,
        activityId: activityId || "",
        description: uploadForm.description,
        alt: uploadForm.alt,
        tags: JSON.stringify(uploadForm.tags),
        privacy_level: uploadForm.privacyLevel,
        owner_type: ownerType,
        owner_id: activityId || ownerId,
      });

      if (uploadAction.value?.success) {
        uploadForm.file = null;
        uploadForm.fileName = "";
        uploadForm.preview = null;
        uploadForm.description = "";
        uploadForm.alt = "";
        uploadForm.tags = [];

        await loadMedia();
      } else {
        alert(uploadAction.value?.message || "Upload failed");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      isUploading.value = false;
    }
  });

  // Reset upload form
  const resetUploadForm = $(() => {
    uploadForm.file = null;
    uploadForm.fileName = "";
    uploadForm.preview = null;
    uploadForm.description = "";
    uploadForm.alt = "";
    uploadForm.tags = [];
    uploadForm.privacyLevel = defaultPrivacyLevel;
  });

  // Toggle media selection
  const toggleMediaSelection = $((media: MediaItem) => {
    const index = mediaStore.selectedItems.findIndex(
      (item) => item.id === media.id
    );

    if (index > -1) {
      mediaStore.selectedItems.splice(index, 1);
    } else {
      if (multiSelect) {
        mediaStore.selectedItems.push(media);
      } else {
        mediaStore.selectedItems = [media];
      }
    }
  });

  // Apply selection and close
  const applySelection = $(() => {
    if (props.onSelectMedia) {
      props.onSelectMedia(mediaStore.selectedItems);
    }
    isOpen.value = false;
  });

  // Filtered media items
  const filteredMedia = mediaStore.items.filter(
    (item) =>
      !searchQuery.value ||
      item.filename.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.meta?.description
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase())
  );

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick$={() => (isOpen.value = true)}
        class="btn btn-primary btn-sm"
      >
        <svg
          class="w-4 h-4 mr-2"
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
        Media Library
      </button>

      {/* Media Library Modal - Uses native <dialog> element */}
      <Modal show={isOpen} onClose$={handleClose} size="xl">
        {/* Header */}
        <ModalHeader onClose$={handleClose}>
          <ModalTitle>Media Library</ModalTitle>
        </ModalHeader>

        {/* Toolbar */}
        <div class="flex items-center justify-between p-4 border-b border-base-200 bg-base-200/30">
          <div class="flex items-center gap-4">
            {/* Search */}
            <div class="form-control">
              <input
                type="text"
                placeholder="Search media..."
                class="input input-bordered input-sm w-64"
                value={searchQuery.value}
                onInput$={(e) =>
                  (searchQuery.value = (e.target as HTMLInputElement).value)
                }
              />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick$={loadMedia}
              class="btn btn-ghost btn-sm"
              disabled={mediaStore.loading}
              title="Refresh media library"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* View Mode Toggle */}
            <div class="join">
              <button
                class={`btn btn-sm join-item ${viewMode.value === "grid" ? "btn-active" : ""}`}
                onClick$={() => (viewMode.value = "grid")}
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                class={`btn btn-sm join-item ${viewMode.value === "list" ? "btn-active" : ""}`}
                onClick$={() => (viewMode.value = "list")}
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

          {/* Upload Button */}
          {allowUpload && (
            <label for="media-upload-input" class="btn btn-primary btn-sm">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Media
            </label>
          )}
          <input
            id="media-upload-input"
            type="file"
            accept="image/*,video/*"
            class="hidden"
            onChange$={handleFileSelect}
          />
        </div>

        {/* Upload Form */}
        {uploadForm.file && (
          <div class="p-4 border-b border-base-200 bg-info/10">
            <h3 class="text-lg font-medium mb-3">Upload Media</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {uploadForm.preview && (
                  <div class="mb-3">
                    {uploadForm.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={uploadForm.preview}
                        alt="Preview"
                        class="w-full h-32 object-cover rounded"
                        width={400}
                        height={128}
                      />
                    ) : (
                      <video
                        src={uploadForm.preview}
                        class="w-full h-32 object-cover rounded"
                      />
                    )}
                  </div>
                )}
                <p class="text-sm text-base-content/70">{uploadForm.fileName}</p>
              </div>
              <div class="space-y-3">
                <select
                  class="select select-bordered w-full select-sm"
                  value={uploadForm.privacyLevel}
                  onChange$={(e) =>
                    (uploadForm.privacyLevel = (e.target as HTMLSelectElement)
                      .value as PrivacyLevel)
                  }
                >
                  <option value="public">Public (accessible to everyone)</option>
                  <option value="user">User (owner only)</option>
                  <option value="vendor">Vendor (vendor and admins)</option>
                  <option value="admin">Admin (admins only)</option>
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  class="input input-bordered w-full input-sm"
                  value={uploadForm.description}
                  onInput$={(e) =>
                    (uploadForm.description = (e.target as HTMLInputElement).value)
                  }
                />
                <input
                  type="text"
                  placeholder="Alt text"
                  class="input input-bordered w-full input-sm"
                  value={uploadForm.alt}
                  onInput$={(e) =>
                    (uploadForm.alt = (e.target as HTMLInputElement).value)
                  }
                />
                <div class="flex gap-2">
                  <button
                    type="button"
                    onClick$={handleUpload}
                    disabled={isUploading.value}
                    class="btn btn-primary btn-sm"
                  >
                    {isUploading.value ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    type="button"
                    onClick$={resetUploadForm}
                    class="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Grid/List */}
        <ModalBody class="max-h-96">
          {mediaStore.loading ? (
            <div class="flex items-center justify-center py-8">
              <span class="loading loading-spinner loading-lg"></span>
            </div>
          ) : mediaStore.error ? (
            <div class="text-center py-8 text-error">
              <p>{mediaStore.error}</p>
              <button onClick$={loadMedia} class="btn btn-sm btn-primary mt-2">
                Retry
              </button>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div class="text-center py-8 text-base-content/50">
              <svg
                class="w-12 h-12 mx-auto mb-4 text-base-content/30"
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
              <p>No media files found</p>
              <p class="text-xs mt-2">
                Total items: {mediaStore.items.length} | Search: "
                {searchQuery.value}" | Action available:{" "}
                {getMediaAction ? "Yes" : "No"}
              </p>
              <button
                onClick$={loadMedia}
                class="btn btn-sm btn-outline mt-2"
              >
                Refresh Library
              </button>
            </div>
          ) : (
            <div
              class={
                viewMode.value === "grid"
                  ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                  : "space-y-2"
              }
            >
              {filteredMedia.map((media) => {
                const isSelected = mediaStore.selectedItems.some(
                  (item) => item.id === media.id
                );
                const imageUrls = media.accountHash
                  ? getResponsiveImageUrls(media.id, media.accountHash)
                  : null;

                return (
                  <div
                    key={media.id}
                    class={`cursor-pointer rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-base-200 hover:border-base-300"
                    } ${viewMode.value === "list" ? "flex items-center p-2" : "p-2"}`}
                    onClick$={() => toggleMediaSelection(media)}
                  >
                    {viewMode.value === "grid" ? (
                      <>
                        <div class="aspect-square mb-2 relative">
                          {media.type === "image" ? (
                            imageUrls ? (
                              <img
                                src={imageUrls.small}
                                alt={media.meta?.alt || media.filename}
                                class="w-full h-full object-cover rounded"
                                width={200}
                                height={200}
                              />
                            ) : (
                              <div class="w-full h-full bg-base-200 rounded flex items-center justify-center">
                                <span class="text-base-content/50 text-xs">
                                  No preview
                                </span>
                              </div>
                            )
                          ) : (
                            <div class="w-full h-full bg-base-200 rounded flex items-center justify-center">
                              <svg
                                class="w-8 h-8 text-base-content/40"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            </div>
                          )}
                          {isSelected && (
                            <div class="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <svg
                                class="w-3 h-3 text-primary-content"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p class="text-xs text-base-content/70 truncate">
                          {media.filename}
                        </p>
                      </>
                    ) : (
                      <>
                        <div class="w-12 h-12 flex-shrink-0 mr-3">
                          {media.type === "image" ? (
                            imageUrls ? (
                              <img
                                src={imageUrls.thumbnail}
                                alt={media.meta?.alt || media.filename}
                                class="w-full h-full object-cover rounded"
                                width={48}
                                height={48}
                              />
                            ) : (
                              <div class="w-full h-full bg-base-200 rounded flex items-center justify-center">
                                <span class="text-base-content/50 text-xs">
                                  No preview
                                </span>
                              </div>
                            )
                          ) : (
                            <div class="w-full h-full bg-base-200 rounded flex items-center justify-center">
                              <svg
                                class="w-6 h-6 text-base-content/40"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium truncate">
                            {media.filename}
                          </p>
                          <p class="text-xs text-base-content/50">
                            {media.type} •{" "}
                            {new Date(media.uploaded).toLocaleDateString()}
                          </p>
                          {media.meta?.description && (
                            <p class="text-xs text-base-content/40 truncate">
                              {media.meta.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div class="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <svg
                              class="w-3 h-3 text-primary-content"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ModalBody>

        {/* Footer */}
        <ModalFooter>
          <div class="flex-1 text-sm text-base-content/70">
            {mediaStore.selectedItems.length > 0 && (
              <span>
                {mediaStore.selectedItems.length} item
                {mediaStore.selectedItems.length !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>
          <button type="button" onClick$={handleClose} class="btn btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick$={applySelection}
            disabled={mediaStore.selectedItems.length === 0}
            class="btn btn-primary"
          >
            Select ({mediaStore.selectedItems.length})
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
});
