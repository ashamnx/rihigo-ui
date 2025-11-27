// @ts-nocheck
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { PaymentMethod } from '~/types/payment';
import type { VendorPaymentMethod, PaymentMethodInput } from '~/types/billing';
import { PAYMENT_PROVIDERS } from '~/types/billing';

export const useLoadPaymentMethods = routeLoader$<VendorPaymentMethod[]>(async (requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const result = await apiClient.vendorPortal.billingSettings.get(token);
        return result.data?.payment_methods || [];
    });
});

export const useSavePaymentMethod = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const input: PaymentMethodInput = {
            method_type: data.method_type as PaymentMethod,
            provider: data.provider as string || undefined,
            display_name: data.display_name as string,
            is_enabled: data.is_enabled === 'true',
            is_default: data.is_default === 'true',
            credentials: data.credentials ? JSON.parse(data.credentials as string) : undefined,
            settings: data.settings ? JSON.parse(data.settings as string) : undefined,
        };

        const id = data.id as string;
        let result;

        if (id) {
            result = await apiClient.vendorPortal.billingSettings.update({ payment_method_id: id, ...input }, token);
        } else {
            result = await apiClient.vendorPortal.billingSettings.update({ new_payment_method: input }, token);
        }

        return { success: result.success, error: result.error_message };
    });
});

export const useDeletePaymentMethod = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const result = await apiClient.vendorPortal.billingSettings.update(
            { delete_payment_method_id: data.id as string },
            token
        );
        return { success: result.success, error: result.error_message };
    });
});

