// @ts-nocheck
import { component$, useSignal, useComputed$, $ } from '@builder.io/qwik';
import { routeAction$, routeLoader$, Form, Link, useNavigate, useLocation, zod$, z, type DocumentHead } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import type { InvoiceCreateInput, InvoiceItemInput } from '~/types/invoice';
import type { ItemType, ItemUnit } from '~/types/quotation';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

// Schema for form validation
const invoiceSchema = z.object({
    booking_id: z.string().optional(),
    guest_id: z.string().optional(),
    billing_name: z.string().min(1, 'Billing name is required'),
    billing_email: z.string().email('Invalid email address'),
    billing_phone: z.string().optional(),
    billing_address: z.string().optional(),
    billing_company: z.string().optional(),
    tax_id: z.string().optional(),
    issue_date: z.string().optional(),
    due_date: z.string().min(1, 'Due date is required'),
    currency: z.string().default('USD'),
    notes: z.string().optional(),
    footer_text: z.string().optional(),
    payment_instructions: z.string().optional(),
    // Items will be handled separately
});

// Load initial data (booking, guest info)
export const useFormDataLoader = routeLoader$(async (requestEvent) => {
    const bookingId = requestEvent.url.searchParams.get('booking_id');
    const guestId = requestEvent.url.searchParams.get('guest_id');

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const [guestsResponse, taxRatesResponse] = await Promise.all([
                apiClient.vendorPortal.guests.list(token, { limit: 100 }),
                apiClient.vendorPortal.taxes.getRates(token),
            ]);

            let booking = null;
            let guest = null;

            if (bookingId) {
                booking = await apiClient.vendorPortal.bookings.get(bookingId, token);
                if (booking.primary_guest) {
                    guest = booking.primary_guest;
                }
            } else if (guestId) {
                guest = await apiClient.vendorPortal.guests.get(guestId, token);
            }

            return {
                success: true,
                booking,
                guest,
                guests: guestsResponse.data || [],
                taxRates: taxRatesResponse.data || [],
            };
        } catch (error) {
            console.error('Failed to load form data:', error);
            return {
                success: false,
                booking: null,
                guest: null,
                guests: [],
                taxRates: [],
            };
        }
    });
});

export const useCreateInvoice = routeAction$(
    async (data, requestEvent) => {
        return authenticatedRequest(requestEvent, async (token) => {
            try {
                // Parse items from form data
                const itemsJson = requestEvent.request.headers.get('x-invoice-items');
                const items: InvoiceItemInput[] = itemsJson ? JSON.parse(itemsJson) : [];

                const invoiceData: InvoiceCreateInput = {
                    booking_id: data.booking_id || undefined,
                    guest_id: data.guest_id || undefined,
                    billing_name: data.billing_name,
                    billing_email: data.billing_email,
                    billing_phone: data.billing_phone || undefined,
                    billing_address: data.billing_address || undefined,
                    billing_company: data.billing_company || undefined,
                    tax_id: data.tax_id || undefined,
                    issue_date: data.issue_date || undefined,
                    due_date: data.due_date,
                    currency: data.currency || 'USD',
                    notes: data.notes || undefined,
                    footer_text: data.footer_text || undefined,
                    payment_instructions: data.payment_instructions || undefined,
                    items,
                };

                const result = await apiClient.vendorPortal.invoices.create(invoiceData, token);
                return { success: true, data: result };
            } catch (error) {
                console.error('Failed to create invoice:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create invoice',
                };
            }
        });
    },
    zod$(invoiceSchema)
);

interface LineItem {
    id: string;
    item_type: ItemType;
    description: string;
    quantity: number;
    unit: ItemUnit;
    unit_price: number;
    discount_percent: number;
    tax_rate_id: string;
}

