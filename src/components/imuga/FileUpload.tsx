import { component$, useSignal, $, type QRL } from '@builder.io/qwik';

interface FileUploadProps {
  name: string;
  value?: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
  onUpload$?: QRL<(base64: string) => void>;
  onRemove$?: QRL<() => void>;
}

export const FileUpload = component$<FileUploadProps>(
  ({
    name,
    value,
    label,
    accept = 'image/*',
    maxSizeMB = 5,
    required = false,
    disabled = false,
    placeholder = 'Click to upload or drag and drop',
    helpText,
    onUpload$,
    onRemove$,
  }) => {
    const isLoading = useSignal(false);
    const error = useSignal<string | null>(null);
    const previewUrl = useSignal<string | null>(value || null);

    const handleFileChange = $(async (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];

      if (!file) return;

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        error.value = `File size must be less than ${maxSizeMB}MB`;
        input.value = '';
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        error.value = 'Please upload an image file';
        input.value = '';
        return;
      }

      error.value = null;
      isLoading.value = true;

      try {
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        previewUrl.value = base64;
        if (onUpload$) {
          onUpload$(base64);
        }
      } catch {
        error.value = 'Failed to process file';
      } finally {
        isLoading.value = false;
      }
    });

    const handleRemove = $(() => {
      previewUrl.value = null;
      if (onRemove$) {
        onRemove$();
      }
    });

    return (
      <div class="form-control">
        {label && (
          <label class="label">
            <span class="label-text">
              {label}
              {required && <span class="text-error ml-1">*</span>}
            </span>
          </label>
        )}

        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={previewUrl.value || ''} />

        {previewUrl.value ? (
          // Preview mode
          <div class="relative">
            <div class="w-full h-48 bg-base-200 rounded-lg overflow-hidden">
              <img
                src={previewUrl.value}
                alt="Preview"
                class="w-full h-full object-contain"
                width={300}
                height={200}
              />
            </div>
            <button
              type="button"
              class="btn btn-circle btn-sm btn-error absolute top-2 right-2"
              onClick$={handleRemove}
              disabled={disabled}
            >
              <svg
                class="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          // Upload mode
          <label
            class={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              disabled
                ? 'border-base-300 bg-base-200 cursor-not-allowed'
                : 'border-base-300 bg-base-100 hover:bg-base-200'
            } ${error.value ? 'border-error' : ''}`}
          >
            {isLoading.value ? (
              <span class="loading loading-spinner loading-md"></span>
            ) : (
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  class="size-8 mb-2 text-base-content/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p class="text-sm text-base-content/70">{placeholder}</p>
                <p class="text-xs text-base-content/50 mt-1">
                  Max {maxSizeMB}MB
                </p>
              </div>
            )}
            <input
              type="file"
              class="hidden"
              accept={accept}
              disabled={disabled || isLoading.value}
              onChange$={handleFileChange}
            />
          </label>
        )}

        {error.value && (
          <label class="label">
            <span class="label-text-alt text-error">{error.value}</span>
          </label>
        )}

        {helpText && !error.value && (
          <label class="label">
            <span class="label-text-alt text-base-content/50">{helpText}</span>
          </label>
        )}
      </div>
    );
  }
);

export default FileUpload;
