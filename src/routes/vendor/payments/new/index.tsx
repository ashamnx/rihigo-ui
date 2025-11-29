// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeAction$, routeLoader$, Form, Link, useNavigate, useLocation, zod$, z } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import type { PaymentCreateInput, PaymentMethod } from '~/types/payment';
import { paymentMethodLabels } from '~/types/payment';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

const paymentSchema = z.object({
    invoice_id: z.string().optional(),
    booking_id: z.string().optional(),
    guest_id: z.string().optional(),
    payer_name: z.string().min(1, 'Payer name is required'),
    payer_email: z.string().email().optional().or(z.literal('')),
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    currency: z.string().default('USD'),
    payment_method: z.enum(['cash', 'card', 'bank_transfer', 'online', 'wallet', 'other']),
    payment_provider: z.string().optional(),
    transaction_id: z.string().optional(),
    card_last_four: z.string().optional(),
    card_brand: z.string().optional(),
    payment_date: z.string().optional(),
    notes: z.string().optional(),
    auto_allocate: z.coerce.boolean().default(true),
});

export const useFormDataLoader = routeLoader$(async (requestEvent) => {
    const invoiceId = requestEvent.url.searchParams.get('invoice_id');
    const bookingId = requestEvent.url.searchParams.get('booking_id');

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            let invoice = null;
            let booking = null;
            let guest = null;

            if (invoiceId) {
                invoice = await apiClient.vendorPortal.invoices.get(invoiceId, token);
                if (invoice.guest) {
                    guest = invoice.guest;
                }
            } else if (bookingId) {
                booking = await apiClient.vendorPortal.bookings.get(bookingId, token);
                if (booking.primary_guest) {
                    guest = booking.primary_guest;
                }
            }

            const guestsResponse = await apiClient.vendorPortal.guests.list(token, { limit: 100 });

            return {
                success: true,
                invoice,
                booking,
                guest,
                guests: guestsResponse.data || [],
            };
        } catch (error) {
            console.error('Failed to load form data:', error);
            return {
                success: false,
                invoice: null,
                booking: null,
                guest: null,
                guests: [],
            };
        }
    });
});

export const useCreatePayment = routeAction$(
    async (data, requestEvent) => {
        return authenticatedRequest(requestEvent, async (token) => {
            try {
                const paymentData: PaymentCreateInput = {
                    invoice_id: data.invoice_id || undefined,
                    booking_id: data.booking_id || undefined,
                    guest_id: data.guest_id || undefined,
                    payer_name: data.payer_name,
                    payer_email: data.payer_email || undefined,
                    amount: data.amount,
                    currency: data.currency || 'USD',
                    payment_method: data.payment_method as PaymentMethod,
                    payment_provider: data.payment_provider || undefined,
                    transaction_id: data.transaction_id || undefined,
                    card_last_four: data.card_last_four || undefined,
                    card_brand: data.card_brand || undefined,
                    payment_date: data.payment_date || undefined,
                    notes: data.notes || undefined,
                    auto_allocate: data.auto_allocate,
                };

                const result = await apiClient.vendorPortal.payments.create(paymentData, token);
                return { success: true, data: result };
            } catch (error) {
                console.error('Failed to create payment:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to record payment',
                };
            }
        });
    },
    zod$(paymentSchema)
);

