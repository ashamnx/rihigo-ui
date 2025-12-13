/**
 * Modal Component using native HTML <dialog> element with DaisyUI styling
 *
 * This follows the Qwik-recommended approach for modals:
 * - Uses native browser dialog API with showModal()
 * - Automatic top-layer rendering (no z-index issues)
 * - Built-in focus trapping and scroll locking
 * - Native backdrop support
 * - DaisyUI modal styling
 *
 * @see https://qwik.dev/docs/cookbook/portals/
 * @see https://daisyui.com/components/modal/
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
      const isOpen = track(() => show.value);
      const dialog = dialogRef.value;

      if (!dialog) return;

      if (isOpen && !dialog.open) {
        dialog.showModal();
      } else if (!isOpen && dialog.open) {
        dialog.close();
      }
    }, { strategy: 'document-ready' });

    // Handle native dialog close event (Escape key, form submission)
    const handleClose = $(() => {
      show.value = false;
      onClose$?.();
    });

    // Size classes mapping
    const sizeClasses: Record<string, string> = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      full: "max-w-[95vw]",
    };

    return (
      <dialog
        ref={dialogRef}
        class="modal"
        onClose$={handleClose}
      >
        <div
          class={[
            "modal-box",
            sizeClasses[size],
            "w-full p-0 flex flex-col max-h-[90vh]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Slot />
        </div>
        {/* Backdrop for click-outside-to-close */}
        {closeOnBackdropClick && (
          <div class="modal-backdrop" onClick$={handleClose}>
            <button type="button" class="sr-only">close</button>
          </div>
        )}
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
          "flex items-center justify-between p-4 border-b border-base-200 flex-shrink-0",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Slot />
        {onClose$ && (
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-circle"
            aria-label="Close modal"
            onClick$={onClose$}
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
    <h3 class="text-lg font-bold">
      <Slot />
    </h3>
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
      class={["p-4 overflow-y-auto flex-1", className].filter(Boolean).join(" ")}
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
          "modal-action p-4 border-t border-base-200 flex-shrink-0 mt-0",
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
