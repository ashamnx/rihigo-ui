// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeAction$, routeLoader$, Form, Link, useNavigate, useLocation, zod$, z } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import type { RefundCreateInput, RefundReasonType, RefundMethod } from '~/types/payment';
import { refundReasonLabels, refundMethodLabels, paymentMethodLabels } from '~/types/payment';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

const refundSchema = z.object({
    payment_id: z.string().min(1, 'Payment is required'),
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    reason_type: z.enum(['cancellation', 'overcharge', 'service_issue', 'duplicate', 'other']),
    reason_description: z.string().optional(),
    refund_method: z.enum(['original_method', 'cash', 'bank_transfer', 'credit_note']),
    recipient_name: z.string().optional(),
    notes: z.string().optional(),
});

export const useFormDataLoader = routeLoader$(async (requestEvent) => {
    const paymentId = requestEvent.url.searchParams.get('payment_id');

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            let payment = null;

            if (paymentId) {
                payment = await apiClient.vendorPortal.payments.get(paymentId, token);
            }

            // Get recent completed payments for selection
            const paymentsResponse = await apiClient.vendorPortal.payments.list(token, {
                status: 'completed',
                limit: 50,
            });

            return {
                success: true,
                payment,
                payments: paymentsResponse.data || [],
            };
        } catch (error) {
            console.error('Failed to load form data:', error);
            return {
                success: false,
                payment: null,
                payments: [],
            };
        }
    });
});

export const useCreateRefund = routeAction$(
    async (data, requestEvent) => {
        return authenticatedRequest(requestEvent, async (token) => {
            try {
                const refundData: RefundCreateInput = {
                    payment_id: data.payment_id,
                    amount: data.amount,
                    reason_type: data.reason_type as RefundReasonType,
                    reason_description: data.reason_description || undefined,
                    refund_method: data.refund_method as RefundMethod,
                    recipient_name: data.recipient_name || undefined,
                    notes: data.notes || undefined,
                };

                const result = await apiClient.vendorPortal.refunds.create(refundData, token);
                return { success: true, data: result };
            } catch (error) {
                console.error('Failed to create refund:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create refund request',
                };
            }
        });
    },
    zod$(refundSchema)
);