export default component$(() => {
    const formData = useFormDataLoader();
    const createAction = useCreatePayment();
    const navigate = useNavigate();
    // location available for future use (e.g., reading query params)
    void useLocation();

    const paymentMethod = useSignal<PaymentMethod>('cash');

    // Redirect on success
    if (createAction.value?.success) {
        navigate('/vendor/payments');
    }

    const invoice = formData.value.invoice;
    const booking = formData.value.booking;
    const initialGuest = formData.value.guest;

    const payerName = useSignal(
        invoice?.billing_name ||
        (initialGuest ? `${initialGuest.first_name} ${initialGuest.last_name}` : '')
    );
    const payerEmail = useSignal(
        invoice?.billing_email || initialGuest?.email || ''
    );
    const amount = useSignal(
        invoice?.amount_due || booking?.total || 0
    );

    const handleMethodChange = $((e: Event) => {
        const target = e.target as HTMLSelectElement;
        paymentMethod.value = target.value as PaymentMethod;
    });

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div>
            <PageHeader
                title="Record Payment"
                subtitle="Record a new payment"
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Payments', href: '/vendor/payments' },
                    { label: 'Record Payment' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/payments" class="btn btn-ghost btn-sm">
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

                {/* Invoice/Booking Reference */}
                {(invoice || booking) && (
                    <div class="alert alert-info mb-4">
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        <div>
                            {invoice && (
                                <span>
                                    Recording payment for Invoice <strong>{invoice.invoice_number}</strong>
                                    <span class="ml-2">({formatCurrency(invoice.amount_due, invoice.currency)} due)</span>
                                </span>
                            )}
                            {booking && !invoice && (
                                <span>
                                    Recording payment for Booking <strong>#{booking.booking_number}</strong>
                                    <span class="ml-2">({formatCurrency(booking.total, booking.currency)})</span>
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Hidden fields */}
                {invoice && <input type="hidden" name="invoice_id" value={invoice.id} />}
                {booking && <input type="hidden" name="booking_id" value={booking.id} />}
                {initialGuest && <input type="hidden" name="guest_id" value={initialGuest.id} />}

                {/* Payment Details */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Payment Details</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-control md:col-span-2">
                                <label class="label">
                                    <span class="label-text">Payer Name *</span>
                                </label>
                                <input
                                    type="text"
                                    name="payer_name"
                                    class="input input-bordered"
                                    value={payerName.value}
                                    onInput$={(e) => payerName.value = (e.target as HTMLInputElement).value}
                                    required
                                />
                                {createAction.value?.fieldErrors?.payer_name && (
                                    <label class="label">
                                        <span class="label-text-alt text-error">
                                            {createAction.value.fieldErrors.payer_name}
                                        </span>
                                    </label>
                                )}
                            </div>
                            <div class="form-control md:col-span-2">
                                <label class="label">
                                    <span class="label-text">Payer Email</span>
                                </label>
                                <input
                                    type="email"
                                    name="payer_email"
                                    class="input input-bordered"
                                    value={payerEmail.value}
                                    onInput$={(e) => payerEmail.value = (e.target as HTMLInputElement).value}
                                />
                            </div>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Amount *</span>
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    class="input input-bordered"
                                    value={amount.value}
                                    min="0.01"
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
                            </div>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Currency</span>
                                </label>
                                <select name="currency" class="select select-bordered">
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="MVR">MVR</option>
                                </select>
                            </div>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Payment Date</span>
                                </label>
                                <input
                                    type="date"
                                    name="payment_date"
                                    class="input input-bordered"
                                    value={today}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Payment Method</h3>
                        <div class="grid grid-cols-1 gap-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Method *</span>
                                </label>
                                <select
                                    name="payment_method"
                                    class="select select-bordered"
                                    value={paymentMethod.value}
                                    onChange$={handleMethodChange}
                                    required
                                >
                                    {Object.entries(paymentMethodLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Card details */}
                            {paymentMethod.value === 'card' && (
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Card Brand</span>
                                        </label>
                                        <select name="card_brand" class="select select-bordered">
                                            <option value="">Select brand</option>
                                            <option value="visa">Visa</option>
                                            <option value="mastercard">Mastercard</option>
                                            <option value="amex">American Express</option>
                                            <option value="discover">Discover</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Last 4 Digits</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="card_last_four"
                                            class="input input-bordered"
                                            maxLength={4}
                                            placeholder="1234"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Online/Bank transfer details */}
                            {['online', 'bank_transfer'].includes(paymentMethod.value) && (
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Provider / Bank</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="payment_provider"
                                            class="input input-bordered"
                                            placeholder={paymentMethod.value === 'online' ? 'e.g., Stripe, PayPal' : 'e.g., Bank of Maldives'}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Transaction / Reference ID</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="transaction_id"
                                            class="input input-bordered"
                                            placeholder="Transaction reference"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Additional Information</h3>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Notes</span>
                            </label>
                            <textarea
                                name="notes"
                                class="textarea textarea-bordered h-24"
                                placeholder="Any additional notes about this payment..."
                            ></textarea>
                        </div>

                        {invoice && (
                            <div class="form-control">
                                <label class="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="checkbox"
                                        name="auto_allocate"
                                        class="checkbox checkbox-primary"
                                        checked
                                        value="true"
                                    />
                                    <span class="label-text">Automatically allocate to invoice</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Buttons */}
                <div class="flex justify-between items-center mt-6">
                    <div class="text-sm text-base-content/60">
                        Recording: <span class="font-bold text-base-content">{formatCurrency(amount.value)}</span>
                    </div>
                    <div class="flex gap-2">
                        <Link href="/vendor/payments" class="btn btn-ghost">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            disabled={createAction.isRunning}
                        >
                            {createAction.isRunning && <span class="loading loading-spinner loading-sm"></span>}
                            Record Payment
                        </button>
                    </div>
                </div>
            </Form>
        </div>
    );
});
