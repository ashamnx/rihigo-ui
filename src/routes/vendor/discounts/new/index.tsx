import { component$, useSignal, useStore, $, useComputed$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, useNavigate, zod$, z, type DocumentHead } from '@builder.io/qwik-city';
import { authenticatedRequest, apiClient } from '~/utils/api-client';
import type { DiscountType, DiscountApplicability } from '~/types/discount';
import { discountTypeLabels, dayOfWeekShortLabels } from '~/types/discount';
import type { VendorResource, ServiceType } from '~/types/resource';

// Load resources for applicability selection
export const useResourcesLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.resources.list(token, { limit: 100 });
    });
});

// Create discount action
export const useCreateDiscount = routeAction$(
    async (data, requestEvent) => {
        return authenticatedRequest(requestEvent, async (token) => {
            return apiClient.vendorPortal.discounts.create(data, token);
        });
    },
    zod$({
        code: z.string().optional(),
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        discount_type: z.enum(['percentage', 'fixed', 'free_nights', 'free_service']),
        discount_value: z.number().min(0, 'Value must be positive'),
        max_discount_amount: z.number().optional(),
        applies_to: z.object({
            service_types: z.array(z.string()).optional(),
            resource_ids: z.array(z.string()).optional(),
        }).optional(),
        min_nights: z.number().optional(),
        min_amount: z.number().optional(),
        min_guests: z.number().optional(),
        booking_start_date: z.string().optional(),
        booking_end_date: z.string().optional(),
        stay_start_date: z.string().optional(),
        stay_end_date: z.string().optional(),
        valid_days_of_week: z.array(z.number()).optional(),
        usage_limit: z.number().optional(),
        usage_per_guest: z.number().optional(),
        is_combinable: z.boolean().optional(),
        priority: z.number().optional(),
        is_automatic: z.boolean().optional(),
    })
);