export default component$(() => {
    const formData = useFormDataLoader();
    const createAction = useCreateRefund();
    const navigate = useNavigate();
    // location available for future use (e.g., reading query params)
    void useLocation();

    // Redirect on success
    if (createAction.value?.success) {
        navigate('/vendor/refunds');
    }

    const initialPayment = formData.value.payment;
    const payments = formData.value.payments || [];

    const selectedPaymentId = useSignal(initialPayment?.id || '');
    const amount = useSignal(initialPayment?.amount || 0);
    const maxAmount = useSignal(initialPayment?.amount || 0);
    const refundMethod = useSignal<RefundMethod>('original_method');

    const handlePaymentChange = $((e: Event) => {
        const target = e.target as HTMLSelectElement;
        selectedPaymentId.value = target.value;
        const payment = payments.find((p) => p.id === target.value);
        if (payment) {
            maxAmount.value = payment.amount;
            amount.value = payment.amount;
        }
    });

    const selectedPayment = payments.find((p) => p.id === selectedPaymentId.value) || initialPayment;

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div>
            <PageHeader
                title="Request Refund"
                subtitle="Create a new refund request"
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Refunds', href: '/vendor/refunds' },
                    { label: 'New Refund' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/refunds" class="btn btn-ghost btn-sm">
                    Cancel
                </Link>
            </PageHeader>

            <Form action={createAction} class="max-w-2xl">
                {/* Error Message */}
                {createAction.value?.success === false && (
                    <div class="alert alert-error mb-4">
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span>{createAction.value.error}</span>
                    </div>
                )}

                {/* Payment Selection */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Select Payment</h3>

                        {initialPayment ? (
                            <>
                                <input type="hidden" name="payment_id" value={initialPayment.id} />
                                <div class="alert">
                                    <div>
                                        <div class="font-medium">{initialPayment.payment_number}</div>
                                        <div class="text-sm">
                                            {formatCurrency(initialPayment.amount, initialPayment.currency)} - {paymentMethodLabels[initialPayment.payment_method]} - {formatDate(initialPayment.payment_date)}
                                        </div>
                                        <div class="text-sm text-base-content/60">
                                            Payer: {initialPayment.payer_name}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Payment to Refund *</span>
                                </label>
                                <select
                                    name="payment_id"
                                    class="select select-bordered"
                                    value={selectedPaymentId.value}
                                    onChange$={handlePaymentChange}
                                    required
                                >
                                    <option value="">Select a payment</option>
                                    {payments.map((payment) => (
                                        <option key={payment.id} value={payment.id}>
                                            {payment.payment_number} - {formatCurrency(payment.amount, payment.currency)} - {payment.payer_name}
                                        </option>
                                    ))}
                                </select>
                                {createAction.value?.fieldErrors?.payment_id && (
                                    <label class="label">
                                        <span class="label-text-alt text-error">
                                            {createAction.value.fieldErrors.payment_id}
                                        </span>
                                    </label>
                                )}
                            </div>
                        )}

                        {selectedPayment && (
                            <div class="mt-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Refund Amount *</span>
                                        <span class="label-text-alt">
                                            Max: {formatCurrency(maxAmount.value, selectedPayment.currency)}
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        class="input input-bordered"
                                        value={amount.value}
                                        min="0.01"
                                        max={maxAmount.value}
                                        step="0.01"
                                        onInput$={(e) => amount.value = parseFloat((e.target as HTMLInputElement).value) || 0}
                                        required
                                    />
                                    {createAction.value?.fieldErrors?.amount && (
                                        <label class="label">
                                            <span class="label-text-alt text-error">
                                                {createAction.value.fieldErrors.amount}
                                            </span>
                                        </label>
                                    )}
                                    {amount.value < maxAmount.value && amount.value > 0 && (
                                        <label class="label">
                                            <span class="label-text-alt text-info">
                                                Partial refund: {formatCurrency(amount.value, selectedPayment.currency)} of {formatCurrency(maxAmount.value, selectedPayment.currency)}
                                            </span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Refund Reason */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Refund Reason</h3>
                        <div class="grid grid-cols-1 gap-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Reason Type *</span>
                                </label>
                                <select name="reason_type" class="select select-bordered" required>
                                    {Object.entries(refundReasonLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Description</span>
                                </label>
                                <textarea
                                    name="reason_description"
                                    class="textarea textarea-bordered h-24"
                                    placeholder="Provide details about the refund reason..."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Refund Method */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Refund Method</h3>
                        <div class="grid grid-cols-1 gap-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">How to Refund *</span>
                                </label>
                                <select
                                    name="refund_method"
                                    class="select select-bordered"
                                    value={refundMethod.value}
                                    onChange$={(e) => refundMethod.value = (e.target as HTMLSelectElement).value as RefundMethod}
                                    required
                                >
                                    {Object.entries(refundMethodLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {refundMethod.value === 'original_method' && selectedPayment && (
                                <div class="alert alert-info">
                                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                    </svg>
                                    <span>
                                        Refund will be processed via {paymentMethodLabels[selectedPayment.payment_method]}
                                        {selectedPayment.card_last_four && ` ending in ${selectedPayment.card_last_four}`}
                                    </span>
                                </div>
                            )}

                            {refundMethod.value === 'credit_note' && (
                                <div class="alert alert-warning">
                                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                    <span>A credit note will be issued that can be applied to future invoices.</span>
                                </div>
                            )}

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Recipient Name</span>
                                    <span class="label-text-alt">If different from payer</span>
                                </label>
                                <input
                                    type="text"
                                    name="recipient_name"
                                    class="input input-bordered"
                                    placeholder={selectedPayment?.payer_name || 'Recipient name'}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Additional Notes</h3>
                        <div class="form-control">
                            <textarea
                                name="notes"
                                class="textarea textarea-bordered h-24"
                                placeholder="Any additional notes about this refund request..."
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div class="flex justify-between items-center mt-6">
                    <div class="text-sm text-base-content/60">
                        Refund Amount: <span class="font-bold text-error">-{formatCurrency(amount.value)}</span>
                    </div>
                    <div class="flex gap-2">
                        <Link href="/vendor/refunds" class="btn btn-ghost">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            disabled={createAction.isRunning || !selectedPaymentId.value}
                        >
                            {createAction.isRunning && <span class="loading loading-spinner loading-sm"></span>}
                            Submit Refund Request
                        </button>
                    </div>
                </div>
            </Form>
        </div>
    );
});
