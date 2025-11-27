import { component$, type QRL } from '@builder.io/qwik';

export interface ConfirmModalProps {
    id: string;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    loading?: boolean;
    onConfirm$: QRL<() => void>;
    onCancel$?: QRL<() => void>;
}

export const ConfirmModal = component$<ConfirmModalProps>(({
    id,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    loading = false,
    onConfirm$,
    onCancel$,
}) => {
    return (
        <dialog id={id} class="modal">
            <div class="modal-box">
                <h3 class="font-bold text-lg">{title}</h3>
                <p class="py-4 text-base-content/70">{message}</p>
                <div class="modal-action">
                    <form method="dialog" class="flex gap-2">
                        <button
                            type="button"
                            class="btn btn-ghost"
                            onClick$={() => {
                                const modal = document.getElementById(id) as HTMLDialogElement;
                                modal?.close();
                                onCancel$?.();
                            }}
                            disabled={loading}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            class={`btn ${danger ? 'btn-error' : 'btn-primary'}`}
                            onClick$={async () => {
                                await onConfirm$();
                                const modal = document.getElementById(id) as HTMLDialogElement;
                                modal?.close();
                            }}
                            disabled={loading}
                        >
                            {loading && <span class="loading loading-spinner loading-sm"></span>}
                            {confirmText}
                        </button>
                    </form>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
});

// Helper function to show modal
export const showModal = (id: string) => {
    const modal = document.getElementById(id) as HTMLDialogElement;
    modal?.showModal();
};

// Helper function to close modal
export const closeModal = (id: string) => {
    const modal = document.getElementById(id) as HTMLDialogElement;
    modal?.close();
};
