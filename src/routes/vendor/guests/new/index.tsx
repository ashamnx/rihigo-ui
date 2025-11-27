// @ts-nocheck
import { component$, useSignal } from '@builder.io/qwik';
import { routeAction$, Form, Link, useNavigate, zod$, z } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import type { GuestCreateInput } from '~/types/guest';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

const guestSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    nationality: z.string().optional(),
    country_of_residence: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    preferred_language: z.string().optional(),
    id_type: z.enum(['passport', 'national_id', 'driver_license']).optional(),
    id_number: z.string().optional(),
    id_expiry_date: z.string().optional(),
    notes: z.string().optional(),
    tags: z.string().optional(), // comma-separated
    source_type: z.enum(['direct', 'platform', 'ota', 'agent']).default('direct'),
    source_name: z.string().optional(),
});

export const useCreateGuest = routeAction$(
    async (data, requestEvent) => {
        return authenticatedRequest(requestEvent, async (token) => {
            try {
                const guestData: GuestCreateInput = {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email || undefined,
                    phone: data.phone || undefined,
                    nationality: data.nationality || undefined,
                    country_of_residence: data.country_of_residence || undefined,
                    date_of_birth: data.date_of_birth || undefined,
                    gender: data.gender || undefined,
                    preferred_language: data.preferred_language || undefined,
                    id_type: data.id_type || undefined,
                    id_number: data.id_number || undefined,
                    id_expiry_date: data.id_expiry_date || undefined,
                    notes: data.notes || undefined,
                    tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
                    source_type: data.source_type,
                    source_name: data.source_name || undefined,
                };

                const result = await apiClient.vendorPortal.guests?.create(guestData, token);
                return { success: true, data: result };
            } catch (error) {
                console.error('Failed to create guest:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create guest',
                };
            }
        });
    },
    zod$(guestSchema)
);

export default component$(() => {
    const createAction = useCreateGuest();
    const navigate = useNavigate();
    const activeTab = useSignal<'personal' | 'contact' | 'identification' | 'preferences'>('personal');

    // Redirect on success
    if (createAction.value?.success) {
        navigate('/vendor/guests');
    }

    return (
        <div>
            <PageHeader
                title="Add Guest"
                subtitle="Create a new guest profile"
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Guests', href: '/vendor/guests' },
                    { label: 'Add Guest' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/guests" class="btn btn-ghost btn-sm">
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
                        class={`tab ${activeTab.value === 'personal' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'personal'}
                    >
                        Personal Info
                    </button>
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'contact' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'contact'}
                    >
                        Contact
                    </button>
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'identification' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'identification'}
                    >
                        Identification
                    </button>
                    <button
                        type="button"
                        class={`tab ${activeTab.value === 'preferences' ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = 'preferences'}
                    >
                        Preferences
                    </button>
                </div>

                {/* Personal Info Tab */}
                <div class={activeTab.value === 'personal' ? '' : 'hidden'}>
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Personal Information</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* First Name */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">First Name *</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        class="input input-bordered"
                                        required
                                    />
                                    {createAction.value?.fieldErrors?.first_name && (
                                        <label class="label">
                                            <span class="label-text-alt text-error">
                                                {createAction.value.fieldErrors.first_name}
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Last Name *</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        class="input input-bordered"
                                        required
                                    />
                                    {createAction.value?.fieldErrors?.last_name && (
                                        <label class="label">
                                            <span class="label-text-alt text-error">
                                                {createAction.value.fieldErrors.last_name}
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {/* Date of Birth */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Date of Birth</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        class="input input-bordered"
                                    />
                                </div>

                                {/* Gender */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Gender</span>
                                    </label>
                                    <select name="gender" class="select select-bordered">
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                {/* Nationality */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Nationality</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        class="input input-bordered"
                                        placeholder="e.g., United States"
                                    />
                                </div>

                                {/* Country of Residence */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Country of Residence</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="country_of_residence"
                                        class="input input-bordered"
                                        placeholder="e.g., United Kingdom"
                                    />
                                </div>

                                {/* Preferred Language */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Preferred Language</span>
                                    </label>
                                    <select name="preferred_language" class="select select-bordered">
                                        <option value="">Select language</option>
                                        <option value="en">English</option>
                                        <option value="es">Spanish</option>
                                        <option value="fr">French</option>
                                        <option value="de">German</option>
                                        <option value="it">Italian</option>
                                        <option value="zh">Chinese</option>
                                        <option value="ja">Japanese</option>
                                        <option value="ar">Arabic</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Tab */}
                <div class={activeTab.value === 'contact' ? '' : 'hidden'}>
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Contact Information</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Email */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Email Address</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        class="input input-bordered"
                                        placeholder="guest@example.com"
                                    />
                                    {createAction.value?.fieldErrors?.email && (
                                        <label class="label">
                                            <span class="label-text-alt text-error">
                                                {createAction.value.fieldErrors.email}
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {/* Phone */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Phone Number</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        class="input input-bordered"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </div>

                            <div class="divider">Source</div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Source Type */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Guest Source</span>
                                    </label>
                                    <select name="source_type" class="select select-bordered">
                                        <option value="direct">Direct</option>
                                        <option value="platform">Platform</option>
                                        <option value="ota">OTA</option>
                                        <option value="agent">Agent</option>
                                    </select>
                                </div>

                                {/* Source Name */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Source Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="source_name"
                                        class="input input-bordered"
                                        placeholder="e.g., Booking.com, Referral"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Identification Tab */}
                <div class={activeTab.value === 'identification' ? '' : 'hidden'}>
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Identification Documents</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ID Type */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">ID Type</span>
                                    </label>
                                    <select name="id_type" class="select select-bordered">
                                        <option value="">Select ID type</option>
                                        <option value="passport">Passport</option>
                                        <option value="national_id">National ID</option>
                                        <option value="driver_license">Driver License</option>
                                    </select>
                                </div>

                                {/* ID Number */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">ID Number</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="id_number"
                                        class="input input-bordered"
                                        placeholder="Enter ID number"
                                    />
                                </div>

                                {/* ID Expiry Date */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">ID Expiry Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="id_expiry_date"
                                        class="input input-bordered"
                                    />
                                </div>
                            </div>

                            <div class="alert alert-info mt-4">
                                <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                </svg>
                                <span>ID document upload can be done after creating the guest profile.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Tab */}
                <div class={activeTab.value === 'preferences' ? '' : 'hidden'}>
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Preferences & Notes</h3>

                            <div class="grid grid-cols-1 gap-4">
                                {/* Tags */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Tags</span>
                                        <span class="label-text-alt">Comma-separated</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        class="input input-bordered"
                                        placeholder="VIP, returning, corporate"
                                    />
                                </div>

                                {/* Notes */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Internal Notes</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        class="textarea textarea-bordered h-32"
                                        placeholder="Add any internal notes about this guest..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div class="flex justify-end gap-2 mt-6">
                    <Link href="/vendor/guests" class="btn btn-ghost">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={createAction.isRunning}
                    >
                        {createAction.isRunning && <span class="loading loading-spinner loading-sm"></span>}
                        Create Guest
                    </button>
                </div>
            </Form>
        </div>
    );
});
