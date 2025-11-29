// @ts-nocheck
import { component$, useSignal, useComputed$, $ } from '@builder.io/qwik';
import {
  routeAction$,
  routeLoader$,
  Form,
  Link,
  useNavigate,
  zod$,
  z,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import type { BookingCreateInput, BookingSourceType } from '~/types/booking-vendor';
import type { ServiceType } from '~/types/resource';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

const bookingSchema = z.object({
    // Source
    source_type: z.enum(['platform', 'direct', 'ota', 'agent', 'phone', 'walk_in']),
    source_name: z.string().optional(),
    external_booking_id: z.string().optional(),

    // Guest
    primary_guest_id: z.string().min(1, 'Guest is required'),
    adults: z.coerce.number().min(1, 'At least 1 adult required'),
    children: z.coerce.number().min(0).default(0),
    infants: z.coerce.number().min(0).default(0),

    // Resource/Service
    service_type: z.enum(['accommodation', 'activity', 'tour', 'transfer', 'rental', 'digital_product']),
    resource_id: z.string().optional(),
    activity_id: z.string().optional(),
    package_id: z.string().optional(),

    // Dates
    check_in_date: z.string().min(1, 'Check-in date is required'),
    check_out_date: z.string().min(1, 'Check-out date is required'),

    // Pricing
    subtotal: z.coerce.number().min(0).optional(),
    taxes: z.coerce.number().min(0).optional(),
    fees: z.coerce.number().min(0).optional(),
    total: z.coerce.number().min(0).optional(),
    currency: z.string().default('USD'),
    commission_amount: z.coerce.number().min(0).optional(),

    // Status
    status: z.enum(['pending', 'confirmed']).default('pending'),

    // Additional
    special_requests: z.string().optional(),
    internal_notes: z.string().optional(),
    tags: z.string().optional(),
});

// Load guests and resources for dropdowns
export const useFormDataLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const [guestsResponse, resourcesResponse, activitiesResponse] = await Promise.all([
                apiClient.vendorPortal.guests.list(token, { limit: 100 }),
                apiClient.vendorPortal.resources.list(token, { limit: 100 }),
                apiClient.vendorPortal.activities?.list(token, 1, 100),
            ]);

            return {
                success: true,
                guests: guestsResponse.data || [],
                resources: resourcesResponse.data || [],
                activities: activitiesResponse?.data || [],
            };
        } catch (error) {
            console.error('Failed to load form data:', error);
            return {
                success: false,
                guests: [],
                resources: [],
                activities: [],
            };
        }
    });
});

export const useCreateBooking = routeAction$(
    async (data, requestEvent) => {
        return authenticatedRequest(requestEvent, async (token) => {
            try {
                const bookingData: BookingCreateInput = {
                    source_type: data.source_type as BookingSourceType,
                    source_name: data.source_name || undefined,
                    external_booking_id: data.external_booking_id || undefined,
                    primary_guest_id: data.primary_guest_id,
                    adults: data.adults,
                    children: data.children || 0,
                    infants: data.infants || 0,
                    service_type: data.service_type as ServiceType,
                    resource_id: data.resource_id || undefined,
                    activity_id: data.activity_id || undefined,
                    package_id: data.package_id || undefined,
                    check_in_date: data.check_in_date,
                    check_out_date: data.check_out_date,
                    subtotal: data.subtotal,
                    taxes: data.taxes,
                    fees: data.fees,
                    total: data.total,
                    currency: data.currency || 'USD',
                    commission_amount: data.commission_amount,
                    status: data.status,
                    special_requests: data.special_requests || undefined,
                    internal_notes: data.internal_notes || undefined,
                    tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
                };

                const result = await apiClient.vendorPortal.bookings.create(bookingData, token);
                return { success: true, data: result };
            } catch (error) {
                console.error('Failed to create booking:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create booking',
                };
            }
        });
    },
    zod$(bookingSchema)
);

