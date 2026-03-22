import { component$, useSignal, useStore, $, type QRL } from '@builder.io/qwik';
import { server$ } from '@builder.io/qwik-city';

interface ExtractorState {
  imageDataUri: string;
  isExtracting: boolean;
  extractedFields: Record<string, any> | null;
  error: string;
  applied: boolean;
}

interface ExtractionResult {
  success: boolean;
  data?: Record<string, any>;
  error_message?: string;
}

interface DocumentExtractorProps {
  documentType: string;
  apiEndpoint: string;
  onExtract$: QRL<(fields: Record<string, any>) => void>;
  accept?: string;
  label?: string;
}

const extractFromServer = server$(async function (
  apiEndpoint: string,
  imageBase64: string,
): Promise<ExtractionResult> {
  const API_BASE_URL = this.env.get('API_URL') || 'http://localhost:8080';
  const url = `${API_BASE_URL}${apiEndpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: imageBase64 }),
  });

  const data = (await response.json()) as ExtractionResult;

  if (!response.ok) {
    return {
      success: false,
      error_message:
        data.error_message || `Extraction failed with status ${response.status}`,
    };
  }

  return data;
});

export const DocumentExtractor = component$<DocumentExtractorProps>(
  ({
    documentType,
    apiEndpoint,
    onExtract$,
    accept = 'image/jpeg,image/png',
    label,
  }) => {
    const fileInputRef = useSignal<HTMLInputElement>();
    const state = useStore<ExtractorState>({
      imageDataUri: '',
      isExtracting: false,
      extractedFields: null,
      error: '',
      applied: false,
    });

    const handleFileChange = $(async (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        state.error = 'File size must be less than 5MB';
        input.value = '';
        return;
      }

      state.error = '';
      state.extractedFields = null;
      state.applied = false;

      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      state.imageDataUri = dataUri;
    });

    const handleExtract = $(async () => {
      if (!state.imageDataUri) return;

      state.isExtracting = true;
      state.error = '';
      state.extractedFields = null;

      try {
        const result = await extractFromServer(apiEndpoint, state.imageDataUri);

        if (result.success && result.data) {
          state.extractedFields = result.data;
        } else {
          state.error =
            result.error_message || 'Failed to extract fields from document';
        }
      } catch {
        state.error = 'Network error during extraction. Please try again.';
      } finally {
        state.isExtracting = false;
      }
    });

    const handleApply = $(async () => {
      if (state.extractedFields) {
        await onExtract$({
          ...state.extractedFields,
          _image_base64: state.imageDataUri,
        });
        state.applied = true;
      }
    });

    const handleCancel = $(() => {
      state.extractedFields = null;
    });

    const handleRemoveImage = $(() => {
      state.imageDataUri = '';
      state.extractedFields = null;
      state.error = '';
      state.applied = false;
      if (fileInputRef.value) {
        fileInputRef.value.value = '';
      }
    });

    const displayLabel = label || `Upload ${documentType}`;

    return (
      <div class="card card-bordered bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h4 class="card-title text-sm flex items-center gap-2">
            <svg
              class="size-4 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
            AI {displayLabel}
          </h4>

          {!state.imageDataUri ? (
            // File upload zone
            <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-secondary/30 rounded-lg cursor-pointer bg-base-200/50 hover:bg-base-200 transition-colors">
              <div class="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  class="size-8 mb-2 text-secondary/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                  />
                </svg>
                <p class="text-sm text-base-content/70">
                  Upload {documentType} for AI extraction
                </p>
                <p class="text-xs text-base-content/50 mt-1">
                  JPEG or PNG, max 5MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                class="hidden"
                accept={accept}
                onChange$={handleFileChange}
              />
            </label>
          ) : (
            // Image preview + actions
            <div>
              <div class="relative mb-3">
                <div class="w-full h-40 bg-base-200 rounded-lg overflow-hidden">
                  <img
                    src={state.imageDataUri}
                    alt={`${documentType} preview`}
                    class="w-full h-full object-contain"
                    width={300}
                    height={160}
                  />
                </div>
                <button
                  type="button"
                  class="btn btn-circle btn-xs btn-error absolute top-2 right-2"
                  onClick$={handleRemoveImage}
                >
                  <svg
                    class="size-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
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

              {/* Extract button */}
              {!state.extractedFields && !state.isExtracting && !state.applied && (
                <button
                  type="button"
                  class="btn btn-secondary btn-sm w-full gap-2"
                  onClick$={handleExtract}
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
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                  Extract with AI
                </button>
              )}

              {/* Loading spinner */}
              {state.isExtracting && (
                <div class="flex items-center justify-center gap-2 py-3">
                  <span class="loading loading-spinner loading-sm text-secondary"></span>
                  <span class="text-sm text-base-content/70">
                    Extracting fields...
                  </span>
                </div>
              )}

              {/* Error */}
              {state.error && (
                <div class="alert alert-error alert-sm mt-2">
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
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  <span class="text-xs">{state.error}</span>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs"
                    onClick$={handleExtract}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Extracted fields preview */}
              {state.extractedFields && !state.applied && (
                <div class="mt-2">
                  <div class="bg-base-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <p class="text-xs font-semibold text-base-content/70 mb-2">
                      Extracted Fields:
                    </p>
                    <div class="space-y-1">
                      {Object.entries(state.extractedFields)
                        .filter(([, value]) => value !== '' && value !== null && value !== undefined)
                        .map(([key, value]) => (
                          <div key={key} class="flex justify-between text-xs">
                            <span class="text-base-content/60">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span class="font-medium text-right max-w-[60%] truncate">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div class="flex gap-2 mt-3">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm flex-1"
                      onClick$={handleApply}
                    >
                      Apply Fields
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      onClick$={handleCancel}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Applied success */}
              {state.applied && (
                <div class="alert alert-success alert-sm mt-2">
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
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-xs">
                    Fields auto-filled by AI. Please review for accuracy.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default DocumentExtractor;