export default component$(() => {
    const formData = useFormDataLoader();
    const createAction = useCreateInvoice();
    const navigate = useNavigate();
    // location available for future use (e.g., reading query params)
    void useLocation();

    const activeTab = useSignal<'details' | 'items' | 'notes'>('details');

    // Initialize from booking/guest data
    const booking = formData.value.booking;
    const initialGuest = formData.value.guest;

    const billingName = useSignal(
        initialGuest ? `${initialGuest.first_name} ${initialGuest.last_name}` : ''
    );
    const billingEmail = useSignal(initialGuest?.email || '');

    // Line items
    const lineItems = useSignal<LineItem[]>([
        {
            id: crypto.randomUUID(),
            item_type: 'accommodation',
            description: booking ? `Booking #${booking.booking_number}` : '',
            quantity: booking?.nights_count || 1,
            unit: 'night',
            unit_price: booking ? booking.subtotal / (booking.nights_count || 1) : 0,
            discount_percent: 0,
            tax_rate_id: '',
        },
    ]);

    // Calculate totals
    const totals = useComputed$(() => {
        let subtotal = 0;
        let discountTotal = 0;

        lineItems.value.forEach((item) => {
            const lineSubtotal = item.quantity * item.unit_price;
            const lineDiscount = lineSubtotal * (item.discount_percent / 100);
            subtotal += lineSubtotal;
            discountTotal += lineDiscount;
        });

        // Simplified tax calculation (would use tax rates in production)
        const taxableAmount = subtotal - discountTotal;
        const taxAmount = 0; // Would calculate based on tax_rate_id
        const total = taxableAmount + taxAmount;

        return { subtotal, discountTotal, taxableAmount, taxAmount, total };
    });

    // Redirect on success
    if (createAction.value?.success) {
        navigate('/vendor/invoices');
    }

    const addLineItem = $(() => {
        lineItems.value = [
            ...lineItems.value,
            {
                id: crypto.randomUUID(),
                item_type: 'service',
                description: '',
                quantity: 1,
                unit: 'unit',
                unit_price: 0,
                discount_percent: 0,
                tax_rate_id: '',
            },
        ];
    });

    const removeLineItem = $((id: string) => {
        lineItems.value = lineItems.value.filter((item) => item.id !== id);
    });

    const updateLineItem = $((id: string, field: keyof LineItem, value: string | number) => {
        lineItems.value = lineItems.value.map((item) => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        });
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Get today's date and default due date (30 days from now)
    const today = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return (
        <div>
            <PageHeader
                title="New Invoice"
                subtitle="Create a new invoice"
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Invoices', href: '/vendor/invoices' },
                    { label: 'New Invoice' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/invoices" class="btn btn-ghost btn-sm">
                    Cancel
                </Link>
            </PageHeader>

            <Form action={createAction} class="max-w-5xl">
                {/* Error Message */}
                {createAction.value?.success === false && (
                    <div class="alert alert-error mb-4">
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span>{createAction.value.error}</span>
                    </div>
                )}

                {/* Hidden fields */}
                {booking && <input type="hidden" name="booking_id" value={booking.id} />}
                {initialGuest && <input type="hidden" name="guest_id" value={initialGuest.id} />}

                {/* Tabs */}
                <div class="tabs tabs-boxed mb-6 bg-base-200">
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'details' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'details'}
                    >
                        Invoice Details
                    </button>
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'items' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'items'}
                    >
                        Line Items
                    </button>
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'notes' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'notes'}
                    >
                        Notes & Terms
                    </button>
                </div>

                {/* Details Tab */}
                <div class={activeTab.value === 'details' ? '' : 'hidden'}>
                    {/* Booking Reference */}
                    {booking && (
                        <div class="alert alert-info mb-4">
                            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                            </svg>
                            <span>
                                Creating invoice for Booking #{booking.booking_number}
                            </span>
                        </div>
                    )}

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Billing Information */}
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Billing Information</h3>
                                <div class="grid grid-cols-1 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Billing Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="billing_name"
                                            class="input input-bordered"
                                            value={billingName.value}
                                            onInput$={(e) => billingName.value = (e.target as HTMLInputElement).value}
                                            required
                                        />
                                        {createAction.value?.fieldErrors?.billing_name && (
                                            <label class="label">
                                                <span class="label-text-alt text-error">
                                                    {createAction.value.fieldErrors.billing_name}
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Billing Email *</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="billing_email"
                                            class="input input-bordered"
                                            value={billingEmail.value}
                                            onInput$={(e) => billingEmail.value = (e.target as HTMLInputElement).value}
                                            required
                                        />
                                        {createAction.value?.fieldErrors?.billing_email && (
                                            <label class="label">
                                                <span class="label-text-alt text-error">
                                                    {createAction.value.fieldErrors.billing_email}
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Phone</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="billing_phone"
                                            class="input input-bordered"
                                            value={initialGuest?.phone || ''}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Company</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="billing_company"
                                            class="input input-bordered"
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Address</span>
                                        </label>
                                        <textarea
                                            name="billing_address"
                                            class="textarea textarea-bordered"
                                            rows={2}
                                        ></textarea>
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Tax ID / VAT Number</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="tax_id"
                                            class="input input-bordered"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Settings */}
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Invoice Settings</h3>
                                <div class="grid grid-cols-1 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Currency</span>
                                        </label>
                                        <select name="currency" class="select select-bordered">
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                            <option value="MVR">MVR - Maldivian Rufiyaa</option>
                                        </select>
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Issue Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="issue_date"
                                            class="input input-bordered"
                                            value={today}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Due Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="due_date"
                                            class="input input-bordered"
                                            value={defaultDueDate}
                                            required
                                        />
                                        {createAction.value?.fieldErrors?.due_date && (
                                            <label class="label">
                                                <span class="label-text-alt text-error">
                                                    {createAction.value.fieldErrors.due_date}
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Tab */}
                <div class={activeTab.value === 'items' ? '' : 'hidden'}>
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="card-title text-base">Line Items</h3>
                                <button
                                    type="button"
                                    class="btn btn-sm btn-ghost"
                                    onClick$={addLineItem}
                                >
                                    <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Add Item
                                </button>
                            </div>

                            <div class="overflow-x-auto">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th class="w-12">Type</th>
                                            <th>Description</th>
                                            <th class="w-20">Qty</th>
                                            <th class="w-24">Unit</th>
                                            <th class="w-28">Unit Price</th>
                                            <th class="w-20">Disc %</th>
                                            <th class="w-28 text-right">Total</th>
                                            <th class="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineItems.value.map((item) => {
                                            const lineTotal = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
                                            return (
                                                <tr key={item.id}>
                                                    <td>
                                                        <select
                                                            class="select select-bordered select-xs w-full"
                                                            value={item.item_type}
                                                            onChange$={(e) => updateLineItem(item.id, 'item_type', (e.target as HTMLSelectElement).value)}
                                                        >
                                                            <option value="accommodation">Room</option>
                                                            <option value="activity">Activity</option>
                                                            <option value="transfer">Transfer</option>
                                                            <option value="service">Service</option>
                                                            <option value="product">Product</option>
                                                            <option value="fee">Fee</option>
                                                            <option value="tax">Tax</option>
                                                            <option value="discount">Discount</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            class="input input-bordered input-xs w-full"
                                                            value={item.description}
                                                            onInput$={(e) => updateLineItem(item.id, 'description', (e.target as HTMLInputElement).value)}
                                                            placeholder="Item description"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            class="input input-bordered input-xs w-full"
                                                            value={item.quantity}
                                                            min="1"
                                                            onInput$={(e) => updateLineItem(item.id, 'quantity', parseFloat((e.target as HTMLInputElement).value) || 1)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            class="select select-bordered select-xs w-full"
                                                            value={item.unit}
                                                            onChange$={(e) => updateLineItem(item.id, 'unit', (e.target as HTMLSelectElement).value)}
                                                        >
                                                            <option value="night">Night</option>
                                                            <option value="day">Day</option>
                                                            <option value="hour">Hour</option>
                                                            <option value="person">Person</option>
                                                            <option value="unit">Unit</option>
                                                            <option value="trip">Trip</option>
                                                            <option value="fixed">Fixed</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            class="input input-bordered input-xs w-full"
                                                            value={item.unit_price}
                                                            min="0"
                                                            step="0.01"
                                                            onInput$={(e) => updateLineItem(item.id, 'unit_price', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            class="input input-bordered input-xs w-full"
                                                            value={item.discount_percent}
                                                            min="0"
                                                            max="100"
                                                            onInput$={(e) => updateLineItem(item.id, 'discount_percent', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                                        />
                                                    </td>
                                                    <td class="text-right font-medium">
                                                        {formatCurrency(lineTotal)}
                                                    </td>
                                                    <td>
                                                        {lineItems.value.length > 1 && (
                                                            <button
                                                                type="button"
                                                                class="btn btn-ghost btn-xs btn-square text-error"
                                                                onClick$={() => removeLineItem(item.id)}
                                                            >
                                                                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div class="flex justify-end mt-4">
                                <div class="w-64 space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(totals.value.subtotal)}</span>
                                    </div>
                                    {totals.value.discountTotal > 0 && (
                                        <div class="flex justify-between text-sm text-success">
                                            <span>Discount</span>
                                            <span>-{formatCurrency(totals.value.discountTotal)}</span>
                                        </div>
                                    )}
                                    <div class="flex justify-between text-sm">
                                        <span>Tax</span>
                                        <span>{formatCurrency(totals.value.taxAmount)}</span>
                                    </div>
                                    <div class="divider my-1"></div>
                                    <div class="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(totals.value.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Tab */}
                <div class={activeTab.value === 'notes' ? '' : 'hidden'}>
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Notes & Terms</h3>
                            <div class="grid grid-cols-1 gap-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Internal Notes</span>
                                        <span class="label-text-alt">Not visible to customer</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Internal notes about this invoice..."
                                    ></textarea>
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Payment Instructions</span>
                                    </label>
                                    <textarea
                                        name="payment_instructions"
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Instructions for payment (bank details, payment methods accepted, etc.)"
                                    ></textarea>
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Footer Text</span>
                                    </label>
                                    <textarea
                                        name="footer_text"
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Terms and conditions, thank you message, etc."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div class="flex justify-between mt-6">
                    <div class="text-sm text-base-content/60">
                        Invoice Total: <span class="font-bold text-base-content">{formatCurrency(totals.value.total)}</span>
                    </div>
                    <div class="flex gap-2">
                        <Link href="/vendor/invoices" class="btn btn-ghost">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            name="action"
                            value="draft"
                            class="btn btn-outline"
                            disabled={createAction.isRunning}
                        >
                            Save as Draft
                        </button>
                        <button
                            type="submit"
                            name="action"
                            value="send"
                            class="btn btn-primary"
                            disabled={createAction.isRunning}
                        >
                            {createAction.isRunning && <span class="loading loading-spinner loading-sm"></span>}
                            Create & Send
                        </button>
                    </div>
                </div>
            </Form>
        </div>
    );
});

export const head: DocumentHead = {
    title: "New Invoice | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "Create a new invoice for your customer",
        },
    ],
};