export default component$(() => {
    const formData = useFormDataLoader();
    const createAction = useCreateBooking();
    const navigate = useNavigate();
    const activeTab = useSignal<'booking' | 'pricing' | 'notes'>('booking');
    const serviceType = useSignal<ServiceType>('accommodation');

    // Redirect on success
    if (createAction.value?.success) {
        navigate('/vendor/bookings');
    }

    const guests = formData.value.guests || [];
    const resources = formData.value.resources || [];
    const activities = formData.value.activities || [];

    // Filter resources by service type
    const filteredResources = useComputed$(() => {
        return resources.filter(r => r.service_type === serviceType.value);
    });

    const handleServiceTypeChange = $((e: Event) => {
        const target = e.target as HTMLSelectElement;
        serviceType.value = target.value as ServiceType;
    });

    return (
        <div>
            <PageHeader
                title="New Booking"
                subtitle="Create a manual booking"
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Bookings', href: '/vendor/bookings' },
                    { label: 'New Booking' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/bookings" class="btn btn-ghost btn-sm">
                    Cancel
                </Link>
            </PageHeader>

            <Form action={createAction} class="max-w-4xl">
                {/* Error Message */}
                {createAction.value?.success === false && (
                    <div class="alert alert-error mb-4">
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span>{createAction.value.error}</span>
                    </div>
                )}

                {/* Tabs */}
                <div class="tabs tabs-boxed mb-6 bg-base-200">
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'booking' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'booking'}
                    >
                        Booking Details
                    </button>
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'pricing' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'pricing'}
                    >
                        Pricing
                    </button>
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'notes' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'notes'}
                    >
                        Notes
                    </button>
                </div>

                {/* Booking Details Tab */}
                <div class={activeTab.value === 'booking' ? '' : 'hidden'}>
                    {/* Source Information */}
                    <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                        <div class="card-body">
                            <h3 class="card-title text-base">Source Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Booking Source *</span>
                                    </label>
                                    <select name="source_type" class="select select-bordered" required>
                                        <option value="direct">Direct</option>
                                        <option value="platform">Platform</option>
                                        <option value="ota">OTA</option>
                                        <option value="agent">Agent</option>
                                        <option value="phone">Phone</option>
                                        <option value="walk_in">Walk-in</option>
                                    </select>
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Source Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="source_name"
                                        class="input input-bordered"
                                        placeholder="e.g., Booking.com"
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">External Booking ID</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="external_booking_id"
                                        class="input input-bordered"
                                        placeholder="External reference"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Guest Information */}
                    <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                        <div class="card-body">
                            <h3 class="card-title text-base">Guest Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="form-control md:col-span-2">
                                    <label class="label">
                                        <span class="label-text">Primary Guest *</span>
                                        <Link href="/vendor/guests/new" class="label-text-alt link link-primary">
                                            + Add New Guest
                                        </Link>
                                    </label>
                                    <select name="primary_guest_id" class="select select-bordered" required>
                                        <option value="">Select a guest</option>
                                        {guests.map((guest) => (
                                            <option key={guest.id} value={guest.id}>
                                                {guest.first_name} {guest.last_name}
                                                {guest.email && ` (${guest.email})`}
                                            </option>
                                        ))}
                                    </select>
                                    {createAction.value?.fieldErrors?.primary_guest_id && (
                                        <label class="label">
                                            <span class="label-text-alt text-error">
                                                {createAction.value.fieldErrors.primary_guest_id}
                                            </span>
                                        </label>
                                    )}
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Adults *</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="adults"
                                        class="input input-bordered"
                                        min="1"
                                        value="1"
                                        required
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Children</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="children"
                                        class="input input-bordered"
                                        min="0"
                                        value="0"
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Infants</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="infants"
                                        class="input input-bordered"
                                        min="0"
                                        value="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service Selection */}
                    <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                        <div class="card-body">
                            <h3 class="card-title text-base">Service Selection</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Service Type *</span>
                                    </label>
                                    <select
                                        name="service_type"
                                        class="select select-bordered"
                                        required
                                        onChange$={handleServiceTypeChange}
                                    >
                                        <option value="accommodation">Accommodation</option>
                                        <option value="activity">Activity</option>
                                        <option value="tour">Tour</option>
                                        <option value="transfer">Transfer</option>
                                        <option value="rental">Rental</option>
                                        <option value="digital_product">Digital Product</option>
                                    </select>
                                </div>

                                {serviceType.value === 'accommodation' && (
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Room/Unit</span>
                                        </label>
                                        <select name="resource_id" class="select select-bordered">
                                            <option value="">Select room/unit</option>
                                            {filteredResources.value.map((resource) => (
                                                <option key={resource.id} value={resource.id}>
                                                    {resource.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {['activity', 'tour', 'transfer'].includes(serviceType.value) && (
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Activity/Tour</span>
                                        </label>
                                        <select name="activity_id" class="select select-bordered">
                                            <option value="">Select activity</option>
                                            {activities.map((activity) => (
                                                <option key={activity.id} value={activity.id}>
                                                    {activity.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Dates</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Check-in Date *</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="check_in_date"
                                        class="input input-bordered"
                                        required
                                    />
                                    {createAction.value?.fieldErrors?.check_in_date && (
                                        <label class="label">
                                            <span class="label-text-alt text-error">
                                                {createAction.value.fieldErrors.check_in_date}
                                            </span>
                                        </label>
                                    )}
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Check-out Date *</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="check_out_date"
                                        class="input input-bordered"
                                        required
                                    />
                                    {createAction.value?.fieldErrors?.check_out_date && (
                                        <label class="label">
                                            <span class="label-text-alt text-error">
                                                {createAction.value.fieldErrors.check_out_date}
                                            </span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Tab */}
                <div class={activeTab.value === 'pricing' ? '' : 'hidden'}>
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Pricing Details</h3>
                            <div class="alert alert-info mb-4">
                                <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                                <span>Leave empty to auto-calculate based on selected resource/activity rates.</span>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <span class="label-text">Status</span>
                                    </label>
                                    <select name="status" class="select select-bordered">
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                    </select>
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Subtotal</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="subtotal"
                                        class="input input-bordered"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Taxes</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="taxes"
                                        class="input input-bordered"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Fees</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="fees"
                                        class="input input-bordered"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Total</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="total"
                                        class="input input-bordered"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div class="form-control md:col-span-2">
                                    <label class="label">
                                        <span class="label-text">Commission (if from OTA/Agent)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="commission_amount"
                                        class="input input-bordered"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Tab */}
                <div class={activeTab.value === 'notes' ? '' : 'hidden'}>
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Additional Information</h3>
                            <div class="grid grid-cols-1 gap-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Tags</span>
                                        <span class="label-text-alt">Comma-separated</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        class="input input-bordered"
                                        placeholder="VIP, honeymoon, anniversary"
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Special Requests</span>
                                    </label>
                                    <textarea
                                        name="special_requests"
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Guest special requests..."
                                    ></textarea>
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Internal Notes</span>
                                    </label>
                                    <textarea
                                        name="internal_notes"
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Internal notes (not visible to guest)..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div class="flex justify-end gap-2 mt-6">
                    <Link href="/vendor/bookings" class="btn btn-ghost">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={createAction.isRunning}
                    >
                        {createAction.isRunning && <span class="loading loading-spinner loading-sm"></span>}
                        Create Booking
                    </button>
                </div>
            </Form>
        </div>
    );
});

export const head: DocumentHead = {
  title: 'Add Bookings | Vendor Portal',
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
};
