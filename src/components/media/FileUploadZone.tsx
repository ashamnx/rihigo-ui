import { component$, useSignal, useStore, $, type QRL, noSerialize, type NoSerialize } from '@builder.io/qwik';
import { validateMediaFile, formatFileSize, getAcceptString } from '~/utils/media-client';
import type { MediaType, PrivacyLevel } from '~/types/media';

export interface FileUploadZoneProps {
  /** Callback when files are selected and ready for upload */
  onFilesSelected?: QRL<(files: UploadableFile[]) => void>;
  /** Callback when upload is requested */
  onUpload?: QRL<(file: UploadableFile) => Promise<boolean>>;
  /** Allowed media types */
  allowedTypes?: MediaType[];
  /** Maximum number of files */
  maxFiles?: number;
  /** Privacy level for uploads */
  privacyLevel?: PrivacyLevel;
  /** Whether to show privacy selector */
  showPrivacySelector?: boolean;
  /** Whether multiple files are allowed */
  multiple?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom label text */
  label?: string;
  /** Custom help text */
  helpText?: string;
  /** Show file preview */
  showPreview?: boolean;
}

export interface UploadableFile {
  id: string;
  file: NoSerialize<File>;
  name: string;
  type: string;
  size: number;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  metadata: {
    alt?: string;
    description?: string;
    privacyLevel: PrivacyLevel;
  };
}

