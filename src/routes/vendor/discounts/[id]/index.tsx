import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, useNavigate } from '@builder.io/qwik-city';
import { authenticatedRequest, apiClient } from '~/utils/api-client';
import type { DiscountRule, DiscountStatus } from '~/types/discount';
import {
    discountStatusLabels,
    discountStatusColors,
    discountTypeLabels,
    formatDiscountValue,
    hasUsageRemaining,
    isDiscountEditable,
    dayOfWeekLabels,
} from '~/types/discount';

export const useDiscountLoader = routeLoader$(async (requestEvent) => {
    const id = requestEvent.params.id;
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.discounts.get(id, token);
    });
});

// Update status action
export const useUpdateStatus = routeAction$(async (data, requestEvent) => {
    const id = requestEvent.params.id;
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.discounts.update(id, { status: data.status as DiscountStatus }, token);
    });
});

// Delete discount action
export const useDeleteDiscount = routeAction$(async (data, requestEvent) => {
    const id = requestEvent.params.id;
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.discounts.delete(id, token);
    });
});

export default component$(() => {
    const discountData = useDiscountLoader();
    const updateStatusAction = useUpdateStatus();
    const deleteAction = useDeleteDiscount();
    const nav = useNavigate();

    const showPauseModal = useSignal(false);
    const showActivateModal = useSignal(false);
    const showDeleteModal = useSignal(false);
    const isProcessing = useSignal(false);

    const discount = discountData.value.data as DiscountRule | undefined;

    if (!discount) {
        return (
            <div class="p-6">
                <div class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Discount not found</span>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handlePause = $(async () => {
        isProcessing.value = true;
        await updateStatusAction.submit({ status: 'paused' });
        isProcessing.value = false;
        showPauseModal.value = false;
        nav(`/vendor/discounts/${discount.id}`);
    });

    const handleActivate = $(async () => {
        isProcessing.value = true;
        await updateStatusAction.submit({ status: 'active' });
        isProcessing.value = false;
        showActivateModal.value = false;
        nav(`/vendor/discounts/${discount.id}`);
    });

    const handleDelete = $(async () => {
        isProcessing.value = true;
        await deleteAction.submit({});
        isProcessing.value = false;
        showDeleteModal.value = false;
        nav('/vendor/discounts');
    });

    const usagePercentage = discount.usage_limit
        ? Math.round((discount.current_usage / discount.usage_limit) * 100)
        : 0;

    return (
        <div class="p-6">
            {/* Page Header */}
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div class="flex items-start gap-4">
                    <Link href="/vendor/discounts" class="btn btn-ghost btn-sm btn-square mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <div class="flex items-center gap-3">
                            <h1 class="text-2xl font-bold">{discount.name}</h1>
                            <span class={`badge ${discountStatusColors[discount.status]}`}>
                                {discountStatusLabels[discount.status]}
                            </span>
                            {discount.is_automatic && (
                                <span class="badge badge-accent">Automatic</span>
                            )}
                        </div>
                        {discount.code && (
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-base-content/70">Code:</span>
                                <span class="badge badge-outline font-mono text-lg">{discount.code}</span>
                            </div>
                        )}
                        <p class="text-base-content/70 mt-1">
                            Created {formatDateTime(discount.created_at)}
                        </p>
                    </div>
                </div>
                <div class="flex gap-2">
                    {isDiscountEditable(discount.status) && (
                        <Link href={`/vendor/discounts/${discount.id}?edit=true`} class="btn btn-outline btn-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </Link>
                    )}
                    {discount.status === 'active' && (
                        <button class="btn btn-warning btn-sm" onClick$={() => showPauseModal.value = true}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pause
                        </button>
                    )}
                    {discount.status === 'paused' && (
                        <button class="btn btn-success btn-sm" onClick$={() => showActivateModal.value = true}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Activate
                        </button>
                    )}
                    <div class="dropdown dropdown-end">
                        <label tabIndex={0} class="btn btn-ghost btn-sm btn-square">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </label>
                        <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <button>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Duplicate
                                </button>
                            </li>
                            <div class="divider my-1"></div>
                            <li>
                                <button class="text-error" onClick$={() => showDeleteModal.value = true}>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div class="lg:col-span-2 space-y-6">
                    {/* Discount Value Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Discount Value</h2>
                            <div class="flex items-center gap-6">
                                <div class="bg-primary/10 p-6 rounded-xl">
                                    <div class="text-4xl font-bold text-primary">
                                        {formatDiscountValue(discount.discount_type, discount.discount_value, 'USD')}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-lg font-medium">{discountTypeLabels[discount.discount_type]}</div>
                                    {discount.max_discount_amount && (
                                        <div class="text-sm text-base-content/70">
                                            Maximum discount: ${discount.max_discount_amount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Applicability Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Applicability</h2>

                            {(!discount.applies_to?.service_types?.length && !discount.applies_to?.resource_ids?.length) ? (
                                <p class="text-base-content/70">Applies to all services and resources</p>
                            ) : (
                                <div class="space-y-4">
                                    {discount.applies_to?.service_types?.length ? (
                                        <div>
                                            <div class="text-sm text-base-content/70 mb-2">Service Types</div>
                                            <div class="flex flex-wrap gap-2">
                                                {discount.applies_to.service_types.map((type) => (
                                                    <span key={type} class="badge badge-outline capitalize">{type}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {discount.applies_to?.resource_ids?.length ? (
                                        <div>
                                            <div class="text-sm text-base-content/70 mb-2">Specific Resources</div>
                                            <div class="flex flex-wrap gap-2">
                                                {discount.applies_to.resource_ids.map((id) => (
                                                    <span key={id} class="badge badge-outline">{id}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {(discount.min_nights || discount.min_amount || discount.min_guests) && (
                                <>
                                    <div class="divider">Minimum Requirements</div>
                                    <div class="grid grid-cols-3 gap-4">
                                        {discount.min_nights && (
                                            <div>
                                                <div class="text-sm text-base-content/70">Min. Nights</div>
                                                <div class="font-semibold">{discount.min_nights}</div>
                                            </div>
                                        )}
                                        {discount.min_amount && (
                                            <div>
                                                <div class="text-sm text-base-content/70">Min. Amount</div>
                                                <div class="font-semibold">${discount.min_amount}</div>
                                            </div>
                                        )}
                                        {discount.min_guests && (
                                            <div>
                                                <div class="text-sm text-base-content/70">Min. Guests</div>
                                                <div class="font-semibold">{discount.min_guests}</div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Validity Period Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Validity Period</h2>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 class="font-medium mb-2">Booking Window</h3>
                                    {(discount.booking_start_date || discount.booking_end_date) ? (
                                        <div class="text-sm">
                                            {discount.booking_start_date && discount.booking_end_date ? (
                                                <span>{formatDate(discount.booking_start_date)} - {formatDate(discount.booking_end_date)}</span>
                                            ) : discount.booking_start_date ? (
                                                <span>From {formatDate(discount.booking_start_date)}</span>
                                            ) : (
                                                <span>Until {formatDate(discount.booking_end_date!)}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div class="text-sm text-base-content/70">No restriction</div>
                                    )}
                                </div>

                                <div>
                                    <h3 class="font-medium mb-2">Stay Dates</h3>
                                    {(discount.stay_start_date || discount.stay_end_date) ? (
                                        <div class="text-sm">
                                            {discount.stay_start_date && discount.stay_end_date ? (
                                                <span>{formatDate(discount.stay_start_date)} - {formatDate(discount.stay_end_date)}</span>
                                            ) : discount.stay_start_date ? (
                                                <span>From {formatDate(discount.stay_start_date)}</span>
                                            ) : (
                                                <span>Until {formatDate(discount.stay_end_date!)}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div class="text-sm text-base-content/70">No restriction</div>
                                    )}
                                </div>
                            </div>

                            {discount.valid_days_of_week && discount.valid_days_of_week.length > 0 && (
                                <div class="mt-4">
                                    <h3 class="font-medium mb-2">Valid Days of Week</h3>
                                    <div class="flex flex-wrap gap-2">
                                        {discount.valid_days_of_week.map((day) => (
                                            <span key={day} class="badge badge-primary">{dayOfWeekLabels[day]}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description Card */}
                    {discount.description && (
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h2 class="card-title text-lg">Description</h2>
                                <p class="whitespace-pre-wrap">{discount.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div class="space-y-6">
                    {/* Usage Stats Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Usage Statistics</h2>

                            <div class="space-y-4">
                                <div>
                                    <div class="flex justify-between mb-1">
                                        <span class="text-sm text-base-content/70">Total Uses</span>
                                        <span class="font-semibold">{discount.current_usage}</span>
                                    </div>
                                    {discount.usage_limit && (
                                        <>
                                            <progress
                                                class={`progress w-full ${usagePercentage >= 90 ? 'progress-error' : usagePercentage >= 70 ? 'progress-warning' : 'progress-primary'}`}
                                                value={discount.current_usage}
                                                max={discount.usage_limit}
                                            ></progress>
                                            <div class="text-xs text-base-content/50 text-right">
                                                {discount.usage_limit - discount.current_usage} remaining
                                            </div>
                                        </>
                                    )}
                                </div>

                                {discount.usage_limit && (
                                    <div class="flex justify-between">
                                        <span class="text-sm text-base-content/70">Usage Limit</span>
                                        <span>{discount.usage_limit}</span>
                                    </div>
                                )}

                                {discount.usage_per_guest && (
                                    <div class="flex justify-between">
                                        <span class="text-sm text-base-content/70">Per Guest Limit</span>
                                        <span>{discount.usage_per_guest}</span>
                                    </div>
                                )}

                                {!hasUsageRemaining(discount) && (
                                    <div class="alert alert-error py-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span class="text-sm">Usage limit reached</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stacking Rules Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Stacking Rules</h2>

                            <div class="space-y-3">
                                <div class="flex items-center gap-3">
                                    {discount.is_combinable ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                    <span class="text-sm">
                                        {discount.is_combinable ? 'Can be combined' : 'Cannot be combined'} with other discounts
                                    </span>
                                </div>

                                {discount.is_automatic && (
                                    <div class="flex justify-between">
                                        <span class="text-sm text-base-content/70">Priority</span>
                                        <span>{discount.priority}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Information</h2>

                            <div class="space-y-3 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Type</span>
                                    <span>{discount.is_automatic ? 'Automatic' : 'Promo Code'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Created</span>
                                    <span>{formatDate(discount.created_at)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Last Updated</span>
                                    <span>{formatDate(discount.updated_at)}</span>
                                </div>
                                {discount.created_by && (
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Created By</span>
                                        <span>{discount.created_by}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Quick Actions</h2>
                            <div class="space-y-2">
                                <button class="btn btn-outline btn-sm w-full justify-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Duplicate Discount
                                </button>
                                <button class="btn btn-outline btn-sm w-full justify-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    View Usage Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pause Modal */}
            {showPauseModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg">Pause Discount</h3>
                        <p class="py-4">
                            Are you sure you want to pause <strong>{discount.name}</strong>? Customers will not be able to use this discount while paused.
                        </p>
                        <div class="modal-action">
                            <button class="btn btn-ghost" onClick$={() => showPauseModal.value = false}>
                                Cancel
                            </button>
                            <button
                                class="btn btn-warning"
                                onClick$={handlePause}
                                disabled={isProcessing.value}
                            >
                                {isProcessing.value ? <span class="loading loading-spinner loading-sm"></span> : 'Pause'}
                            </button>
                        </div>
                    </div>
                    <div class="modal-backdrop" onClick$={() => showPauseModal.value = false}></div>
                </div>
            )}

            {/* Activate Modal */}
            {showActivateModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg">Activate Discount</h3>
                        <p class="py-4">
                            Are you sure you want to activate <strong>{discount.name}</strong>? Customers will be able to use this discount.
                        </p>
                        <div class="modal-action">
                            <button class="btn btn-ghost" onClick$={() => showActivateModal.value = false}>
                                Cancel
                            </button>
                            <button
                                class="btn btn-success"
                                onClick$={handleActivate}
                                disabled={isProcessing.value}
                            >
                                {isProcessing.value ? <span class="loading loading-spinner loading-sm"></span> : 'Activate'}
                            </button>
                        </div>
                    </div>
                    <div class="modal-backdrop" onClick$={() => showActivateModal.value = false}></div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg text-error">Delete Discount</h3>
                        <p class="py-4">
                            Are you sure you want to delete <strong>{discount.name}</strong>? This action cannot be undone.
                        </p>
                        <div class="modal-action">
                            <button class="btn btn-ghost" onClick$={() => showDeleteModal.value = false}>
                                Cancel
                            </button>
                            <button
                                class="btn btn-error"
                                onClick$={handleDelete}
                                disabled={isProcessing.value}
                            >
                                {isProcessing.value ? <span class="loading loading-spinner loading-sm"></span> : 'Delete'}
                            </button>
                        </div>
                    </div>
                    <div class="modal-backdrop" onClick$={() => showDeleteModal.value = false}></div>
                </div>
            )}
        </div>
    );
});
