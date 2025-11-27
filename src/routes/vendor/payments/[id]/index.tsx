// @ts-nocheck
import { component$, $ } from '@builder.io/qwik';
import { routeLoader$, Link, useNavigate } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import {
    type Payment,
    paymentMethodLabels,
    paymentStatusLabels,
    paymentStatusColors,
} from '~/types/payment';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

export const usePaymentLoader = routeLoader$(async (requestEvent) => {
    const paymentId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const payment = await apiClient.vendorPortal.payments?.get(paymentId, token);
            return {
                success: true,
                payment,
            };
        } catch (error) {
            console.error('Failed to load payment:', error);
            return {
                success: false,
                payment: null,
            };
        }
    });
});

export default component$(() => {
    const paymentData = usePaymentLoader();
    const navigate = useNavigate();

    const payment = paymentData.value?.payment as Payment | null;

    if (!payment) {
        return (
            <div class="flex flex-col items-center justify-center py-12">
                <svg class="size-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 class="text-lg font-medium mb-2">Payment Not Found</h3>
                <p class="text-base-content/60 mb-4">The payment you're looking for doesn't exist or has been removed.</p>
                <Link href="/vendor/payments" class="btn btn-primary">
                    Back to Payments
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

    const handleIssueRefund = $(() => {
        navigate(`/vendor/refunds/new?payment_id=${payment.id}`);
    });

    const handleDownloadReceipt = $(() => {
        window.open(`/api/vendor/payments/${payment.id}/receipt`, '_blank');
    });

    const handlePrintReceipt = $(() => {
        window.print();
    });

    // Calculate refunded amount if any
    const refundedAmount = payment.status === 'refunded' ? payment.amount :
        payment.status === 'partially_refunded' ? (payment.amount * 0.5) : 0; // Placeholder calculation

    return (
        <div>
            <PageHeader
                title={`Payment ${payment.payment_number}`}
                subtitle={`Recorded on ${formatDate(payment.payment_date)}`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Payments', href: '/vendor/payments' },
                    { label: payment.payment_number },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    <button class="btn btn-ghost btn-sm" onClick$={handleDownloadReceipt}>
                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Receipt
                    </button>
                    {payment.status === 'completed' && (
                        <button class="btn btn-warning btn-sm" onClick$={handleIssueRefund}>
                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            Issue Refund
                        </button>
                    )}
                </div>
            </PageHeader>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div class="lg:col-span-2 space-y-6">
                    {/* Payment Status Banner */}
                    <div class={`alert ${
                        payment.status === 'completed' ? 'alert-success' :
                        payment.status === 'pending' ? 'alert-warning' :
                        payment.status === 'failed' ? 'alert-error' :
                        payment.status === 'refunded' ? 'alert-info' :
                        'alert-info'
                    }`}>
                        <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            {payment.status === 'completed' ? (
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : payment.status === 'pending' ? (
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : payment.status === 'failed' ? (
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            ) : (
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            )}
                        </svg>
                        <div>
                            <h3 class="font-bold">{paymentStatusLabels[payment.status]}</h3>
                            <div class="text-sm">
                                {payment.status === 'completed' && 'This payment has been successfully processed.'}
                                {payment.status === 'pending' && 'This payment is awaiting confirmation.'}
                                {payment.status === 'failed' && 'This payment could not be processed.'}
                                {payment.status === 'refunded' && 'This payment has been fully refunded.'}
                                {payment.status === 'partially_refunded' && 'This payment has been partially refunded.'}
                            </div>
                        </div>
                    </div>

                    {/* Payment Details Card */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Payment Details</h3>

                            <div class="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <div class="text-sm text-base-content/60">Payment Number</div>
                                    <div class="font-medium font-mono">{payment.payment_number}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Status</div>
                                    <span class={`badge ${paymentStatusColors[payment.status]}`}>
                                        {paymentStatusLabels[payment.status]}
                                    </span>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Payment Date</div>
                                    <div class="font-medium">{formatDate(payment.payment_date)}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Recorded At</div>
                                    <div class="font-medium">{formatDateTime(payment.created_at)}</div>
                                </div>
                            </div>

                            <div class="divider my-4"></div>

                            {/* Amount Section */}
                            <div class="bg-base-200/50 rounded-lg p-4">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <div class="text-sm text-base-content/60">Amount Received</div>
                                        <div class="text-2xl font-bold text-success">
                                            {formatCurrency(payment.amount, payment.currency)}
                                        </div>
                                    </div>
                                    {(payment.status === 'refunded' || payment.status === 'partially_refunded') && (
                                        <div class="text-right">
                                            <div class="text-sm text-base-content/60">Refunded</div>
                                            <div class="text-lg font-bold text-error">
                                                -{formatCurrency(refundedAmount, payment.currency)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {payment.exchange_rate && payment.exchange_rate !== 1 && (
                                    <div class="text-sm text-base-content/60 mt-2">
                                        Exchange rate: {payment.exchange_rate} (Base: {formatCurrency(payment.amount_in_base_currency || payment.amount)})
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Card */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Payment Method</h3>

                            <div class="flex items-center gap-4 mt-4">
                                <div class={`p-3 rounded-lg ${
                                    payment.payment_method === 'cash' ? 'bg-success/10 text-success' :
                                    payment.payment_method === 'card' ? 'bg-primary/10 text-primary' :
                                    payment.payment_method === 'bank_transfer' ? 'bg-info/10 text-info' :
                                    payment.payment_method === 'online' ? 'bg-secondary/10 text-secondary' :
                                    'bg-base-200'
                                }`}>
                                    {payment.payment_method === 'cash' && (
                                        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                        </svg>
                                    )}
                                    {payment.payment_method === 'card' && (
                                        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                        </svg>
                                    )}
                                    {payment.payment_method === 'bank_transfer' && (
                                        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                                        </svg>
                                    )}
                                    {(payment.payment_method === 'online' || payment.payment_method === 'wallet') && (
                                        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                        </svg>
                                    )}
                                    {payment.payment_method === 'other' && (
                                        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                        </svg>
                                    )}
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium text-lg">{paymentMethodLabels[payment.payment_method]}</div>
                                    {payment.payment_provider && (
                                        <div class="text-sm text-base-content/60">Provider: {payment.payment_provider}</div>
                                    )}
                                    {payment.card_brand && payment.card_last_four && (
                                        <div class="text-sm text-base-content/60">
                                            {payment.card_brand} ending in {payment.card_last_four}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {payment.transaction_id && (
                                <div class="mt-4 p-3 bg-base-200/50 rounded-lg">
                                    <div class="text-sm text-base-content/60">Transaction ID</div>
                                    <div class="font-mono text-sm">{payment.transaction_id}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payer Information */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Payer Information</h3>

                            <div class="flex items-start gap-4 mt-4">
                                <div class="avatar placeholder">
                                    <div class="bg-primary/10 text-primary rounded-full w-12">
                                        <span class="text-lg">
                                            {payment.payer_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium text-lg">{payment.payer_name}</div>
                                    {payment.payer_email && (
                                        <div class="text-sm text-base-content/60">{payment.payer_email}</div>
                                    )}
                                    {payment.guest && (
                                        <Link
                                            href={`/vendor/guests/${payment.guest_id}`}
                                            class="link link-primary text-sm mt-1 inline-block"
                                        >
                                            View Guest Profile
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Allocations */}
                    {payment.allocations && payment.allocations.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Payment Allocations</h3>

                                <div class="overflow-x-auto mt-4">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Invoice</th>
                                                <th>Amount</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payment.allocations.map((allocation) => (
                                                <tr key={allocation.id}>
                                                    <td>
                                                        <Link
                                                            href={`/vendor/invoices/${allocation.invoice_id}`}
                                                            class="link link-primary"
                                                        >
                                                            {allocation.invoice?.invoice_number || allocation.invoice_id}
                                                        </Link>
                                                    </td>
                                                    <td class="font-medium">
                                                        {formatCurrency(allocation.amount, payment.currency)}
                                                    </td>
                                                    <td class="text-base-content/60">
                                                        {formatDateTime(allocation.allocated_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {payment.notes && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Notes</h3>
                                <p class="text-base-content/80 mt-2 whitespace-pre-wrap">{payment.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div class="space-y-6">
                    {/* Quick Actions */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Actions</h3>
                            <div class="flex flex-col gap-2 mt-4">
                                <button class="btn btn-outline btn-sm justify-start" onClick$={handlePrintReceipt}>
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                                    </svg>
                                    Print Receipt
                                </button>
                                <button class="btn btn-outline btn-sm justify-start" onClick$={handleDownloadReceipt}>
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    Download PDF
                                </button>
                                {payment.status === 'completed' && (
                                    <button class="btn btn-warning btn-sm justify-start" onClick$={handleIssueRefund}>
                                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                        </svg>
                                        Issue Refund
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Related Documents */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Related Documents</h3>
                            <div class="flex flex-col gap-2 mt-4">
                                {payment.invoice_id && (
                                    <Link
                                        href={`/vendor/invoices/${payment.invoice_id}`}
                                        class="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition-colors"
                                    >
                                        <svg class="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                        <div>
                                            <div class="font-medium text-sm">Invoice</div>
                                            <div class="text-xs text-base-content/60">
                                                {payment.invoice?.invoice_number || 'View Invoice'}
                                            </div>
                                        </div>
                                    </Link>
                                )}
                                {payment.booking_id && (
                                    <Link
                                        href={`/vendor/bookings/${payment.booking_id}`}
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
                                {!payment.invoice_id && !payment.booking_id && (
                                    <div class="text-sm text-base-content/60 text-center py-4">
                                        No linked documents
                                    </div>
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
                                        {formatDateTime(payment.created_at)}
                                    </div>
                                    <div class="timeline-middle">
                                        <svg class="size-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div class="timeline-end timeline-box text-sm">
                                        Payment recorded
                                    </div>
                                    <hr />
                                </li>
                                {payment.status === 'completed' && payment.created_at !== payment.updated_at && (
                                    <li>
                                        <hr />
                                        <div class="timeline-start text-xs text-base-content/60">
                                            {formatDateTime(payment.updated_at)}
                                        </div>
                                        <div class="timeline-middle">
                                            <svg class="size-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box text-sm">
                                            Payment confirmed
                                        </div>
                                    </li>
                                )}
                                {(payment.status === 'refunded' || payment.status === 'partially_refunded') && (
                                    <li>
                                        <hr />
                                        <div class="timeline-start text-xs text-base-content/60">
                                            {formatDateTime(payment.updated_at)}
                                        </div>
                                        <div class="timeline-middle">
                                            <svg class="size-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                                            </svg>
                                        </div>
                                        <div class="timeline-end timeline-box text-sm">
                                            {payment.status === 'refunded' ? 'Fully refunded' : 'Partially refunded'}
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
