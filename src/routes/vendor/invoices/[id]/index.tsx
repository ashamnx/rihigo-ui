// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, useNavigate } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { StatusBadge } from '~/components/vendor/shared/StatusBadge';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type Invoice,
    invoiceStatusLabels,
    invoiceStatusColors,
    canSendInvoice,
    canVoidInvoice,
    canRecordPayment,
    isInvoiceOverdue,
    isInvoiceEditable,
} from '~/types/invoice';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

export const useInvoiceLoader = routeLoader$(async (requestEvent) => {
    const invoiceId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const invoice = await apiClient.vendorPortal.invoices.get(invoiceId, token);
            return { success: true, data: invoice as Invoice };
        } catch (error) {
            console.error('Failed to load invoice:', error);
            return { success: false, error: 'Invoice not found' };
        }
    });
});

export const useSendInvoice = routeAction$(async (_, requestEvent) => {
    const invoiceId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            await apiClient.vendorPortal.invoices.send(invoiceId, token);
            return { success: true };
        } catch (error) {
            console.error('Failed to send invoice:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send invoice',
            };
        }
    });
});

export const useVoidInvoice = routeAction$(async (data, requestEvent) => {
    const invoiceId = requestEvent.params.id;
    const reason = data.reason as string;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            await apiClient.vendorPortal.invoices.void(invoiceId, { reason }, token);
            return { success: true };
        } catch (error) {
            console.error('Failed to void invoice:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to void invoice',
            };
        }
    });
});