export const FileUploadZone = component$<FileUploadZoneProps>((props) => {
  const {
    allowedTypes = ['image', 'video', 'document'],
    maxFiles = 10,
    privacyLevel = 'public',
    showPrivacySelector = false,
    multiple = true,
    disabled = false,
    label = 'Upload files',
    helpText,
    showPreview = true,
    onFilesSelected,
    onUpload,
  } = props;

  const isDragging = useSignal(false);
  const fileInputRef = useSignal<HTMLInputElement>();

  const files = useStore<{ items: UploadableFile[] }>({
    items: [],
  });

  const acceptString = getAcceptString(allowedTypes);

  // Handle file selection
  const handleFileSelect = $(async (fileList: FileList | null) => {
    if (!fileList || disabled) return;

    const newFiles: UploadableFile[] = [];
    const maxToAdd = maxFiles - files.items.length;

    for (let i = 0; i < Math.min(fileList.length, maxToAdd); i++) {
      const file = fileList[i];

      // Validate file
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        console.warn(`File ${file.name} rejected: ${validation.error}`);
        continue;
      }

      // Create preview URL for images
      let preview: string | undefined;
      if (showPreview && file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      // Generate unique ID inline
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const uploadableFile: UploadableFile = {
        id: fileId,
        file: noSerialize(file),
        name: file.name,
        type: file.type,
        size: file.size,
        preview,
        status: 'pending',
        progress: 0,
        metadata: {
          privacyLevel,
        },
      };

      newFiles.push(uploadableFile);
      files.items.push(uploadableFile);
    }

    if (onFilesSelected && newFiles.length > 0) {
      onFilesSelected(newFiles);
    }
  });

  // Handle drag events
  const handleDragOver = $((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      isDragging.value = true;
    }
  });

  const handleDragLeave = $((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = false;
  });

  const handleDrop = $(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = false;

    if (disabled) return;

    const fileList = e.dataTransfer?.files;
    await handleFileSelect(fileList || null);
  });

  // Handle input change
  const handleInputChange = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    await handleFileSelect(input.files);
    // Reset input to allow selecting same file again
    input.value = '';
  });

  // Open file picker
  const openFilePicker = $(() => {
    if (!disabled && fileInputRef.value) {
      fileInputRef.value.click();
    }
  });

  // Remove file from list
  const removeFile = $((fileId: string) => {
    const index = files.items.findIndex((f) => f.id === fileId);
    if (index > -1) {
      const file = files.items[index];
      // Revoke preview URL to free memory
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      files.items.splice(index, 1);
    }
  });

  // Update file metadata
  const updateFileMetadata = $((fileId: string, key: 'alt' | 'description', value: string) => {
    const file = files.items.find((f) => f.id === fileId);
    if (file) {
      file.metadata[key] = value;
    }
  });

  // Update file privacy level
  const updateFilePrivacy = $((fileId: string, level: PrivacyLevel) => {
    const file = files.items.find((f) => f.id === fileId);
    if (file) {
      file.metadata.privacyLevel = level;
    }
  });

  // Upload a single file
  const uploadFile = $(async (fileId: string) => {
    const file = files.items.find((f) => f.id === fileId);
    if (!file || !onUpload) return;

    file.status = 'uploading';
    file.progress = 0;

    try {
      const success = await onUpload(file);
      file.status = success ? 'success' : 'error';
      file.progress = success ? 100 : 0;
      if (!success) {
        file.error = 'Upload failed';
      }
    } catch (error) {
      file.status = 'error';
      file.error = error instanceof Error ? error.message : 'Upload failed';
    }
  });

  // Upload all pending files
  const uploadAllFiles = $(async () => {
    if (!onUpload) return;

    for (const file of files.items) {
      if (file.status === 'pending') {
        await uploadFile(file.id);
      }
    }
  });

  // Clear all files
  const clearAllFiles = $(() => {
    for (const file of files.items) {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    }
    files.items = [];
  });

  return (
    <div class="space-y-4">
      {/* Drop Zone */}
      <div
        class={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragging.value ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver$={handleDragOver}
        onDragLeave$={handleDragLeave}
        onDrop$={handleDrop}
        onClick$={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          class="hidden"
          accept={acceptString}
          multiple={multiple}
          disabled={disabled}
          onChange$={handleInputChange}
        />

        <div class="flex flex-col items-center">
          <svg
            class={`w-12 h-12 mb-3 ${isDragging.value ? 'text-primary' : 'text-base-content/40'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p class="text-base font-medium text-base-content">{label}</p>
          <p class="text-sm text-base-content/60 mt-1">
            Drag and drop or <span class="text-primary">browse</span>
          </p>

          {helpText && <p class="text-xs text-base-content/50 mt-2">{helpText}</p>}

          <div class="flex flex-wrap gap-2 justify-center mt-3">
            {allowedTypes.includes('image') && (
              <span class="badge badge-outline badge-sm">Images</span>
            )}
            {allowedTypes.includes('video') && (
              <span class="badge badge-outline badge-sm">Videos</span>
            )}
            {allowedTypes.includes('document') && (
              <span class="badge badge-outline badge-sm">Documents</span>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.items.length > 0 && (
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium">
              {files.items.length} file{files.items.length !== 1 ? 's' : ''} selected
            </h4>
            <div class="flex gap-2">
              {onUpload && files.items.some((f) => f.status === 'pending') && (
                <button type="button" class="btn btn-primary btn-sm" onClick$={uploadAllFiles}>
                  Upload All
                </button>
              )}
              <button type="button" class="btn btn-ghost btn-sm" onClick$={clearAllFiles}>
                Clear All
              </button>
            </div>
          </div>

          <div class="space-y-2">
            {files.items.map((file) => (
              <div
                key={file.id}
                class={`
                  flex items-start gap-3 p-3 rounded-lg border
                  ${file.status === 'error' ? 'border-error bg-error/5' : 'border-base-300 bg-base-100'}
                `}
              >
                {/* Preview */}
                {showPreview && (
                  <div class="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-base-200">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.metadata.alt || file.name}
                        class="w-full h-full object-cover"
                        width={64}
                        height={64}
                      />
                    ) : file.type.startsWith('video/') ? (
                      <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-base-content/40" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                      </div>
                    ) : (
                      <div class="w-full h-full flex items-center justify-center">
                        <svg
                          class="w-8 h-8 text-base-content/40"
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

                {/* File Info */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0">
                      <p class="text-sm font-medium truncate">{file.name}</p>
                      <p class="text-xs text-base-content/60">{formatFileSize(file.size)}</p>
                    </div>

                    {/* Status Badge */}
                    <div class="flex items-center gap-2">
                      {file.status === 'pending' && (
                        <span class="badge badge-ghost badge-sm">Pending</span>
                      )}
                      {file.status === 'uploading' && (
                        <span class="badge badge-info badge-sm">
                          <span class="loading loading-spinner loading-xs mr-1"></span>
                          Uploading
                        </span>
                      )}
                      {file.status === 'success' && (
                        <span class="badge badge-success badge-sm">Uploaded</span>
                      )}
                      {file.status === 'error' && (
                        <span class="badge badge-error badge-sm">Failed</span>
                      )}

                      <button
                        type="button"
                        class="btn btn-ghost btn-xs btn-circle"
                        onClick$={() => removeFile(file.id)}
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {file.status === 'uploading' && (
                    <div class="w-full h-1 bg-base-300 rounded-full mt-2 overflow-hidden">
                      <div
                        class="h-full bg-primary transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {file.error && <p class="text-xs text-error mt-1">{file.error}</p>}

                  {/* Metadata Fields */}
                  {file.status === 'pending' && (
                    <div class="flex flex-wrap gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Alt text"
                        class="input input-bordered input-xs flex-1 min-w-32"
                        value={file.metadata.alt || ''}
                        onInput$={(e) =>
                          updateFileMetadata(file.id, 'alt', (e.target as HTMLInputElement).value)
                        }
                      />

                      {showPrivacySelector && (
                        <select
                          class="select select-bordered select-xs"
                          value={file.metadata.privacyLevel}
                          onChange$={(e) =>
                            updateFilePrivacy(
                              file.id,
                              (e.target as HTMLSelectElement).value as PrivacyLevel
                            )
                          }
                        >
                          <option value="public">Public</option>
                          <option value="user">User</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default FileUploadZone;
