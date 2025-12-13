// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type Refund,
    refundStatusLabels,
    refundStatusColors,
    refundReasonLabels,
    refundMethodLabels,
    paymentMethodLabels,
    canApproveRefund,
    canProcessRefund,
} from '~/types/payment';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

export const useRefundLoader = routeLoader$(async (requestEvent) => {
    const refundId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const refund = await apiClient.vendorPortal.refunds.get(refundId, token);
            return {
                success: true,
                refund,
            };
        } catch (error) {
            console.error('Failed to load refund:', error);
            return {
                success: false,
                refund: null,
            };
        }
    });
});

export const useApproveRefund = routeAction$(async (data, requestEvent) => {
    const refundId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const result = await apiClient.vendorPortal.refunds.approve(refundId, token);
            return { success: true, data: result };
        } catch (error) {
            console.error('Failed to approve refund:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to approve refund',
            };
        }
    });
});

export const useRejectRefund = routeAction$(async (data, requestEvent) => {
    const refundId = requestEvent.params.id;
    const reason = data.reason as string;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const result = await apiClient.vendorPortal.refunds.reject(refundId, reason, token);
            return { success: true, data: result };
        } catch (error) {
            console.error('Failed to reject refund:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reject refund',
            };
        }
    });
});

export const useProcessRefund = routeAction$(async (data, requestEvent) => {
    const refundId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const result = await apiClient.vendorPortal.refunds.process(refundId, token);
            return { success: true, data: result };
        } catch (error) {
            console.error('Failed to process refund:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process refund',
            };
        }
    });
});

