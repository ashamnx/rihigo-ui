// @ts-nocheck
import { component$, useSignal, useStore, $, useComputed$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link, useNavigate, zod$, z } from '@builder.io/qwik-city';
import { authenticatedRequest, apiClient } from '~/utils/api-client';
import type { Guest } from '~/types/guest';
import type { VendorResource, ServiceType } from '~/types/resource';
import type { ItemType, ItemUnit } from '~/types/quotation';
import { itemTypeLabels, itemUnitLabels, calculateLineTotal } from '~/types/quotation';

// Load guests for selection
export const useGuestsLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.guests.list(token, { limit: 100 });
    });
});

// Load resources for selection
export const useResourcesLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.resources.list(token, { limit: 100 });
    });
});

// Create quotation action
export const useCreateQuotation = routeAction$(
    async (data, requestEvent) => {
        return authenticatedRequest(requestEvent, async (token) => {
            return apiClient.vendorPortal.quotations.create(data, token);
        });
    },
    zod$({
        guest_id: z.string().optional(),
        customer_name: z.string().min(1, 'Customer name is required'),
        customer_email: z.string().email('Valid email is required'),
        customer_phone: z.string().optional(),
        customer_company: z.string().optional(),
        valid_until: z.string().min(1, 'Valid until date is required'),
        service_type: z.string().optional(),
        resource_id: z.string().optional(),
        activity_id: z.string().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        adults: z.number().optional(),
        children: z.number().optional(),
        infants: z.number().optional(),
        items: z.array(z.object({
            item_type: z.string(),
            description: z.string(),
            quantity: z.number(),
            unit: z.string(),
            unit_price: z.number(),
            discount_percent: z.number().optional(),
            discount_amount: z.number().optional(),
            tax_rate_id: z.string().optional(),
            sort_order: z.number().optional(),
        })).min(1, 'At least one line item is required'),
        notes: z.string().optional(),
        internal_notes: z.string().optional(),
        terms_and_conditions: z.string().optional(),
    })
);

interface LineItem {
    id: string;
    item_type: ItemType;
    description: string;
    quantity: number;
    unit: ItemUnit;
    unit_price: number;
    discount_percent: number;
    discount_amount: number;
    tax_rate_id: string;
}