export default component$(() => {
    const paymentMethods = useLoadPaymentMethods();
    const saveAction = useSavePaymentMethod();
    const deleteAction = useDeletePaymentMethod();

    const showModal = useSignal(false);
    const editingMethod = useSignal<VendorPaymentMethod | null>(null);
    const showDeleteConfirm = useSignal(false);
    const methodToDelete = useSignal<VendorPaymentMethod | null>(null);

    // Form state
    const formState = useStore<PaymentMethodInput>({
        method_type: 'cash',
        display_name: '',
        is_enabled: true,
        is_default: false,
    });

    const methodTypes: { value: PaymentMethod; label: string; icon: string }[] = [
        { value: 'cash', label: 'Cash', icon: 'banknotes' },
        { value: 'card', label: 'Card', icon: 'credit-card' },
        { value: 'bank_transfer', label: 'Bank Transfer', icon: 'building-library' },
        { value: 'online', label: 'Online Payment', icon: 'globe-alt' },
        { value: 'wallet', label: 'Digital Wallet', icon: 'device-phone-mobile' },
        { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
    ];

    const openModal = $((method?: VendorPaymentMethod) => {
        if (method) {
            editingMethod.value = method;
            formState.method_type = method.method_type;
            formState.provider = method.provider;
            formState.display_name = method.display_name;
            formState.is_enabled = method.is_enabled;
            formState.is_default = method.is_default;
            formState.credentials = method.credentials;
            formState.settings = method.settings;
        } else {
            editingMethod.value = null;
            formState.method_type = 'cash';
            formState.provider = undefined;
            formState.display_name = '';
            formState.is_enabled = true;
            formState.is_default = false;
            formState.credentials = undefined;
            formState.settings = undefined;
        }
        showModal.value = true;
    });

    const confirmDelete = $((method: VendorPaymentMethod) => {
        methodToDelete.value = method;
        showDeleteConfirm.value = true;
    });

    const getMethodIcon = (type: PaymentMethod) => {
        switch (type) {
            case 'cash':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case 'card':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                );
            case 'bank_transfer':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            case 'online':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                );
            case 'wallet':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                );
        }
    };

    const availableProviders = PAYMENT_PROVIDERS[formState.method_type] || [];

    return (
        <div class="p-6">
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <div class="flex items-center gap-2 text-sm breadcrumbs mb-2">
                        <a href="/vendor/settings/billing" class="link link-hover">Billing Settings</a>
                        <span>/</span>
                        <span>Payment Methods</span>
                    </div>
                    <h1 class="text-2xl font-bold">Payment Methods</h1>
                    <p class="text-base-content/70 mt-1">
                        Configure accepted payment methods for your property
                    </p>
                </div>
                <button class="btn btn-primary" onClick$={() => openModal()}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Add Payment Method
                </button>
            </div>

            {/* Success/Error Messages */}
            {saveAction.value?.success && (
                <div class="alert alert-success mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Payment method saved successfully</span>
                </div>
            )}

            {saveAction.value?.error && (
                <div class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{saveAction.value.error}</span>
                </div>
            )}

            {deleteAction.value?.success && (
                <div class="alert alert-success mb-4">
                    <span>Payment method deleted successfully</span>
                </div>
            )}

            {/* Payment Methods List */}
            {paymentMethods.value.length === 0 ? (
                <div class="card bg-base-100 shadow">
                    <div class="card-body items-center text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <h3 class="text-lg font-semibold">No Payment Methods Configured</h3>
                        <p class="text-base-content/70">
                            Add payment methods to start accepting payments from guests.
                        </p>
                        <button class="btn btn-primary mt-4" onClick$={() => openModal()}>
                            Add Your First Payment Method
                        </button>
                    </div>
                </div>
            ) : (
                <div class="grid gap-4">
                    {paymentMethods.value.map((method) => (
                        <div key={method.id} class="card bg-base-100 shadow">
                            <div class="card-body flex-row items-center gap-4">
                                {/* Icon */}
                                <div class={`p-3 rounded-lg ${method.is_enabled ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/50'}`}>
                                    {getMethodIcon(method.method_type)}
                                </div>

                                {/* Info */}
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <h3 class="font-semibold">{method.display_name}</h3>
                                        {method.is_default && (
                                            <span class="badge badge-primary badge-sm">Default</span>
                                        )}
                                        {!method.is_enabled && (
                                            <span class="badge badge-ghost badge-sm">Disabled</span>
                                        )}
                                    </div>
                                    <p class="text-sm text-base-content/70">
                                        {methodTypes.find((t) => t.value === method.method_type)?.label}
                                        {method.provider && ` - ${method.provider}`}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div class="flex items-center gap-2">
                                    <button
                                        class="btn btn-ghost btn-sm"
                                        onClick$={() => openModal(method)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        class="btn btn-ghost btn-sm text-error"
                                        onClick$={() => confirmDelete(method)}
                                        disabled={method.is_default}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Add Suggestions */}
            {paymentMethods.value.length > 0 && paymentMethods.value.length < 4 && (
                <div class="mt-6">
                    <h3 class="text-sm font-medium text-base-content/70 mb-3">Quick Add</h3>
                    <div class="flex flex-wrap gap-2">
                        {!paymentMethods.value.some((m) => m.method_type === 'cash') && (
                            <button
                                class="btn btn-outline btn-sm"
                                onClick$={() => {
                                    formState.method_type = 'cash';
                                    formState.display_name = 'Cash';
                                    openModal();
                                }}
                            >
                                + Cash
                            </button>
                        )}
                        {!paymentMethods.value.some((m) => m.method_type === 'card') && (
                            <button
                                class="btn btn-outline btn-sm"
                                onClick$={() => {
                                    formState.method_type = 'card';
                                    formState.display_name = 'Credit/Debit Card';
                                    openModal();
                                }}
                            >
                                + Card
                            </button>
                        )}
                        {!paymentMethods.value.some((m) => m.method_type === 'bank_transfer') && (
                            <button
                                class="btn btn-outline btn-sm"
                                onClick$={() => {
                                    formState.method_type = 'bank_transfer';
                                    formState.display_name = 'Bank Transfer';
                                    openModal();
                                }}
                            >
                                + Bank Transfer
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box max-w-lg">
                        <h3 class="font-bold text-lg mb-4">
                            {editingMethod.value ? 'Edit Payment Method' : 'Add Payment Method'}
                        </h3>

                        <Form action={saveAction}>
                            {editingMethod.value && (
                                <input type="hidden" name="id" value={editingMethod.value.id} />
                            )}
                            <input type="hidden" name="credentials" value={JSON.stringify(formState.credentials || {})} />
                            <input type="hidden" name="settings" value={JSON.stringify(formState.settings || {})} />

                            <div class="space-y-4">
                                {/* Method Type */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Payment Type</span>
                                    </label>
                                    <select
                                        name="method_type"
                                        class="select select-bordered"
                                        value={formState.method_type}
                                        onChange$={(e) => {
                                            formState.method_type = (e.target as HTMLSelectElement).value as PaymentMethod;
                                            formState.provider = undefined;
                                            // Set default display name
                                            const type = methodTypes.find((t) => t.value === formState.method_type);
                                            if (!formState.display_name || methodTypes.some((t) => t.label === formState.display_name)) {
                                                formState.display_name = type?.label || '';
                                            }
                                        }}
                                    >
                                        {methodTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Provider (if applicable) */}
                                {availableProviders.length > 0 && (
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Provider</span>
                                        </label>
                                        <select
                                            name="provider"
                                            class="select select-bordered"
                                            value={formState.provider || ''}
                                            onChange$={(e) => {
                                                formState.provider = (e.target as HTMLSelectElement).value || undefined;
                                            }}
                                        >
                                            <option value="">Select a provider</option>
                                            {availableProviders.map((provider) => (
                                                <option key={provider.value} value={provider.value}>
                                                    {provider.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Display Name */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Display Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="display_name"
                                        class="input input-bordered"
                                        placeholder="e.g., Credit Card, Bank Transfer"
                                        value={formState.display_name}
                                        onInput$={(e) => {
                                            formState.display_name = (e.target as HTMLInputElement).value;
                                        }}
                                    />
                                    <label class="label">
                                        <span class="label-text-alt">This is what guests will see</span>
                                    </label>
                                </div>

                                {/* Enabled Toggle */}
                                <div class="form-control">
                                    <label class="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            name="is_enabled_check"
                                            class="toggle toggle-primary"
                                            checked={formState.is_enabled}
                                            onChange$={(e) => {
                                                formState.is_enabled = (e.target as HTMLInputElement).checked;
                                            }}
                                        />
                                        <div>
                                            <span class="label-text font-medium">Enabled</span>
                                            <p class="text-sm text-base-content/70">
                                                Accept payments using this method
                                            </p>
                                        </div>
                                    </label>
                                    <input type="hidden" name="is_enabled" value={String(formState.is_enabled)} />
                                </div>

                                {/* Default Toggle */}
                                <div class="form-control">
                                    <label class="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            name="is_default_check"
                                            class="toggle toggle-primary"
                                            checked={formState.is_default}
                                            onChange$={(e) => {
                                                formState.is_default = (e.target as HTMLInputElement).checked;
                                            }}
                                        />
                                        <div>
                                            <span class="label-text font-medium">Set as Default</span>
                                            <p class="text-sm text-base-content/70">
                                                Pre-select this method for new payments
                                            </p>
                                        </div>
                                    </label>
                                    <input type="hidden" name="is_default" value={String(formState.is_default)} />
                                </div>

                                {/* Provider-specific credentials info */}
                                {formState.provider && (
                                    <div class="alert alert-info">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p class="font-semibold">Provider Configuration</p>
                                            <p class="text-sm">
                                                API credentials for {formState.provider} can be configured after saving.
                                                Contact support for integration assistance.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div class="modal-action">
                                <button
                                    type="button"
                                    class="btn btn-ghost"
                                    onClick$={() => (showModal.value = false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    {editingMethod.value ? 'Save Changes' : 'Add Method'}
                                </button>
                            </div>
                        </Form>
                    </div>
                    <div class="modal-backdrop" onClick$={() => (showModal.value = false)}></div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm.value && methodToDelete.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg">Delete Payment Method</h3>
                        <p class="py-4">
                            Are you sure you want to delete "{methodToDelete.value.display_name}"?
                            This action cannot be undone.
                        </p>
                        <div class="modal-action">
                            <button
                                class="btn btn-ghost"
                                onClick$={() => {
                                    showDeleteConfirm.value = false;
                                    methodToDelete.value = null;
                                }}
                            >
                                Cancel
                            </button>
                            <Form action={deleteAction}>
                                <input type="hidden" name="id" value={methodToDelete.value.id} />
                                <button
                                    type="submit"
                                    class="btn btn-error"
                                    onClick$={() => {
                                        showDeleteConfirm.value = false;
                                        methodToDelete.value = null;
                                    }}
                                >
                                    Delete
                                </button>
                            </Form>
                        </div>
                    </div>
                    <div
                        class="modal-backdrop"
                        onClick$={() => {
                            showDeleteConfirm.value = false;
                            methodToDelete.value = null;
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
});