export default component$(() => {
    const refundData = useRefundLoader();
    const approveAction = useApproveRefund();
    const rejectAction = useRejectRefund();
    const processAction = useProcessRefund();
    const navigate = useNavigate();

    const rejectionReason = useSignal('');

    const refund = refundData.value.refund as Refund | null;

    // Redirect on successful actions
    if (approveAction.value?.success || rejectAction.value?.success || processAction.value?.success) {
        navigate('/vendor/refunds');
    }

    if (!refund) {
        return (
            <div class="flex flex-col items-center justify-center py-12">
                <svg class="size-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 class="text-lg font-medium mb-2">Refund Not Found</h3>
                <p class="text-base-content/60 mb-4">The refund you're looking for doesn't exist or has been removed.</p>
                <Link href="/vendor/refunds" class="btn btn-primary">
                    Back to Refunds
                </Link>
            </div>
        );
    }

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const handleApprove = $(() => {
        showModal('approve-refund-modal');
    });

    const handleReject = $(() => {
        showModal('reject-refund-modal');
    });

    const handleProcess = $(() => {
        showModal('process-refund-modal');
    });

    const confirmApprove = $(async () => {
        await approveAction.submit({});
    });

    const confirmReject = $(async () => {
        await rejectAction.submit({ reason: rejectionReason.value });
    });

    const confirmProcess = $(async () => {
        await processAction.submit({});
    });

    // Status workflow steps
    const statusSteps = [
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'processing', label: 'Processing' },
        { key: 'completed', label: 'Completed' },
    ];

    const currentStepIndex = statusSteps.findIndex(s => s.key === refund.status);
    const isRejected = refund.status === 'rejected';

    return (
        <div>
            <PageHeader
                title={`Refund ${refund.refund_number}`}
                subtitle={`Requested on ${formatDate(refund.created_at)}`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Refunds', href: '/vendor/refunds' },
                    { label: refund.refund_number },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    {canApproveRefund(refund.status) && (
                        <>
                            <button class="btn btn-error btn-sm" onClick$={handleReject}>
                                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                            </button>
                            <button class="btn btn-success btn-sm" onClick$={handleApprove}>
                                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Approve
                            </button>
                        </>
                    )}
                    {canProcessRefund(refund.status) && (
                        <button class="btn btn-primary btn-sm" onClick$={handleProcess}>
                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Process Refund
                        </button>
                    )}
                </div>
            </PageHeader>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div class="lg:col-span-2 space-y-6">
                    {/* Status Progress */}
                    {!isRejected ? (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base mb-4">Refund Progress</h3>
                                <ul class="steps steps-horizontal w-full">
                                    {statusSteps.map((step, index) => (
                                        <li
                                            key={step.key}
                                            class={`step ${index <= currentStepIndex ? 'step-primary' : ''}`}
                                        >
                                            {step.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div class="alert alert-error">
                            <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <div>
                                <h3 class="font-bold">Refund Rejected</h3>
                                <div class="text-sm">
                                    {refund.rejection_reason || 'This refund request has been rejected.'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Refund Details Card */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Refund Details</h3>

                            <div class="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <div class="text-sm text-base-content/60">Refund Number</div>
                                    <div class="font-medium font-mono">{refund.refund_number}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Status</div>
                                    <span class={`badge ${refundStatusColors[refund.status]}`}>
                                        {refundStatusLabels[refund.status]}
                                    </span>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Requested</div>
                                    <div class="font-medium">{formatDateTime(refund.created_at)}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Requested By</div>
                                    <div class="font-medium">{refund.requested_by || 'System'}</div>
                                </div>
                            </div>

                            <div class="divider my-4"></div>

                            {/* Amount Section */}
                            <div class="bg-error/10 rounded-lg p-4">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="text-sm text-base-content/60">Refund Amount</div>
                                        <div class="text-2xl font-bold text-error">
                                            -{formatCurrency(refund.amount, refund.currency)}
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-base-content/60">Refund Method</div>
                                        <div class="font-medium">{refundMethodLabels[refund.refund_method]}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reason Card */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Refund Reason</h3>

                            <div class="mt-4">
                                <span class="badge badge-lg badge-outline">
                                    {refundReasonLabels[refund.reason_type]}
                                </span>
                            </div>

                            {refund.reason_description && (
                                <div class="mt-4 p-4 bg-base-200/50 rounded-lg">
                                    <div class="text-sm text-base-content/60 mb-1">Description</div>
                                    <p class="whitespace-pre-wrap">{refund.reason_description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Original Payment Card */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <div class="flex justify-between items-center">
                                <h3 class="card-title text-base">Original Payment</h3>
                                {refund.payment_id && (
                                    <Link
                                        href={`/vendor/payments/${refund.payment_id}`}
                                        class="btn btn-ghost btn-sm"
                                    >
                                        View Payment
                                    </Link>
                                )}
                            </div>

                            {refund.payment ? (
                                <div class="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <div class="text-sm text-base-content/60">Payment Number</div>
                                        <div class="font-medium font-mono">{refund.payment.payment_number}</div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-base-content/60">Original Amount</div>
                                        <div class="font-medium text-success">
                                            {formatCurrency(refund.payment.amount, refund.payment.currency)}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-base-content/60">Payment Method</div>
                                        <div class="font-medium">
                                            {paymentMethodLabels[refund.payment.payment_method]}
                                            {refund.payment.card_brand && refund.payment.card_last_four && (
                                                <span class="text-base-content/60 text-sm ml-1">
                                                    ({refund.payment.card_brand} ****{refund.payment.card_last_four})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-base-content/60">Payment Date</div>
                                        <div class="font-medium">{formatDate(refund.payment.payment_date)}</div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-base-content/60">Payer</div>
                                        <div class="font-medium">{refund.payment.payer_name}</div>
                                    </div>
                                </div>
                            ) : (
                                <div class="text-center py-4 text-base-content/60">
                                    Payment details not available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recipient Info */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Recipient</h3>

                            <div class="flex items-start gap-4 mt-4">
                                <div class="avatar placeholder">
                                    <div class="bg-error/10 text-error rounded-full w-12">
                                        <span class="text-lg">
                                            {refund.recipient_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium text-lg">{refund.recipient_name}</div>
                                    {refund.guest && (
                                        <Link
                                            href={`/vendor/guests/${refund.guest_id}`}
                                            class="link link-primary text-sm mt-1 inline-block"
                                        >
                                            View Guest Profile
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {refund.notes && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Internal Notes</h3>
                                <p class="text-base-content/80 mt-2 whitespace-pre-wrap">{refund.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div class="space-y-6">
                    {/* Workflow Actions */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Actions</h3>
                            <div class="flex flex-col gap-2 mt-4">
                                {canApproveRefund(refund.status) && (
                                    <>
                                        <button class="btn btn-success btn-sm justify-start" onClick$={handleApprove}>
                                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                            Approve Refund
                                        </button>
                                        <button class="btn btn-error btn-sm justify-start" onClick$={handleReject}>
                                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Reject Refund
                                        </button>
                                    </>
                                )}
                                {canProcessRefund(refund.status) && (
                                    <button class="btn btn-primary btn-sm justify-start" onClick$={handleProcess}>
                                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Process Refund
                                    </button>
                                )}
                                {refund.status === 'completed' && (
                                    <div class="text-sm text-base-content/60 text-center py-2">
                                        This refund has been completed
                                    </div>
                                )}
                                {refund.status === 'rejected' && (
                                    <div class="text-sm text-error text-center py-2">
                                        This refund was rejected
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Related Documents */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Related Documents</h3>
                            <div class="flex flex-col gap-2 mt-4">
                                {refund.payment_id && (
                                    <Link
                                        href={`/vendor/payments/${refund.payment_id}`}
                                        class="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition-colors"
                                    >
                                        <svg class="size-5 text-success" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                        </svg>
                                        <div>
                                            <div class="font-medium text-sm">Original Payment</div>
                                            <div class="text-xs text-base-content/60">
                                                {refund.payment?.payment_number || 'View Payment'}
                                            </div>
                                        </div>
                                    </Link>
                                )}
                                {refund.invoice_id && (
                                    <Link
                                        href={`/vendor/invoices/${refund.invoice_id}`}
                                        class="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition-colors"
                                    >
                                        <svg class="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                        <div>
                                            <div class="font-medium text-sm">Invoice</div>
                                            <div class="text-xs text-base-content/60">View Invoice</div>
                                        </div>
                                    </Link>
                                )}
                                {refund.booking_id && (
                                    <Link
                                        href={`/vendor/bookings/${refund.booking_id}`}
                                        class="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition-colors"
                                    >
                                        <svg class="size-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                        </svg>
                                        <div>
                                            <div class="font-medium text-sm">Booking</div>
                                            <div class="text-xs text-base-content/60">View Booking</div>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Activity</h3>
                            <ul class="timeline timeline-vertical timeline-compact mt-4">
                                <li>
                                    <div class="timeline-start text-xs text-base-content/60">
                                        {formatDateTime(refund.created_at)}
                                    </div>
                                    <div class="timeline-middle">
                                        <svg class="size-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div class="timeline-end timeline-box text-sm">
                                        Refund requested
                                        {refund.requested_by && (
                                            <span class="text-base-content/60"> by {refund.requested_by}</span>
                                        )}
                                    </div>
                                    <hr />
                                </li>
                                {refund.approved_at && (
                                    <li>
                                        <hr />
                                        <div class="timeline-start text-xs text-base-content/60">
                                            {formatDateTime(refund.approved_at)}
                                        </div>
                                        <div class="timeline-middle">
                                            <svg class="size-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box text-sm">
                                            Refund approved
                                            {refund.approved_by && (
                                                <span class="text-base-content/60"> by {refund.approved_by}</span>
                                            )}
                                        </div>
                                        <hr />
                                    </li>
                                )}
                                {refund.status === 'rejected' && (
                                    <li>
                                        <hr />
                                        <div class="timeline-start text-xs text-base-content/60">
                                            {formatDateTime(refund.updated_at)}
                                        </div>
                                        <div class="timeline-middle">
                                            <svg class="size-4 text-error" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box text-sm text-error">
                                            Refund rejected
                                        </div>
                                    </li>
                                )}
                                {refund.processed_at && (
                                    <li>
                                        <hr />
                                        <div class="timeline-start text-xs text-base-content/60">
                                            {formatDateTime(refund.processed_at)}
                                        </div>
                                        <div class="timeline-middle">
                                            <svg class="size-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box text-sm">
                                            Refund processed
                                            {refund.processed_by && (
                                                <span class="text-base-content/60"> by {refund.processed_by}</span>
                                            )}
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Approval Info (if approved) */}
                    {refund.approved_at && (
                        <div class="card bg-success/10 border border-success/20">
                            <div class="card-body">
                                <h3 class="card-title text-base text-success">Approved</h3>
                                <div class="text-sm">
                                    <div>By: {refund.approved_by || 'System'}</div>
                                    <div>On: {formatDateTime(refund.approved_at)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rejection Info (if rejected) */}
                    {refund.status === 'rejected' && refund.rejection_reason && (
                        <div class="card bg-error/10 border border-error/20">
                            <div class="card-body">
                                <h3 class="card-title text-base text-error">Rejection Reason</h3>
                                <p class="text-sm">{refund.rejection_reason}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Approve Modal */}
            <ConfirmModal
                id="approve-refund-modal"
                title="Approve Refund"
                message={`Are you sure you want to approve this refund of ${formatCurrency(refund.amount, refund.currency)}? This will allow the refund to be processed.`}
                confirmText="Approve"
                onConfirm$={confirmApprove}
            />

            {/* Reject Modal */}
            <dialog id="reject-refund-modal" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg">Reject Refund</h3>
                    <p class="py-4 text-base-content/70">
                        Please provide a reason for rejecting this refund request.
                    </p>
                    <div class="form-control">
                        <textarea
                            class="textarea textarea-bordered h-24"
                            placeholder="Reason for rejection..."
                            value={rejectionReason.value}
                            onInput$={(e) => rejectionReason.value = (e.target as HTMLTextAreaElement).value}
                        ></textarea>
                    </div>
                    <div class="modal-action">
                        <form method="dialog">
                            <button class="btn btn-ghost">Cancel</button>
                        </form>
                        <button
                            class="btn btn-error"
                            onClick$={confirmReject}
                            disabled={!rejectionReason.value.trim()}
                        >
                            Reject Refund
                        </button>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            {/* Process Modal */}
            <ConfirmModal
                id="process-refund-modal"
                title="Process Refund"
                message={`Process this refund of ${formatCurrency(refund.amount, refund.currency)} via ${refundMethodLabels[refund.refund_method]}? This action will initiate the actual refund to the customer.`}
                confirmText="Process Refund"
                onConfirm$={confirmProcess}
            />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Refund Details | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "View and manage refund request details",
        },
    ],
};