export default component$(() => {
    const invoiceData = useInvoiceLoader();
    const sendAction = useSendInvoice();
    const voidAction = useVoidInvoice();
    const navigate = useNavigate();

    const voidReason = useSignal('');

    // Handle successful actions
    if (sendAction.value?.success || voidAction.value?.success) {
        navigate(`/vendor/invoices/${invoiceData.value.data?.id}`, { forceReload: true });
    }

    if (!invoiceData.value.success || !invoiceData.value.data) {
        return (
            <div class="alert alert-error">
                <span>Invoice not found</span>
            </div>
        );
    }

    const invoice = invoiceData.value.data;
    const overdue = isInvoiceOverdue(invoice.due_date, invoice.status);

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

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const handleSend = $(async () => {
        await sendAction.submit({});
    });

    const handleVoid = $(async () => {
        const formData = new FormData();
        formData.append('reason', voidReason.value);
        await voidAction.submit(formData);
    });

    return (
        <div>
            <PageHeader
                title={`Invoice ${invoice.invoice_number}`}
                subtitle={invoice.billing_name}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Invoices', href: '/vendor/invoices' },
                    { label: invoice.invoice_number },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        onClick$={() => window.open(`/api/vendor/invoices/${invoice.id}/pdf`, '_blank')}
                    >
                        <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download PDF
                    </button>
                    {isInvoiceEditable(invoice.status) && (
                        <Link href={`/vendor/invoices/${invoice.id}?edit=true`} class="btn btn-ghost btn-sm">
                            Edit
                        </Link>
                    )}
                    {canSendInvoice(invoice.status) && (
                        <button
                            type="button"
                            class="btn btn-primary btn-sm"
                            onClick$={() => showModal('send-invoice-modal')}
                        >
                            {invoice.status === 'draft' ? 'Send Invoice' : 'Resend'}
                        </button>
                    )}
                </div>
            </PageHeader>

            {/* Error Messages */}
            {(sendAction.value?.success === false || voidAction.value?.success === false) && (
                <div class="alert alert-error mb-4">
                    <span>{sendAction.value?.error || voidAction.value?.error}</span>
                </div>
            )}

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Invoice Preview */}
                <div class="lg:col-span-2">
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            {/* Header */}
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <h2 class="text-2xl font-bold">INVOICE</h2>
                                    <p class="text-base-content/60">{invoice.invoice_number}</p>
                                </div>
                                <div class="text-right">
                                    <span class={`badge badge-lg ${invoiceStatusColors[invoice.status]}`}>
                                        {invoiceStatusLabels[invoice.status]}
                                    </span>
                                    {overdue && invoice.status !== 'overdue' && (
                                        <span class="badge badge-error badge-lg ml-2">Overdue</span>
                                    )}
                                </div>
                            </div>

                            {/* Billing Info */}
                            <div class="grid grid-cols-2 gap-8 mb-6">
                                <div>
                                    <h4 class="text-sm font-semibold text-base-content/60 mb-2">BILL TO</h4>
                                    <p class="font-medium">{invoice.billing_name}</p>
                                    {invoice.billing_company && <p>{invoice.billing_company}</p>}
                                    <p class="text-sm">{invoice.billing_email}</p>
                                    {invoice.billing_phone && <p class="text-sm">{invoice.billing_phone}</p>}
                                    {invoice.billing_address && (
                                        <p class="text-sm whitespace-pre-line mt-1">{invoice.billing_address}</p>
                                    )}
                                    {invoice.tax_id && (
                                        <p class="text-sm mt-1">Tax ID: {invoice.tax_id}</p>
                                    )}
                                </div>
                                <div class="text-right">
                                    <div class="space-y-1">
                                        <div>
                                            <span class="text-sm text-base-content/60">Issue Date:</span>
                                            <span class="ml-2 font-medium">{formatDate(invoice.issue_date)}</span>
                                        </div>
                                        <div>
                                            <span class="text-sm text-base-content/60">Due Date:</span>
                                            <span class={`ml-2 font-medium ${overdue ? 'text-error' : ''}`}>
                                                {formatDate(invoice.due_date)}
                                            </span>
                                        </div>
                                        {invoice.booking && (
                                            <div>
                                                <span class="text-sm text-base-content/60">Booking:</span>
                                                <Link
                                                    href={`/vendor/bookings/${invoice.booking_id}`}
                                                    class="ml-2 link link-primary"
                                                >
                                                    #{invoice.booking.booking_number}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div class="overflow-x-auto mb-6">
                                <table class="table">
                                    <thead>
                                        <tr class="bg-base-200">
                                            <th>Description</th>
                                            <th class="text-center">Qty</th>
                                            <th class="text-right">Unit Price</th>
                                            <th class="text-right">Discount</th>
                                            <th class="text-right">Tax</th>
                                            <th class="text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div class="font-medium">{item.description}</div>
                                                    <div class="text-xs text-base-content/60 capitalize">
                                                        {item.item_type.replace('_', ' ')}
                                                    </div>
                                                </td>
                                                <td class="text-center">
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td class="text-right">
                                                    {formatCurrency(item.unit_price, invoice.currency)}
                                                </td>
                                                <td class="text-right">
                                                    {item.discount_amount > 0 ? (
                                                        <span class="text-success">
                                                            -{formatCurrency(item.discount_amount, invoice.currency)}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td class="text-right">
                                                    {item.tax_amount > 0
                                                        ? formatCurrency(item.tax_amount, invoice.currency)
                                                        : '-'}
                                                </td>
                                                <td class="text-right font-medium">
                                                    {formatCurrency(item.line_total, invoice.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div class="flex justify-end">
                                <div class="w-72 space-y-2">
                                    <div class="flex justify-between">
                                        <span class="text-base-content/60">Subtotal</span>
                                        <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                                    </div>
                                    {invoice.discount_amount > 0 && (
                                        <div class="flex justify-between text-success">
                                            <span>Discount</span>
                                            <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                                        </div>
                                    )}
                                    {invoice.tax_amount > 0 && (
                                        <div class="flex justify-between">
                                            <span class="text-base-content/60">Tax</span>
                                            <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                                        </div>
                                    )}
                                    <div class="divider my-1"></div>
                                    <div class="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                                    </div>
                                    {invoice.amount_paid > 0 && (
                                        <div class="flex justify-between text-success">
                                            <span>Paid</span>
                                            <span>-{formatCurrency(invoice.amount_paid, invoice.currency)}</span>
                                        </div>
                                    )}
                                    {invoice.amount_due > 0 && (
                                        <div class="flex justify-between text-lg font-bold text-warning">
                                            <span>Amount Due</span>
                                            <span>{formatCurrency(invoice.amount_due, invoice.currency)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes & Payment Instructions */}
                            {(invoice.payment_instructions || invoice.footer_text) && (
                                <div class="mt-8 pt-6 border-t border-base-200">
                                    {invoice.payment_instructions && (
                                        <div class="mb-4">
                                            <h4 class="font-semibold text-sm mb-2">Payment Instructions</h4>
                                            <p class="text-sm whitespace-pre-line">{invoice.payment_instructions}</p>
                                        </div>
                                    )}
                                    {invoice.footer_text && (
                                        <div>
                                            <p class="text-sm text-base-content/60 whitespace-pre-line">{invoice.footer_text}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div class="space-y-4">
                    {/* Payment Status */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Payment Status</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-base-content/60">Total</span>
                                    <span class="font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-base-content/60">Paid</span>
                                    <span class="text-success font-medium">{formatCurrency(invoice.amount_paid, invoice.currency)}</span>
                                </div>
                                <div class="divider my-1"></div>
                                <div class="flex justify-between items-center">
                                    <span class="font-medium">Balance Due</span>
                                    <span class={`font-bold ${invoice.amount_due > 0 ? 'text-warning' : 'text-success'}`}>
                                        {formatCurrency(invoice.amount_due, invoice.currency)}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div class="w-full bg-base-200 rounded-full h-2">
                                    <div
                                        class="bg-success h-2 rounded-full"
                                        style={{ width: `${Math.min((invoice.amount_paid / invoice.total) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p class="text-xs text-base-content/60 text-center">
                                    {Math.round((invoice.amount_paid / invoice.total) * 100)}% paid
                                </p>
                            </div>

                            {canRecordPayment(invoice.status) && (
                                <Link
                                    href={`/vendor/payments/new?invoice_id=${invoice.id}`}
                                    class="btn btn-primary btn-sm w-full mt-4"
                                >
                                    Record Payment
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Payments */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Payments</h3>
                                <div class="space-y-3">
                                    {invoice.payments.map((payment) => (
                                        <Link
                                            key={payment.id}
                                            href={`/vendor/payments/${payment.id}`}
                                            class="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg transition-colors"
                                        >
                                            <div>
                                                <div class="font-medium">{formatCurrency(payment.amount, payment.currency)}</div>
                                                <div class="text-xs text-base-content/60 capitalize">
                                                    {payment.payment_method.replace('_', ' ')} - {formatDate(payment.payment_date)}
                                                </div>
                                            </div>
                                            <StatusBadge status={payment.status} size="xs" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invoice Info */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Invoice Info</h3>
                            <div class="space-y-3 text-sm">
                                <div>
                                    <div class="text-base-content/60">Created</div>
                                    <div class="font-medium">{formatDateTime(invoice.created_at)}</div>
                                </div>
                                {invoice.sent_at && (
                                    <div>
                                        <div class="text-base-content/60">Sent</div>
                                        <div class="font-medium">{formatDateTime(invoice.sent_at)}</div>
                                    </div>
                                )}
                                {invoice.paid_at && (
                                    <div>
                                        <div class="text-base-content/60">Paid</div>
                                        <div class="font-medium text-success">{formatDateTime(invoice.paid_at)}</div>
                                    </div>
                                )}
                                {invoice.voided_at && (
                                    <div>
                                        <div class="text-base-content/60">Voided</div>
                                        <div class="font-medium text-error">{formatDateTime(invoice.voided_at)}</div>
                                        {invoice.void_reason && (
                                            <div class="text-xs text-base-content/60 mt-1">
                                                Reason: {invoice.void_reason}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    {invoice.notes && (
                        <div class="card bg-warning/10 border border-warning/20">
                            <div class="card-body">
                                <h3 class="card-title text-base">Internal Notes</h3>
                                <p class="text-sm whitespace-pre-line">{invoice.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {canVoidInvoice(invoice.status) && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Actions</h3>
                                <button
                                    type="button"
                                    class="btn btn-error btn-outline btn-sm w-full"
                                    onClick$={() => showModal('void-invoice-modal')}
                                >
                                    Void Invoice
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Send Invoice Modal */}
            <ConfirmModal
                id="send-invoice-modal"
                title="Send Invoice"
                message={`Send invoice ${invoice.invoice_number} to ${invoice.billing_email}?`}
                confirmText="Send"
                onConfirm$={handleSend}
            />

            {/* Void Invoice Modal */}
            <dialog id="void-invoice-modal" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg">Void Invoice</h3>
                    <p class="py-4">
                        Are you sure you want to void invoice {invoice.invoice_number}? This action cannot be undone.
                    </p>
                    <div class="form-control mb-4">
                        <label class="label">
                            <span class="label-text">Reason for voiding *</span>
                        </label>
                        <textarea
                            class="textarea textarea-bordered"
                            placeholder="Enter reason..."
                            value={voidReason.value}
                            onInput$={(e) => voidReason.value = (e.target as HTMLTextAreaElement).value}
                        ></textarea>
                    </div>
                    <div class="modal-action">
                        <form method="dialog">
                            <button class="btn btn-ghost">Cancel</button>
                        </form>
                        <button
                            type="button"
                            class="btn btn-error"
                            disabled={!voidReason.value.trim()}
                            onClick$={handleVoid}
                        >
                            Void Invoice
                        </button>
                    </div>
                </div>
                <form method="dialog" class="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
});
