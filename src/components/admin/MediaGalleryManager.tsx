import { $, component$, type QRL, useSignal } from "@builder.io/qwik";
import { MediaLibrary } from "./MediaLibrary";
import {
  getResponsiveImageUrls,
  type MediaItem,
} from "~/utils/cloudflare-images";
import type { ActionStore } from "@builder.io/qwik-city";

export interface MediaGalleryManagerProps {
  activityId?: string;
  selectedMedia: MediaItem[];
  onMediaChange: QRL<(media: MediaItem[]) => void>;
  maxItems?: number;
  allowReorder?: boolean;
  /** @deprecated Use getPresignedUrlAction + createMediaRecordAction instead */
  uploadAction?: ActionStore<any, Record<string, any>>;
  getMediaAction?: ActionStore<any, Record<string, any>>;
  deleteAction?: ActionStore<any, Record<string, any>>;
  /** Action to get presigned upload URL (step 1) */
  getPresignedUrlAction?: ActionStore<any, Record<string, any>>;
  /** Action to create media record after upload (step 2) */
  createMediaRecordAction?: ActionStore<any, Record<string, any>>;
}

export const MediaGalleryManager = component$<MediaGalleryManagerProps>(
  ({
    activityId,
    selectedMedia,
    onMediaChange,
    maxItems = 10,
    allowReorder = true,
    getMediaAction,
    deleteAction,
    getPresignedUrlAction,
    createMediaRecordAction,
  }) => {
    const draggedIndex = useSignal<number | null>(null);

    const handleSelectMedia = $((newMedia: MediaItem[]) => {
      // Limit the number of items if maxItems is set
      const limitedMedia = maxItems ? newMedia.slice(0, maxItems) : newMedia;
      onMediaChange(limitedMedia);
    });

    const removeMedia = $((index: number) => {
      const updated = selectedMedia.filter((_, i) => i !== index);
      onMediaChange(updated);
    });

    const reorderMedia = $((fromIndex: number, toIndex: number) => {
      if (!allowReorder) return;

      const updated = [...selectedMedia];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onMediaChange(updated);
    });

    const handleDragStart = $((index: number) => {
      draggedIndex.value = index;
    });

    const handleDragOver = $((event: DragEvent) => {
      event.preventDefault();
    });

    const handleDrop = $((event: DragEvent, targetIndex: number) => {
      event.preventDefault();

      if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
        reorderMedia(draggedIndex.value, targetIndex);
      }

      draggedIndex.value = null;
    });

    const setPrimaryImage = $((index: number) => {
      if (index === 0) return; // Already primary

      const updated = [...selectedMedia];
      const [primaryImage] = updated.splice(index, 1);
      updated.unshift(primaryImage);
      onMediaChange(updated);
    });

    return (
      <div class="space-y-4">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium">Media Gallery</h3>
            <p class="text-sm text-gray-600">
              Manage images and videos for this activity
              {maxItems && ` (max ${maxItems} items)`}
            </p>
          </div>
          <MediaLibrary
            onSelectMedia={handleSelectMedia}
            multiSelect={true}
            selectedMedia={selectedMedia}
            activityId={activityId}
            allowUpload={true}
            getMediaAction={getMediaAction}
            deleteAction={deleteAction}
            getPresignedUrlAction={getPresignedUrlAction}
            createMediaRecordAction={createMediaRecordAction}
          />
        </div>

        {/* Selected Media Grid */}
        {selectedMedia.length > 0 ? (
          <div class="space-y-4">
            {/* Primary Image Notice */}
            {selectedMedia.length > 1 && (
              <div class="alert alert-info">
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>
                  The first image will be used as the primary/featured image for
                  this activity.
                </span>
              </div>
            )}

            <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {selectedMedia.map((media, index) => {
                const imageUrls = media.accountHash
                  ? getResponsiveImageUrls(media.id, media.accountHash)
                  : null;
                // For R2 storage, use cdnUrl directly; for Cloudflare Images, use responsive URLs
                const displayUrl = imageUrls?.medium || media.cdnUrl || (media.variants && media.variants[0]);
                const isPrimary = index === 0;

                return (
                  <div
                    key={media.id}
                    class={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                      isPrimary
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200"
                    }`}
                    draggable={allowReorder}
                    onDragStart$={() => handleDragStart(index)}
                    onDragOver$={handleDragOver}
                    onDrop$={(event) => handleDrop(event, index)}
                  >
                    {/* Primary Badge */}
                    {isPrimary && (
                      <div class="absolute top-2 left-2 z-10 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                        Primary
                      </div>
                    )}

                    {/* Media Content */}
                    <div class="relative aspect-square">
                      {media.type === "image" ? (
                        displayUrl ? (
                          <img
                            src={displayUrl}
                            alt={media.meta?.alt || media.filename}
                            class="h-full w-full object-cover"
                            width={400}
                            height={400}
                          />
                        ) : (
                          <div class="flex h-full w-full items-center justify-center bg-gray-200">
                            <span class="text-sm text-gray-500">
                              No preview
                            </span>
                          </div>
                        )
                      ) : (
                        <div class="relative flex h-full w-full items-center justify-center bg-gray-200">
                          <svg
                            class="h-12 w-12 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                          <div class="bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black">
                            <span class="text-sm font-medium text-white">
                              VIDEO
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Drag Handle */}
                      {allowReorder && (
                        <div class="bg-opacity-50 absolute top-2 right-2 cursor-move rounded bg-black p-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <svg
                            class="h-4 w-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div class="bg-opacity-0 group-hover:bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all group-hover:opacity-100">
                        <div class="flex gap-2">
                          {/* Set as Primary */}
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick$={() => setPrimaryImage(index)}
                              class="btn btn-primary btn-sm"
                              title="Set as primary image"
                            >
                              <svg
                                class="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            </button>
                          )}

                          {/* Remove */}
                          <button
                            type="button"
                            onClick$={() => removeMedia(index)}
                            class="btn btn-error btn-sm"
                            title="Remove from gallery"
                          >
                            <svg
                              class="h-4 w-4"
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
                      </div>
                    </div>

                    {/* Media Info */}
                    <div class="bg-white p-3">
                      <p class="truncate text-sm font-medium text-gray-900">
                        {media.meta?.description || media.filename}
                      </p>
                      <p class="text-xs text-gray-500">
                        {media.type} •{" "}
                        {new Date(media.uploaded).toLocaleDateString()}
                      </p>
                      {media.meta?.alt && (
                        <p class="mt-1 truncate text-xs text-gray-400">
                          Alt: {media.meta.alt}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reorder Instructions */}
            {allowReorder && selectedMedia.length > 1 && (
              <div class="text-sm text-gray-600">
                <svg
                  class="mr-1 inline h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Drag and drop to reorder. Click the star icon to set as primary
                image.
              </div>
            )}
          </div>
        ) : (
          <div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <svg
              class="mx-auto mb-4 h-12 w-12 text-gray-400"
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
            <h3 class="mb-2 text-lg font-medium text-gray-900">
              No media selected
            </h3>
            <p class="mb-4 text-gray-600">
              Add images and videos to showcase this activity
            </p>
            <MediaLibrary
              onSelectMedia={handleSelectMedia}
              multiSelect={true}
              selectedMedia={selectedMedia}
              activityId={activityId}
              allowUpload={true}
              getMediaAction={getMediaAction}
              deleteAction={deleteAction}
              getPresignedUrlAction={getPresignedUrlAction}
              createMediaRecordAction={createMediaRecordAction}
            />
          </div>
        )}
      </div>
    );
  },
);
