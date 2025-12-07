import {
  component$,
  createContextId,
  type Signal,
  Slot,
  useContextProvider,
  useSignal,
  useContext,
  $,
  type QRL,
} from "@builder.io/qwik";
import type { Toast, ToastType } from "~/types/notification";

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;

export interface ToastContextType {
  toasts: Signal<Toast[]>;
  addToast: QRL<(toast: Omit<Toast, "id">) => string>;
  removeToast: QRL<(id: string) => void>;
  clearToasts: QRL<() => void>;
}

export const ToastContext = createContextId<ToastContextType>("toast-context");

/**
 * Generate a unique ID for toasts
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Toast Provider Component
 * Provides toast context for displaying notifications
 */
export const ToastProvider = component$(() => {
  const toasts = useSignal<Toast[]>([]);

  const addToast = $((toast: Omit<Toast, "id">) => {
    const id = generateToastId();
    const newToast: Toast = {
      id,
      duration: DEFAULT_DURATION,
      dismissible: true,
      ...toast,
    };

    // Limit toasts to MAX_TOASTS, removing oldest if necessary
    toasts.value = [...toasts.value.slice(-(MAX_TOASTS - 1)), newToast];

    // Auto-remove after duration (if duration > 0)
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
      }, newToast.duration);
    }

    return id;
  });

  const removeToast = $((id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  });

  const clearToasts = $(() => {
    toasts.value = [];
  });

  useContextProvider(ToastContext, {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  });

  return <Slot />;
});

/**
 * Hook to use toast context
 */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * Convenience hook for common toast operations
 * Returns typed helper functions for success, error, warning, and info toasts
 */
export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    success: $((message: string, title?: string) =>
      addToast({ type: "success" as ToastType, message, title })
    ),
    error: $((message: string, title?: string) =>
      addToast({ type: "error" as ToastType, message, title })
    ),
    warning: $((message: string, title?: string) =>
      addToast({ type: "warning" as ToastType, message, title })
    ),
    info: $((message: string, title?: string) =>
      addToast({ type: "info" as ToastType, message, title })
    ),
  };
}