export default component$(() => {
    const resourcesData = useResourcesLoader();
    const createAction = useCreateDiscount();
    const nav = useNavigate();

    const resources = useComputed$(() => resourcesData.value.data || []);

    // Basic info
    const name = useSignal('');
    const description = useSignal('');
    const isAutomatic = useSignal(false);
    const code = useSignal('');

    // Value
    const discountType = useSignal<DiscountType>('percentage');
    const discountValue = useSignal(10);
    const maxDiscountAmount = useSignal<number | undefined>(undefined);

    // Applicability
    const appliesTo = useStore<DiscountApplicability>({
        service_types: [],
        resource_ids: [],
    });
    const minNights = useSignal<number | undefined>(undefined);
    const minAmount = useSignal<number | undefined>(undefined);
    const minGuests = useSignal<number | undefined>(undefined);

    // Validity
    const bookingStartDate = useSignal('');
    const bookingEndDate = useSignal('');
    const stayStartDate = useSignal('');
    const stayEndDate = useSignal('');
    const validDaysOfWeek = useStore<{ days: number[] }>({ days: [] });

    // Limits
    const usageLimit = useSignal<number | undefined>(undefined);
    const usagePerGuest = useSignal<number | undefined>(undefined);

    // Stacking
    const isCombinable = useSignal(false);
    const priority = useSignal(0);

    // State
    const isSubmitting = useSignal(false);

    // Generate random promo code
    const generateCode = $(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        code.value = result;
    });

    // Toggle day of week
    const toggleDay = $((day: number) => {
        const index = validDaysOfWeek.days.indexOf(day);
        if (index > -1) {
            validDaysOfWeek.days.splice(index, 1);
        } else {
            validDaysOfWeek.days.push(day);
        }
    });

    // Toggle service type
    const toggleServiceType = $((type: ServiceType) => {
        if (!appliesTo.service_types) appliesTo.service_types = [];
        const index = appliesTo.service_types.indexOf(type);
        if (index > -1) {
            appliesTo.service_types.splice(index, 1);
        } else {
            appliesTo.service_types.push(type);
        }
    });

    // Toggle resource
    const toggleResource = $((resourceId: string) => {
        if (!appliesTo.resource_ids) appliesTo.resource_ids = [];
        const index = appliesTo.resource_ids.indexOf(resourceId);
        if (index > -1) {
            appliesTo.resource_ids.splice(index, 1);
        } else {
            appliesTo.resource_ids.push(resourceId);
        }
    });

    // Handle form submission
    const handleSubmit = $(async () => {
        isSubmitting.value = true;

        const formData = {
            code: !isAutomatic.value && code.value ? code.value : undefined,
            name: name.value,
            description: description.value || undefined,
            discount_type: discountType.value,
            discount_value: discountValue.value,
            max_discount_amount: maxDiscountAmount.value || undefined,
            applies_to: (appliesTo.service_types?.length || appliesTo.resource_ids?.length) ? {
                service_types: appliesTo.service_types?.length ? appliesTo.service_types : undefined,
                resource_ids: appliesTo.resource_ids?.length ? appliesTo.resource_ids : undefined,
            } : undefined,
            min_nights: minNights.value || undefined,
            min_amount: minAmount.value || undefined,
            min_guests: minGuests.value || undefined,
            booking_start_date: bookingStartDate.value || undefined,
            booking_end_date: bookingEndDate.value || undefined,
            stay_start_date: stayStartDate.value || undefined,
            stay_end_date: stayEndDate.value || undefined,
            valid_days_of_week: validDaysOfWeek.days.length > 0 ? validDaysOfWeek.days : undefined,
            usage_limit: usageLimit.value || undefined,
            usage_per_guest: usagePerGuest.value || undefined,
            is_combinable: isCombinable.value,
            priority: priority.value,
            is_automatic: isAutomatic.value,
        };

        const result = await createAction.submit(formData);

        if (result.value.success) {
            nav('/vendor/discounts');
        }

        isSubmitting.value = false;
    });

    const serviceTypes: ServiceType[] = ['accommodation', 'tour', 'transfer', 'rental', 'activity'];

    return (
        <div class="p-6 max-w-4xl mx-auto">
            {/* Page Header */}
            <div class="flex items-center gap-4 mb-6">
                <Link href="/vendor/discounts" class="btn btn-ghost btn-sm btn-square">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 class="text-2xl font-bold">Create Discount</h1>
                    <p class="text-base-content/70">Set up a new discount or promotion</p>
                </div>
            </div>

            {createAction.value?.success === false && (
                <div class="alert alert-error mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{createAction.value.error_message || 'Failed to create discount'}</span>
                </div>
            )}

            <div class="space-y-6">
                {/* Basic Info Section */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h2 class="card-title text-lg">Basic Information</h2>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Discount Name *</span>
                            </label>
                            <input
                                type="text"
                                class="input input-bordered"
                                placeholder="e.g., Summer Special 20% Off"
                                value={name.value}
                                onInput$={(e) => name.value = (e.target as HTMLInputElement).value}
                                required
                            />
                        </div>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Description</span>
                            </label>
                            <textarea
                                class="textarea textarea-bordered h-20"
                                placeholder="Describe what this discount offers..."
                                value={description.value}
                                onInput$={(e) => description.value = (e.target as HTMLTextAreaElement).value}
                            ></textarea>
                        </div>

                        <div class="form-control mt-4">
                            <label class="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    class="toggle toggle-accent"
                                    checked={isAutomatic.value}
                                    onChange$={(e) => isAutomatic.value = (e.target as HTMLInputElement).checked}
                                />
                                <div>
                                    <span class="label-text font-medium">Automatic Discount</span>
                                    <p class="text-xs text-base-content/50">
                                        Applied automatically when conditions are met (no code required)
                                    </p>
                                </div>
                            </label>
                        </div>

                        {!isAutomatic.value && (
                            <div class="form-control mt-4">
                                <label class="label">
                                    <span class="label-text">Promo Code</span>
                                </label>
                                <div class="flex gap-2">
                                    <input
                                        type="text"
                                        class="input input-bordered flex-1 font-mono uppercase"
                                        placeholder="e.g., SUMMER20"
                                        value={code.value}
                                        onInput$={(e) => code.value = (e.target as HTMLInputElement).value.toUpperCase()}
                                    />
                                    <button type="button" class="btn btn-outline" onClick$={generateCode}>
                                        Generate
                                    </button>
                                </div>
                                <label class="label">
                                    <span class="label-text-alt">Customers will enter this code at checkout</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Discount Value Section */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h2 class="card-title text-lg">Discount Value</h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Discount Type *</span>
                                </label>
                                <select
                                    class="select select-bordered"
                                    value={discountType.value}
                                    onChange$={(e) => discountType.value = (e.target as HTMLSelectElement).value as DiscountType}
                                >
                                    {Object.entries(discountTypeLabels).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">
                                        {discountType.value === 'percentage' ? 'Percentage *' :
                                         discountType.value === 'fixed' ? 'Amount *' :
                                         discountType.value === 'free_nights' ? 'Number of Nights *' :
                                         'Value *'}
                                    </span>
                                </label>
                                <div class="input-group">
                                    {discountType.value === 'fixed' && (
                                        <span>$</span>
                                    )}
                                    <input
                                        type="number"
                                        class="input input-bordered w-full"
                                        min={0}
                                        step={discountType.value === 'percentage' ? 1 : 0.01}
                                        max={discountType.value === 'percentage' ? 100 : undefined}
                                        value={discountValue.value}
                                        onInput$={(e) => discountValue.value = parseFloat((e.target as HTMLInputElement).value) || 0}
                                    />
                                    {discountType.value === 'percentage' && (
                                        <span>%</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {discountType.value === 'percentage' && (
                            <div class="form-control mt-4">
                                <label class="label">
                                    <span class="label-text">Maximum Discount Amount</span>
                                </label>
                                <div class="input-group">
                                    <span>$</span>
                                    <input
                                        type="number"
                                        class="input input-bordered w-full"
                                        placeholder="No limit"
                                        min={0}
                                        step={0.01}
                                        value={maxDiscountAmount.value || ''}
                                        onInput$={(e) => {
                                            const val = (e.target as HTMLInputElement).value;
                                            maxDiscountAmount.value = val ? parseFloat(val) : undefined;
                                        }}
                                    />
                                </div>
                                <label class="label">
                                    <span class="label-text-alt">Cap the discount amount regardless of percentage</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Applicability Section */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h2 class="card-title text-lg">Applicability</h2>
                        <p class="text-sm text-base-content/70 mb-4">
                            Leave empty to apply to all services and resources
                        </p>

                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Service Types</span>
                            </label>
                            <div class="flex flex-wrap gap-2">
                                {serviceTypes.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        class={`btn btn-sm ${appliesTo.service_types?.includes(type) ? 'btn-primary' : 'btn-outline'}`}
                                        onClick$={() => toggleServiceType(type)}
                                    >
                                        <span class="capitalize">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(resources.value as VendorResource[]).length > 0 && (
                            <div class="form-control mt-4">
                                <label class="label">
                                    <span class="label-text">Specific Resources</span>
                                </label>
                                <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                                    {(resources.value as VendorResource[]).map((resource) => (
                                        <button
                                            key={resource.id}
                                            type="button"
                                            class={`btn btn-sm ${appliesTo.resource_ids?.includes(resource.id) ? 'btn-primary' : 'btn-outline'}`}
                                            onClick$={() => toggleResource(resource.id)}
                                        >
                                            {resource.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div class="divider">Minimum Requirements</div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Min. Nights</span>
                                </label>
                                <input
                                    type="number"
                                    class="input input-bordered"
                                    placeholder="No minimum"
                                    min={0}
                                    value={minNights.value || ''}
                                    onInput$={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        minNights.value = val ? parseInt(val) : undefined;
                                    }}
                                />
                            </div>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Min. Amount ($)</span>
                                </label>
                                <input
                                    type="number"
                                    class="input input-bordered"
                                    placeholder="No minimum"
                                    min={0}
                                    step={0.01}
                                    value={minAmount.value || ''}
                                    onInput$={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        minAmount.value = val ? parseFloat(val) : undefined;
                                    }}
                                />
                            </div>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Min. Guests</span>
                                </label>
                                <input
                                    type="number"
                                    class="input input-bordered"
                                    placeholder="No minimum"
                                    min={0}
                                    value={minGuests.value || ''}
                                    onInput$={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        minGuests.value = val ? parseInt(val) : undefined;
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Validity Section */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h2 class="card-title text-lg">Validity Period</h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 class="font-medium mb-2">Booking Window</h3>
                                <p class="text-xs text-base-content/50 mb-3">When customers can book using this discount</p>
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text text-xs">Start Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            class="input input-bordered input-sm"
                                            value={bookingStartDate.value}
                                            onInput$={(e) => bookingStartDate.value = (e.target as HTMLInputElement).value}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text text-xs">End Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            class="input input-bordered input-sm"
                                            value={bookingEndDate.value}
                                            onInput$={(e) => bookingEndDate.value = (e.target as HTMLInputElement).value}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-medium mb-2">Stay Dates</h3>
                                <p class="text-xs text-base-content/50 mb-3">When the stay must occur</p>
                                <div class="grid grid-cols-2 gap-2">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text text-xs">Start Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            class="input input-bordered input-sm"
                                            value={stayStartDate.value}
                                            onInput$={(e) => stayStartDate.value = (e.target as HTMLInputElement).value}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text text-xs">End Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            class="input input-bordered input-sm"
                                            value={stayEndDate.value}
                                            onInput$={(e) => stayEndDate.value = (e.target as HTMLInputElement).value}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-control mt-4">
                            <label class="label">
                                <span class="label-text">Valid Days of Week</span>
                            </label>
                            <div class="flex flex-wrap gap-2">
                                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        class={`btn btn-sm ${validDaysOfWeek.days.includes(day) ? 'btn-primary' : 'btn-outline'}`}
                                        onClick$={() => toggleDay(day)}
                                    >
                                        {dayOfWeekShortLabels[day]}
                                    </button>
                                ))}
                            </div>
                            <label class="label">
                                <span class="label-text-alt">Leave empty to apply on all days</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Limits Section */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h2 class="card-title text-lg">Usage Limits</h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Total Usage Limit</span>
                                </label>
                                <input
                                    type="number"
                                    class="input input-bordered"
                                    placeholder="Unlimited"
                                    min={0}
                                    value={usageLimit.value || ''}
                                    onInput$={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        usageLimit.value = val ? parseInt(val) : undefined;
                                    }}
                                />
                                <label class="label">
                                    <span class="label-text-alt">Maximum times this discount can be used</span>
                                </label>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Usage Per Guest</span>
                                </label>
                                <input
                                    type="number"
                                    class="input input-bordered"
                                    placeholder="Unlimited"
                                    min={0}
                                    value={usagePerGuest.value || ''}
                                    onInput$={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        usagePerGuest.value = val ? parseInt(val) : undefined;
                                    }}
                                />
                                <label class="label">
                                    <span class="label-text-alt">Maximum times per guest</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stacking Section */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h2 class="card-title text-lg">Stacking Rules</h2>

                        <div class="form-control">
                            <label class="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    class="checkbox checkbox-primary"
                                    checked={isCombinable.value}
                                    onChange$={(e) => isCombinable.value = (e.target as HTMLInputElement).checked}
                                />
                                <div>
                                    <span class="label-text font-medium">Allow combining with other discounts</span>
                                    <p class="text-xs text-base-content/50">
                                        Can be used together with other active discounts
                                    </p>
                                </div>
                            </label>
                        </div>

                        {isAutomatic.value && (
                            <div class="form-control mt-4">
                                <label class="label">
                                    <span class="label-text">Priority</span>
                                </label>
                                <input
                                    type="number"
                                    class="input input-bordered w-32"
                                    min={0}
                                    value={priority.value}
                                    onInput$={(e) => priority.value = parseInt((e.target as HTMLInputElement).value) || 0}
                                />
                                <label class="label">
                                    <span class="label-text-alt">Higher priority discounts are applied first (for automatic discounts)</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div class="flex justify-end gap-3">
                    <Link href="/vendor/discounts" class="btn btn-ghost">
                        Cancel
                    </Link>
                    <button
                        type="button"
                        class="btn btn-primary"
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
                                Create Discount
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: "New Discount | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "Set up a new discount or promotion",
        },
    ],
};
