/**
 * Modal Component using native HTML <dialog> element
 *
 * This follows the Qwik-recommended approach for modals:
 * - Uses native browser dialog API with showModal()
 * - Automatic top-layer rendering (no z-index issues)
 * - Built-in focus trapping and scroll locking
 * - Native backdrop support with ::backdrop pseudo-element
 * - Less JavaScript, better performance
 *
 * @see https://qwik.dev/docs/cookbook/portals/
 */

import {
  component$,
  Slot,
  useSignal,
  useVisibleTask$,
  type Signal,
  type QRL,
  $,
} from "@builder.io/qwik";

export interface ModalProps {
  /** Signal to control modal open/close state */
  show: Signal<boolean>;
  /** Called when modal is closed (via backdrop click, Escape key, or close button) */
  onClose$?: QRL<() => void>;
  /** Prevent closing on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Modal size: sm, md, lg, xl, full */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Additional CSS classes for the modal panel */
  class?: string;
}

export const Modal = component$<ModalProps>(
  ({
    show,
    onClose$,
    closeOnBackdropClick = true,
    size = "lg",
    class: className,
  }) => {
    const dialogRef = useSignal<HTMLDialogElement>();

    // Sync the signal state with the native dialog
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      track(() => show.value);

      const dialog = dialogRef.value;
      if (!dialog) return;

      if (show.value && !dialog.open) {
        dialog.showModal();
      } else if (!show.value && dialog.open) {
        dialog.close();
      }
    });

    // Handle native dialog close event (Escape key, form submission)
    const handleClose = $(() => {
      show.value = false;
      onClose$?.();
    });

    // Handle backdrop click
    const handleBackdropClick = $((event: MouseEvent) => {
      const dialog = dialogRef.value;
      if (!dialog || !closeOnBackdropClick) return;

      // Check if click was on the backdrop (dialog element itself, not its content)
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      // If click is outside the visible dialog content area, close
      if (event.target === dialog && !isInDialog) {
        handleClose();
      }
    });

    // Size classes mapping
    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      full: "max-w-[95vw]",
    };

    return (
      <dialog
        ref={dialogRef}
        class={[
          // Base styles
          "modal-panel bg-base-100 rounded-lg shadow-xl p-0 m-auto",
          "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
          // Size
          sizeClasses[size],
          "w-full",
          // Animation
          "opacity-0 scale-95 open:opacity-100 open:scale-100",
          "transition-all duration-200 ease-out",
          // Custom classes
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClose$={handleClose}
        onClick$={handleBackdropClick}
      >
        <Slot />
      </dialog>
    );
  }
);

/**
 * Modal Header component
 */
export interface ModalHeaderProps {
  /** Called when close button is clicked */
  onClose$?: QRL<() => void>;
  /** Additional CSS classes */
  class?: string;
}

export const ModalHeader = component$<ModalHeaderProps>(
  ({ onClose$, class: className }) => {
    return (
      <div
        class={[
          "flex items-center justify-between p-4 border-b border-base-200",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Slot />
        {onClose$ && (
          <button
            type="button"
            onClick$={onClose$}
            class="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
    );
  }
);

/**
 * Modal Title component
 */
export const ModalTitle = component$(() => {
  return (
    <h2 class="text-xl font-semibold">
      <Slot />
    </h2>
  );
});

/**
 * Modal Body component
 */
export interface ModalBodyProps {
  /** Additional CSS classes */
  class?: string;
}

export const ModalBody = component$<ModalBodyProps>(({ class: className }) => {
  return (
    <div
      class={["p-4 overflow-y-auto", className].filter(Boolean).join(" ")}
    >
      <Slot />
    </div>
  );
});

/**
 * Modal Footer component
 */
export interface ModalFooterProps {
  /** Additional CSS classes */
  class?: string;
}

export const ModalFooter = component$<ModalFooterProps>(
  ({ class: className }) => {
    return (
      <div
        class={[
          "flex items-center justify-end gap-2 p-4 border-t border-base-200 bg-base-200/50",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Slot />
      </div>
    );
  }
);
