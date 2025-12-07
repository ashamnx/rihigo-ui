import { component$ } from "@builder.io/qwik";
import { useToast } from "~/context/toast-context";
import type { ToastType } from "~/types/notification";

/**
 * DaisyUI alert class mapping for toast types
 */
const toastStyles: Record<ToastType, string> = {
  success: "alert-success",
  error: "alert-error",
  warning: "alert-warning",
  info: "alert-info",
};

/**
 * SVG icons for each toast type
 */
const ToastIcon = component$<{ type: ToastType }>(({ type }) => {
  switch (type) {
    case "success":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "error":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "warning":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case "info":
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
});

/**
 * Toast Container Component
 * Displays toast notifications in the top-right corner
 */
export const ToastContainer = component$(() => {
  const { toasts, removeToast } = useToast();

  return (
    <div class="toast toast-end toast-top z-[100] pointer-events-none">
      {toasts.value.map((toast) => (
        <div
          key={toast.id}
          class={`alert ${toastStyles[toast.type]} shadow-lg pointer-events-auto max-w-sm animate-fade-in`}
        >
          <ToastIcon type={toast.type} />
          <div class="flex-1">
            {toast.title && <h3 class="font-bold text-sm">{toast.title}</h3>}
            <div class="text-sm">{toast.message}</div>
          </div>
          <div class="flex gap-2">
            {toast.action && (
              <button
                type="button"
                class="btn btn-sm btn-ghost"
                onClick$={toast.action.onClick}
              >
                {toast.action.label}
              </button>
            )}
            {toast.dismissible && (
              <button
                type="button"
                class="btn btn-sm btn-ghost btn-square"
                onClick$={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

export default ToastContainer;