export default component$(() => {
    const guestsData = useGuestsLoader();
    const resourcesData = useResourcesLoader();
    const createAction = useCreateQuotation();
    const nav = useNavigate();

    const guests = useComputed$(() => guestsData.value.data || []);
    const resources = useComputed$(() => resourcesData.value.data || []);

    // Form state
    const selectedGuestId = useSignal('');
    const customerName = useSignal('');
    const customerEmail = useSignal('');
    const customerPhone = useSignal('');
    const customerCompany = useSignal('');
    const validUntil = useSignal('');
    const validityDays = useSignal(14);

    // Service details
    const serviceType = useSignal<ServiceType | ''>('');
    const resourceId = useSignal('');
    const startDate = useSignal('');
    const endDate = useSignal('');
    const adults = useSignal(2);
    const children = useSignal(0);
    const infants = useSignal(0);

    // Line items
    const lineItems = useStore<{ items: LineItem[] }>({
        items: [{
            id: crypto.randomUUID(),
            item_type: 'accommodation',
            description: '',
            quantity: 1,
            unit: 'night',
            unit_price: 0,
            discount_percent: 0,
            discount_amount: 0,
            tax_rate_id: '',
        }]
    });

    // Notes
    const notes = useSignal('');
    const internalNotes = useSignal('');
    const termsAndConditions = useSignal('');

    // State
    const isSubmitting = useSignal(false);
    const useExistingGuest = useSignal(false);

    // Calculate totals
    const totals = useComputed$(() => {
        let subtotal = 0;
        let discountTotal = 0;
        const taxTotal = 0; // TODO: Calculate based on tax settings

        lineItems.items.forEach(item => {
            const lineTotal = calculateLineTotal(
                item.quantity,
                item.unit_price,
                item.discount_percent,
                item.discount_amount
            );
            subtotal += item.quantity * item.unit_price;
            discountTotal += (item.quantity * item.unit_price) - lineTotal;
        });

        const total = subtotal - discountTotal + taxTotal;

        return { subtotal, discountTotal, taxTotal, total };
    });

    // Handle guest selection
    const handleGuestSelect = $((guestId: string) => {
        selectedGuestId.value = guestId;
        const guest = (guests.value as Guest[]).find(g => g.id === guestId);
        if (guest) {
            customerName.value = `${guest.first_name} ${guest.last_name}`;
            customerEmail.value = guest.email || '';
            customerPhone.value = guest.phone || '';
        }
    });

    // Handle validity days change
    const handleValidityDaysChange = $((days: number) => {
        validityDays.value = days;
        const date = new Date();
        date.setDate(date.getDate() + days);
        validUntil.value = date.toISOString().split('T')[0];
    });

    // Add line item
    const addLineItem = $(() => {
        lineItems.items.push({
            id: crypto.randomUUID(),
            item_type: 'service',
            description: '',
            quantity: 1,
            unit: 'unit',
            unit_price: 0,
            discount_percent: 0,
            discount_amount: 0,
            tax_rate_id: '',
        });
    });

    // Remove line item
    const removeLineItem = $((id: string) => {
        const index = lineItems.items.findIndex(item => item.id === id);
        if (index > -1 && lineItems.items.length > 1) {
            lineItems.items.splice(index, 1);
        }
    });

    // Update line item
    const updateLineItem = $((id: string, field: keyof LineItem, value: any) => {
        const item = lineItems.items.find(i => i.id === id);
        if (item) {
            (item as any)[field] = value;
        }
    });

    // Handle resource selection
    const handleResourceSelect = $((resId: string) => {
        resourceId.value = resId;
        const resource = (resources.value as VendorResource[]).find(r => r.id === resId);
        if (resource) {
            serviceType.value = resource.service_type;
            // Add resource as first line item if empty
            if (lineItems.items.length === 1 && !lineItems.items[0].description) {
                lineItems.items[0] = {
                    ...lineItems.items[0],
                    item_type: 'accommodation',
                    description: resource.name,
                    unit_price: resource.base_price,
                    unit: 'night',
                };
            }
        }
    });

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Handle form submission
    const handleSubmit = $(async () => {
        isSubmitting.value = true;

        const formData = {
            guest_id: selectedGuestId.value || undefined,
            customer_name: customerName.value,
            customer_email: customerEmail.value,
            customer_phone: customerPhone.value || undefined,
            customer_company: customerCompany.value || undefined,
            valid_until: validUntil.value,
            service_type: serviceType.value || undefined,
            resource_id: resourceId.value || undefined,
            start_date: startDate.value || undefined,
            end_date: endDate.value || undefined,
            adults: adults.value || undefined,
            children: children.value || undefined,
            infants: infants.value || undefined,
            items: lineItems.items.map((item, index) => ({
                item_type: item.item_type,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
                discount_percent: item.discount_percent || undefined,
                discount_amount: item.discount_amount || undefined,
                tax_rate_id: item.tax_rate_id || undefined,
                sort_order: index,
            })),
            notes: notes.value || undefined,
            internal_notes: internalNotes.value || undefined,
            terms_and_conditions: termsAndConditions.value || undefined,
        };

        const result = await createAction.submit(formData);

        if (result.value.success) {
            nav('/vendor/quotations');
        }

        isSubmitting.value = false;
    });

    return (
        <div class="p-6 max-w-5xl mx-auto">
            {/* Page Header */}
            <div class="flex items-center gap-4 mb-6">
                <Link href="/vendor/quotations" class="btn btn-ghost btn-sm btn-square">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold">Create Quotation</h1>
                    <p class="text-base-content/70">Create a new quotation for your customer</p>
                </div>
            </div>

            {createAction.value?.success === false && (
                <div class="alert alert-error mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{createAction.value.error_message || 'Failed to create quotation'}</span>
                </div>
            )}

            <Form>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div class="lg:col-span-2 space-y-6">
                        {/* Customer Section */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h2 class="card-title text-lg">Customer Information</h2>

                                {/* Toggle existing/new customer */}
                                <div class="form-control mb-4">
                                    <label class="label cursor-pointer justify-start gap-3">
                                        <input
                                            type="checkbox"
                                            class="toggle toggle-primary"
                                            checked={useExistingGuest.value}
                                            onChange$={(e) => {
                                                useExistingGuest.value = (e.target as HTMLInputElement).checked;
                                                if (!useExistingGuest.value) {
                                                    selectedGuestId.value = '';
                                                }
                                            }}
                                        />
                                        <span class="label-text">Select existing guest</span>
                                    </label>
                                </div>

                                {useExistingGuest.value ? (
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Select Guest</span>
                                        </label>
                                        <select
                                            class="select select-bordered w-full"
                                            value={selectedGuestId.value}
                                            onChange$={(e) => handleGuestSelect((e.target as HTMLSelectElement).value)}
                                        >
                                            <option value="">Select a guest...</option>
                                            {(guests.value as Guest[]).map((guest) => (
                                                <option key={guest.id} value={guest.id}>
                                                    {guest.first_name} {guest.last_name} - {guest.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Customer Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            class="input input-bordered"
                                            value={customerName.value}
                                            onInput$={(e) => customerName.value = (e.target as HTMLInputElement).value}
                                            required
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Email *</span>
                                        </label>
                                        <input
                                            type="email"
                                            class="input input-bordered"
                                            value={customerEmail.value}
                                            onInput$={(e) => customerEmail.value = (e.target as HTMLInputElement).value}
                                            required
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Phone</span>
                                        </label>
                                        <input
                                            type="tel"
                                            class="input input-bordered"
                                            value={customerPhone.value}
                                            onInput$={(e) => customerPhone.value = (e.target as HTMLInputElement).value}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Company</span>
                                        </label>
                                        <input
                                            type="text"
                                            class="input input-bordered"
                                            value={customerCompany.value}
                                            onInput$={(e) => customerCompany.value = (e.target as HTMLInputElement).value}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Service Details Section */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h2 class="card-title text-lg">Service Details</h2>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Service Type</span>
                                        </label>
                                        <select
                                            class="select select-bordered"
                                            value={serviceType.value}
                                            onChange$={(e) => serviceType.value = (e.target as HTMLSelectElement).value as ServiceType}
                                        >
                                            <option value="">Select service type...</option>
                                            <option value="accommodation">Accommodation</option>
                                            <option value="tour">Tour</option>
                                            <option value="transfer">Transfer</option>
                                            <option value="rental">Rental</option>
                                            <option value="activity">Activity</option>
                                        </select>
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Resource</span>
                                        </label>
                                        <select
                                            class="select select-bordered"
                                            value={resourceId.value}
                                            onChange$={(e) => handleResourceSelect((e.target as HTMLSelectElement).value)}
                                        >
                                            <option value="">Select resource...</option>
                                            {(resources.value as VendorResource[])
                                                .filter(r => !serviceType.value || r.service_type === serviceType.value)
                                                .map((resource) => (
                                                    <option key={resource.id} value={resource.id}>
                                                        {resource.name} - {formatCurrency(resource.base_price)}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Start Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            class="input input-bordered"
                                            value={startDate.value}
                                            onInput$={(e) => startDate.value = (e.target as HTMLInputElement).value}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">End Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            class="input input-bordered"
                                            value={endDate.value}
                                            onInput$={(e) => endDate.value = (e.target as HTMLInputElement).value}
                                        />
                                    </div>
                                </div>

                                <div class="grid grid-cols-3 gap-4 mt-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Adults</span>
                                        </label>
                                        <input
                                            type="number"
                                            class="input input-bordered"
                                            value={adults.value}
                                            min={1}
                                            onInput$={(e) => adults.value = parseInt((e.target as HTMLInputElement).value) || 0}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Children</span>
                                        </label>
                                        <input
                                            type="number"
                                            class="input input-bordered"
                                            value={children.value}
                                            min={0}
                                            onInput$={(e) => children.value = parseInt((e.target as HTMLInputElement).value) || 0}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Infants</span>
                                        </label>
                                        <input
                                            type="number"
                                            class="input input-bordered"
                                            value={infants.value}
                                            min={0}
                                            onInput$={(e) => infants.value = parseInt((e.target as HTMLInputElement).value) || 0}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Items Section */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <div class="flex justify-between items-center mb-4">
                                    <h2 class="card-title text-lg">Line Items</h2>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-primary"
                                        onClick$={addLineItem}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Item
                                    </button>
                                </div>

                                <div class="overflow-x-auto">
                                    <table class="table table-compact w-full">
                                        <thead>
                                            <tr>
                                                <th class="w-32">Type</th>
                                                <th>Description</th>
                                                <th class="w-20">Qty</th>
                                                <th class="w-24">Unit</th>
                                                <th class="w-28">Unit Price</th>
                                                <th class="w-20">Disc %</th>
                                                <th class="w-28">Total</th>
                                                <th class="w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lineItems.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <select
                                                            class="select select-bordered select-sm w-full"
                                                            value={item.item_type}
                                                            onChange$={(e) => updateLineItem(item.id, 'item_type', (e.target as HTMLSelectElement).value as ItemType)}
                                                        >
                                                            {Object.entries(itemTypeLabels).map(([value, label]) => (
                                                                <option key={value} value={value}>{label}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            class="input input-bordered input-sm w-full"
                                                            placeholder="Description"
                                                            value={item.description}
                                                            onInput$={(e) => updateLineItem(item.id, 'description', (e.target as HTMLInputElement).value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            class="input input-bordered input-sm w-full"
                                                            min={1}
                                                            value={item.quantity}
                                                            onInput$={(e) => updateLineItem(item.id, 'quantity', parseInt((e.target as HTMLInputElement).value) || 1)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            class="select select-bordered select-sm w-full"
                                                            value={item.unit}
                                                            onChange$={(e) => updateLineItem(item.id, 'unit', (e.target as HTMLSelectElement).value as ItemUnit)}
                                                        >
                                                            {Object.entries(itemUnitLabels).map(([value, label]) => (
                                                                <option key={value} value={value}>{label}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            class="input input-bordered input-sm w-full"
                                                            min={0}
                                                            step={0.01}
                                                            value={item.unit_price}
                                                            onInput$={(e) => updateLineItem(item.id, 'unit_price', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            class="input input-bordered input-sm w-full"
                                                            min={0}
                                                            max={100}
                                                            value={item.discount_percent}
                                                            onInput$={(e) => updateLineItem(item.id, 'discount_percent', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                                        />
                                                    </td>
                                                    <td class="text-right font-semibold">
                                                        {formatCurrency(calculateLineTotal(
                                                            item.quantity,
                                                            item.unit_price,
                                                            item.discount_percent,
                                                            item.discount_amount
                                                        ))}
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            class="btn btn-ghost btn-sm btn-square text-error"
                                                            onClick$={() => removeLineItem(item.id)}
                                                            disabled={lineItems.items.length === 1}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h2 class="card-title text-lg">Notes & Terms</h2>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Customer Notes</span>
                                    </label>
                                    <textarea
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Notes visible to the customer..."
                                        value={notes.value}
                                        onInput$={(e) => notes.value = (e.target as HTMLTextAreaElement).value}
                                    ></textarea>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Internal Notes</span>
                                    </label>
                                    <textarea
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Internal notes (not visible to customer)..."
                                        value={internalNotes.value}
                                        onInput$={(e) => internalNotes.value = (e.target as HTMLTextAreaElement).value}
                                    ></textarea>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Terms & Conditions</span>
                                    </label>
                                    <textarea
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Terms and conditions..."
                                        value={termsAndConditions.value}
                                        onInput$={(e) => termsAndConditions.value = (e.target as HTMLTextAreaElement).value}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div class="space-y-6">
                        {/* Validity Section */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h2 class="card-title text-lg">Validity</h2>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Valid for (days)</span>
                                    </label>
                                    <select
                                        class="select select-bordered"
                                        value={validityDays.value}
                                        onChange$={(e) => handleValidityDaysChange(parseInt((e.target as HTMLSelectElement).value))}
                                    >
                                        <option value={7}>7 days</option>
                                        <option value={14}>14 days</option>
                                        <option value={30}>30 days</option>
                                        <option value={60}>60 days</option>
                                        <option value={90}>90 days</option>
                                    </select>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Valid Until *</span>
                                    </label>
                                    <input
                                        type="date"
                                        class="input input-bordered"
                                        value={validUntil.value}
                                        onInput$={(e) => validUntil.value = (e.target as HTMLInputElement).value}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <h2 class="card-title text-lg">Summary</h2>

                                <div class="space-y-3">
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Subtotal</span>
                                        <span>{formatCurrency(totals.value.subtotal)}</span>
                                    </div>
                                    {totals.value.discountTotal > 0 && (
                                        <div class="flex justify-between text-error">
                                            <span>Discounts</span>
                                            <span>-{formatCurrency(totals.value.discountTotal)}</span>
                                        </div>
                                    )}
                                    {totals.value.taxTotal > 0 && (
                                        <div class="flex justify-between">
                                            <span class="text-base-content/70">Tax</span>
                                            <span>{formatCurrency(totals.value.taxTotal)}</span>
                                        </div>
                                    )}
                                    <div class="divider my-2"></div>
                                    <div class="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(totals.value.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div class="card bg-base-100 shadow">
                            <div class="card-body">
                                <button
                                    type="button"
                                    class="btn btn-primary w-full"
                                    onClick$={handleSubmit}
                                    disabled={isSubmitting.value}
                                >
                                    {isSubmitting.value ? (
                                        <span class="loading loading-spinner loading-sm"></span>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save as Draft
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-outline w-full"
                                    disabled={isSubmitting.value}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Save & Send
                                </button>
                                <Link href="/vendor/quotations" class="btn btn-ghost w-full">
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>
        </div>
    );
});
