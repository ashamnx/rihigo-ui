import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { Quotation } from '~/types/quotation';
import {
    quotationStatusLabels,
    quotationStatusColors,
    itemTypeLabels,
    itemUnitLabels,
    isQuotationEditable,
    canSendQuotation,
    canConvertQuotation,
} from '~/types/quotation';

export const useQuotationLoader = routeLoader$(async (requestEvent) => {
    const id = requestEvent.params.id;
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.quotations.get(id, token);
    });
});

// Send quotation action
export const useSendQuotation = routeAction$(async (data, requestEvent) => {
    const id = requestEvent.params.id;
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.quotations.send(id, token);
    });
});

// Convert to booking action
export const useConvertQuotation = routeAction$(async (data, requestEvent) => {
    const id = requestEvent.params.id;
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.quotations.convert(id, token);
    });
});

// Delete quotation action
export const useDeleteQuotation = routeAction$(async (data, requestEvent) => {
    const id = requestEvent.params.id;
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.quotations.delete(id, token);
    });
});

export default component$(() => {
    const quotationData = useQuotationLoader();
    const sendAction = useSendQuotation();
    const convertAction = useConvertQuotation();
    const deleteAction = useDeleteQuotation();
    const nav = useNavigate();

    const showSendModal = useSignal(false);
    const showConvertModal = useSignal(false);
    const showDeleteModal = useSignal(false);
    const isProcessing = useSignal(false);

    const quotation = quotationData.value.data as Quotation | undefined;

    if (!quotation) {
        return (
            <div class="p-6">
                <div class="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Quotation not found</span>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

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

    const isExpired = (validUntil: string) => {
        return new Date(validUntil) < new Date();
    };

    const handleSend = $(async () => {
        isProcessing.value = true;
        await sendAction.submit({});
        isProcessing.value = false;
        showSendModal.value = false;
        // Refresh the page
        nav(`/vendor/quotations/${quotation.id}`);
    });

    const handleConvert = $(async () => {
        isProcessing.value = true;
        const result = await convertAction.submit({});
        isProcessing.value = false;
        showConvertModal.value = false;
        if (result.value.success && result.value.data?.booking_id) {
            nav(`/vendor/bookings/${result.value.data.booking_id}`);
        }
    });

    const handleDelete = $(async () => {
        isProcessing.value = true;
        await deleteAction.submit({});
        isProcessing.value = false;
        showDeleteModal.value = false;
        nav('/vendor/quotations');
    });

    // Status progress steps
    const statusSteps = ['draft', 'sent', 'viewed', 'accepted', 'converted'];
    const currentStepIndex = statusSteps.indexOf(quotation.status);

    return (
        <div class="p-6">
            {/* Page Header */}
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div class="flex items-start gap-4">
                    <Link href="/vendor/quotations" class="btn btn-ghost btn-sm btn-square mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <div class="flex items-center gap-3">
                            <h1 class="text-2xl font-bold">{quotation.quotation_number}</h1>
                            <span class={`badge ${quotationStatusColors[quotation.status]}`}>
                                {quotationStatusLabels[quotation.status]}
                            </span>
                        </div>
                        <p class="text-base-content/70">
                            Created {formatDateTime(quotation.created_at)}
                            {quotation.created_by && ` by ${quotation.created_by}`}
                        </p>
                    </div>
                </div>
                <div class="flex gap-2">
                    {isQuotationEditable(quotation.status) && (
                        <Link href={`/vendor/quotations/${quotation.id}?edit=true`} class="btn btn-outline btn-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </Link>
                    )}
                    {canSendQuotation(quotation.status) && (
                        <button class="btn btn-primary btn-sm" onClick$={() => showSendModal.value = true}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send
                        </button>
                    )}
                    {canConvertQuotation(quotation.status) && (
                        <button class="btn btn-success btn-sm" onClick$={() => showConvertModal.value = true}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Convert to Booking
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
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download PDF
                                </button>
                            </li>
                            <li>
                                <button>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                </button>
                            </li>
                            <li>
                                <button>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Duplicate
                                </button>
                            </li>
                            {isQuotationEditable(quotation.status) && (
                                <>
                                    <div class="divider my-1"></div>
                                    <li>
                                        <button class="text-error" onClick$={() => showDeleteModal.value = true}>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Status Progress */}
            {quotation.status !== 'rejected' && quotation.status !== 'expired' && (
                <div class="card bg-base-100 shadow mb-6">
                    <div class="card-body py-4">
                        <ul class="steps steps-horizontal w-full">
                            {statusSteps.map((step, index) => (
                                <li
                                    key={step}
                                    class={`step ${index <= currentStepIndex ? 'step-primary' : ''}`}
                                    data-content={index < currentStepIndex ? '✓' : index === currentStepIndex ? '●' : ''}
                                >
                                    <span class="text-xs capitalize">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Expiry Warning */}
            {isExpired(quotation.valid_until) && quotation.status !== 'expired' && quotation.status !== 'converted' && (
                <div class="alert alert-warning mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>This quotation has expired. The validity date was {formatDate(quotation.valid_until)}.</span>
                </div>
            )}

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div class="lg:col-span-2 space-y-6">
                    {/* Customer Info Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Customer Information</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div class="text-sm text-base-content/70">Name</div>
                                    <div class="font-medium">{quotation.customer_name}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/70">Email</div>
                                    <div class="font-medium">{quotation.customer_email}</div>
                                </div>
                                {quotation.customer_phone && (
                                    <div>
                                        <div class="text-sm text-base-content/70">Phone</div>
                                        <div class="font-medium">{quotation.customer_phone}</div>
                                    </div>
                                )}
                                {quotation.customer_company && (
                                    <div>
                                        <div class="text-sm text-base-content/70">Company</div>
                                        <div class="font-medium">{quotation.customer_company}</div>
                                    </div>
                                )}
                            </div>
                            {quotation.guest_id && quotation.guest && (
                                <div class="mt-4">
                                    <Link href={`/vendor/guests/${quotation.guest_id}`} class="btn btn-ghost btn-sm">
                                        View Guest Profile
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Service Details Card */}
                    {(quotation.service_type || quotation.start_date || quotation.resource) && (
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h2 class="card-title text-lg">Service Details</h2>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quotation.service_type && (
                                        <div>
                                            <div class="text-sm text-base-content/70">Service Type</div>
                                            <div class="font-medium capitalize">{quotation.service_type}</div>
                                        </div>
                                    )}
                                    {quotation.resource && (
                                        <div>
                                            <div class="text-sm text-base-content/70">Resource</div>
                                            <div class="font-medium">{quotation.resource.name}</div>
                                        </div>
                                    )}
                                    {quotation.start_date && (
                                        <div>
                                            <div class="text-sm text-base-content/70">Start Date</div>
                                            <div class="font-medium">{formatDate(quotation.start_date)}</div>
                                        </div>
                                    )}
                                    {quotation.end_date && (
                                        <div>
                                            <div class="text-sm text-base-content/70">End Date</div>
                                            <div class="font-medium">{formatDate(quotation.end_date)}</div>
                                        </div>
                                    )}
                                    {(quotation.adults || quotation.children || quotation.infants) && (
                                        <div>
                                            <div class="text-sm text-base-content/70">Guests</div>
                                            <div class="font-medium">
                                                {quotation.adults} Adults
                                                {quotation.children ? `, ${quotation.children} Children` : ''}
                                                {quotation.infants ? `, ${quotation.infants} Infants` : ''}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Line Items Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Line Items</h2>
                            <div class="overflow-x-auto">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th class="text-center">Qty</th>
                                            <th class="text-right">Unit Price</th>
                                            <th class="text-right">Discount</th>
                                            <th class="text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotation.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div class="font-medium">{item.description}</div>
                                                    <div class="text-xs text-base-content/50">
                                                        {itemTypeLabels[item.item_type]} • {itemUnitLabels[item.unit]}
                                                    </div>
                                                </td>
                                                <td class="text-center">{item.quantity}</td>
                                                <td class="text-right">{formatCurrency(item.unit_price, quotation.currency)}</td>
                                                <td class="text-right text-error">
                                                    {item.discount_percent ? `-${item.discount_percent}%` : item.discount_amount ? `-${formatCurrency(item.discount_amount, quotation.currency)}` : '-'}
                                                </td>
                                                <td class="text-right font-medium">
                                                    {formatCurrency(item.line_total, quotation.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={4} class="text-right">Subtotal</td>
                                            <td class="text-right">{formatCurrency(quotation.subtotal, quotation.currency)}</td>
                                        </tr>
                                        {quotation.discount_amount > 0 && (
                                            <tr>
                                                <td colSpan={4} class="text-right text-error">Discounts</td>
                                                <td class="text-right text-error">-{formatCurrency(quotation.discount_amount, quotation.currency)}</td>
                                            </tr>
                                        )}
                                        {quotation.tax_amount > 0 && (
                                            <tr>
                                                <td colSpan={4} class="text-right">Tax</td>
                                                <td class="text-right">{formatCurrency(quotation.tax_amount, quotation.currency)}</td>
                                            </tr>
                                        )}
                                        <tr class="font-bold text-lg">
                                            <td colSpan={4} class="text-right">Total</td>
                                            <td class="text-right">{formatCurrency(quotation.total, quotation.currency)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    {(quotation.notes || quotation.terms_and_conditions) && (
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h2 class="card-title text-lg">Notes & Terms</h2>
                                {quotation.notes && (
                                    <div class="mb-4">
                                        <div class="text-sm text-base-content/70 mb-1">Notes</div>
                                        <p class="whitespace-pre-wrap">{quotation.notes}</p>
                                    </div>
                                )}
                                {quotation.terms_and_conditions && (
                                    <div>
                                        <div class="text-sm text-base-content/70 mb-1">Terms & Conditions</div>
                                        <p class="whitespace-pre-wrap text-sm">{quotation.terms_and_conditions}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Internal Notes Card */}
                    {quotation.internal_notes && (
                        <div class="card bg-warning/10 border border-warning">
                            <div class="card-body">
                                <h2 class="card-title text-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Internal Notes
                                </h2>
                                <p class="whitespace-pre-wrap text-sm">{quotation.internal_notes}</p>
                                <p class="text-xs text-base-content/50 mt-2">This note is not visible to the customer</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div class="space-y-6">
                    {/* Summary Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Summary</h2>
                            <div class="space-y-3">
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Issue Date</span>
                                    <span>{formatDate(quotation.issue_date)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Valid Until</span>
                                    <span class={isExpired(quotation.valid_until) ? 'text-error' : ''}>
                                        {formatDate(quotation.valid_until)}
                                    </span>
                                </div>
                                <div class="divider my-2"></div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/70">Subtotal</span>
                                    <span>{formatCurrency(quotation.subtotal, quotation.currency)}</span>
                                </div>
                                {quotation.discount_amount > 0 && (
                                    <div class="flex justify-between text-error">
                                        <span>Discounts</span>
                                        <span>-{formatCurrency(quotation.discount_amount, quotation.currency)}</span>
                                    </div>
                                )}
                                {quotation.tax_amount > 0 && (
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Tax</span>
                                        <span>{formatCurrency(quotation.tax_amount, quotation.currency)}</span>
                                    </div>
                                )}
                                <div class="divider my-2"></div>
                                <div class="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>{formatCurrency(quotation.total, quotation.currency)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Activity</h2>
                            <ul class="timeline timeline-vertical timeline-compact">
                                <li>
                                    <div class="timeline-start text-xs text-base-content/50">
                                        {formatDateTime(quotation.created_at)}
                                    </div>
                                    <div class="timeline-middle">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <div class="timeline-end timeline-box">Created</div>
                                    <hr />
                                </li>
                                {quotation.sent_at && (
                                    <li>
                                        <hr />
                                        <div class="timeline-start text-xs text-base-content/50">
                                            {formatDateTime(quotation.sent_at)}
                                        </div>
                                        <div class="timeline-middle">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box">Sent to customer</div>
                                        <hr />
                                    </li>
                                )}
                                {quotation.viewed_at && (
                                    <li>
                                        <hr />
                                        <div class="timeline-start text-xs text-base-content/50">
                                            {formatDateTime(quotation.viewed_at)}
                                        </div>
                                        <div class="timeline-middle">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box">Viewed by customer</div>
                                        <hr />
                                    </li>
                                )}
                                {quotation.responded_at && (
                                    <li>
                                        <hr />
                                        <div class="timeline-start text-xs text-base-content/50">
                                            {formatDateTime(quotation.responded_at)}
                                        </div>
                                        <div class="timeline-middle">
                                            <svg xmlns="http://www.w3.org/2000/svg" class={`h-4 w-4 ${quotation.status === 'accepted' ? 'text-success' : 'text-error'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {quotation.status === 'accepted' ? (
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                ) : (
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                )}
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box">
                                            {quotation.status === 'accepted' ? 'Accepted' : 'Rejected'} by customer
                                        </div>
                                        <hr />
                                    </li>
                                )}
                                {quotation.converted_to_booking_id && (
                                    <li>
                                        <hr />
                                        <div class="timeline-middle">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box">
                                            <Link href={`/vendor/bookings/${quotation.converted_to_booking_id}`} class="link link-primary">
                                                Converted to booking
                                            </Link>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title text-lg">Quick Actions</h2>
                            <div class="space-y-2">
                                <button class="btn btn-outline btn-sm w-full justify-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download PDF
                                </button>
                                <button class="btn btn-outline btn-sm w-full justify-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Duplicate Quotation
                                </button>
                                <button class="btn btn-outline btn-sm w-full justify-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Create Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Modal */}
            {showSendModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg">Send Quotation</h3>
                        <p class="py-4">
                            Are you sure you want to send this quotation to <strong>{quotation.customer_email}</strong>?
                        </p>
                        <div class="modal-action">
                            <button class="btn btn-ghost" onClick$={() => showSendModal.value = false}>
                                Cancel
                            </button>
                            <button
                                class="btn btn-primary"
                                onClick$={handleSend}
                                disabled={isProcessing.value}
                            >
                                {isProcessing.value ? <span class="loading loading-spinner loading-sm"></span> : 'Send'}
                            </button>
                        </div>
                    </div>
                    <div class="modal-backdrop" onClick$={() => showSendModal.value = false}></div>
                </div>
            )}

            {/* Convert Modal */}
            {showConvertModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg">Convert to Booking</h3>
                        <p class="py-4">
                            This will create a new booking based on this quotation. The quotation status will be changed to "Converted".
                        </p>
                        <div class="modal-action">
                            <button class="btn btn-ghost" onClick$={() => showConvertModal.value = false}>
                                Cancel
                            </button>
                            <button
                                class="btn btn-success"
                                onClick$={handleConvert}
                                disabled={isProcessing.value}
                            >
                                {isProcessing.value ? <span class="loading loading-spinner loading-sm"></span> : 'Convert'}
                            </button>
                        </div>
                    </div>
                    <div class="modal-backdrop" onClick$={() => showConvertModal.value = false}></div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg text-error">Delete Quotation</h3>
                        <p class="py-4">
                            Are you sure you want to delete quotation <strong>{quotation.quotation_number}</strong>? This action cannot be undone.
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

export const head: DocumentHead = {
    title: "Quotation Details | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "View and manage quotation details",
        },
    ],
};
