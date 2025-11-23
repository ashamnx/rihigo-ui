import {$, component$, Slot} from "@builder.io/qwik";

interface ErrorStateProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry$?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

/**
 * Reusable error state component for displaying API failures and other errors
 */
export const ErrorState = component$<ErrorStateProps>(({
  title = "Something went wrong",
  message = "We encountered an error loading the data. Please try again.",
  showRetry = true,
  onRetry$,
  variant = 'error',
}) => {
  const iconColor = variant === 'error' ? 'text-error' : variant === 'warning' ? 'text-warning' : 'text-info';
  const bgColor = variant === 'error' ? 'bg-error/10' : variant === 'warning' ? 'bg-warning/10' : 'bg-info/10';

  return (
    <div class="flex flex-col items-center justify-center py-12 px-4">
      <div class={`${bgColor} rounded-full p-6 mb-4`}>
        <svg
          class={`w-16 h-16 ${iconColor}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 class="text-lg font-semibold text-base-content mb-2">
        {title}
      </h3>

      <p class="text-base-content/70 text-center max-w-md mb-6">
        {message}
      </p>

      <div class="flex gap-3">
        {showRetry && (
          <button
            type="button"
            class="btn btn-primary"
            onClick$={onRetry$ || $(() => window.location.reload())}
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        )}

        <Slot />
      </div>
    </div>
  );
});
