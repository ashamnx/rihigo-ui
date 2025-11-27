// @ts-nocheck
import { component$, useSignal, useComputed$, $ } from '@builder.io/qwik';
import { routeAction$, routeLoader$, Form, Link, useNavigate, zod$, z } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import {
    type ServiceType,
    type ResourceType,
    type BedType,
    type BedConfig,
    serviceTypeLabels,
    resourceTypeLabels,
    roomTypeLabels,
    viewTypeLabels,
    bedTypeLabels,
    getResourceTypesForService,
} from '~/types/resource';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

const resourceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    code: z.string().optional(),
    service_type: z.enum(['accommodation', 'tour', 'transfer', 'rental', 'activity']),
    resource_type: z.enum(['room', 'vehicle', 'equipment', 'boat']),
    max_adults: z.coerce.number().min(1, 'At least 1 adult required'),
    max_children: z.coerce.number().min(0),
    max_occupancy: z.coerce.number().min(1, 'At least 1 guest required'),
    base_price: z.coerce.number().min(0, 'Price must be 0 or greater'),
    currency: z.string().default('USD'),
    status: z.enum(['available', 'maintenance', 'retired']).default('available'),
    // Accommodation-specific
    room_type: z.enum(['standard', 'deluxe', 'suite', 'villa', 'dormitory']).optional(),
    view_type: z.enum(['ocean', 'garden', 'pool', 'city', 'mountain']).optional(),
    size_sqm: z.coerce.number().optional(),
    floor_level: z.coerce.number().optional(),
    is_smoking_allowed: z.coerce.boolean().default(false),
});

export const useAmenitiesLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            // Load available amenities for selection
            const amenities = await apiClient.vendorPortal.amenities?.list(token);
            return {
                success: true,
                amenities: amenities || [],
            };
        } catch (error) {
            console.error('Failed to load amenities:', error);
            return {
                success: false,
                amenities: [],
            };
        }
    });
});

export const useCreateResource = routeAction$(
    async (data, requestEvent) => {
        return authenticatedRequest(requestEvent, async (token) => {
            try {
                const resourceData: Record<string, unknown> = {
                    name: data.name,
                    description: data.description || undefined,
                    code: data.code || undefined,
                    service_type: data.service_type,
                    resource_type: data.resource_type,
                    max_adults: data.max_adults,
                    max_children: data.max_children || 0,
                    max_occupancy: data.max_occupancy,
                    base_price: data.base_price,
                    currency: data.currency || 'USD',
                    status: data.status || 'available',
                };

                // Add accommodation details if applicable
                if (data.service_type === 'accommodation' && data.room_type) {
                    resourceData.accommodation_details = {
                        room_type: data.room_type,
                        view_type: data.view_type || undefined,
                        size_sqm: data.size_sqm || undefined,
                        floor_level: data.floor_level || undefined,
                        is_smoking_allowed: data.is_smoking_allowed || false,
                        bed_configuration: [], // Will be set separately
                    };
                }

                const result = await apiClient.vendorPortal.resources?.create(resourceData, token);
                return { success: true, data: result };
            } catch (error) {
                console.error('Failed to create resource:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to create resource',
                };
            }
        });
    },
    zod$(resourceSchema)
);

export default component$(() => {
    useAmenitiesLoader(); // Load amenities for later use
    const createAction = useCreateResource();
    const navigate = useNavigate();

    // Form state
    const serviceType = useSignal<ServiceType>('accommodation');
    const resourceType = useSignal<ResourceType>('room');
    const maxAdults = useSignal(2);
    const maxChildren = useSignal(2);
    const bedConfigs = useSignal<BedConfig[]>([{ type: 'double', count: 1 }]);

    // Redirect on success
    if (createAction.value?.success) {
        navigate('/vendor/resources');
    }

    // Compute available resource types based on service type
    const availableResourceTypes = useComputed$(() => {
        return getResourceTypesForService(serviceType.value);
    });

    // Update resource type when service type changes
    const handleServiceTypeChange = $((e: Event) => {
        const target = e.target as HTMLSelectElement;
        serviceType.value = target.value as ServiceType;
        const types = getResourceTypesForService(serviceType.value);
        if (!types.includes(resourceType.value)) {
            resourceType.value = types[0];
        }
    });

    // Max occupancy computed
    const maxOccupancy = useComputed$(() => {
        return maxAdults.value + maxChildren.value;
    });

    // Bed configuration handlers
    const addBedConfig = $(() => {
        bedConfigs.value = [...bedConfigs.value, { type: 'single', count: 1 }];
    });

    const removeBedConfig = $((index: number) => {
        bedConfigs.value = bedConfigs.value.filter((_, i) => i !== index);
    });

    const updateBedConfig = $((index: number, field: 'type' | 'count', value: string | number) => {
        const updated = [...bedConfigs.value];
        if (field === 'type') {
            updated[index] = { ...updated[index], type: value as BedType };
        } else {
            updated[index] = { ...updated[index], count: value as number };
        }
        bedConfigs.value = updated;
    });

    return (
        <div>
            <PageHeader
                title="Add Resource"
                subtitle="Create a new resource for booking"
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Resources', href: '/vendor/resources' },
                    { label: 'Add Resource' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/resources" class="btn btn-ghost btn-sm">
                    Cancel
                </Link>
            </PageHeader>

            <Form action={createAction} class="max-w-3xl">
                {/* Error Message */}
                {createAction.value?.success === false && (
                    <div class="alert alert-error mb-4">
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span>{createAction.value.error}</span>
                    </div>
                )}

                {/* Basic Information */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Basic Information</h3>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div class="form-control md:col-span-2">
                                <label class="label">
                                    <span class="label-text">Resource Name *</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    class="input input-bordered"
                                    placeholder="e.g., Deluxe Ocean View Room, Airport Transfer Van"
                                    required
                                />
                                {createAction.value?.fieldErrors?.name && (
                                    <label class="label">
                                        <span class="label-text-alt text-error">
                                            {createAction.value.fieldErrors.name}
                                        </span>
                                    </label>
                                )}
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Resource Code</span>
                                </label>
                                <input
                                    type="text"
                                    name="code"
                                    class="input input-bordered"
                                    placeholder="e.g., DOV-101, VAN-01"
                                />
                                <label class="label">
                                    <span class="label-text-alt">Optional internal reference</span>
                                </label>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Status</span>
                                </label>
                                <select name="status" class="select select-bordered">
                                    <option value="available">Available</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>

                            <div class="form-control md:col-span-2">
                                <label class="label">
                                    <span class="label-text">Description</span>
                                </label>
                                <textarea
                                    name="description"
                                    class="textarea textarea-bordered h-24"
                                    placeholder="Describe this resource..."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service & Resource Type */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Service & Type</h3>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Service Type *</span>
                                </label>
                                <select
                                    name="service_type"
                                    class="select select-bordered"
                                    value={serviceType.value}
                                    onChange$={handleServiceTypeChange}
                                    required
                                >
                                    {Object.entries(serviceTypeLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Resource Type *</span>
                                </label>
                                <select
                                    name="resource_type"
                                    class="select select-bordered"
                                    value={resourceType.value}
                                    onChange$={(e) => resourceType.value = (e.target as HTMLSelectElement).value as ResourceType}
                                    required
                                >
                                    {availableResourceTypes.value.map((type) => (
                                        <option key={type} value={type}>
                                            {resourceTypeLabels[type]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Capacity */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Capacity</h3>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Max Adults *</span>
                                </label>
                                <input
                                    type="number"
                                    name="max_adults"
                                    class="input input-bordered"
                                    value={maxAdults.value}
                                    min="1"
                                    onInput$={(e) => maxAdults.value = parseInt((e.target as HTMLInputElement).value) || 1}
                                    required
                                />
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Max Children</span>
                                </label>
                                <input
                                    type="number"
                                    name="max_children"
                                    class="input input-bordered"
                                    value={maxChildren.value}
                                    min="0"
                                    onInput$={(e) => maxChildren.value = parseInt((e.target as HTMLInputElement).value) || 0}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Max Occupancy *</span>
                                </label>
                                <input
                                    type="number"
                                    name="max_occupancy"
                                    class="input input-bordered"
                                    value={maxOccupancy.value}
                                    min="1"
                                    required
                                />
                                <label class="label">
                                    <span class="label-text-alt">Total guests allowed</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                    <div class="card-body">
                        <h3 class="card-title text-base">Pricing</h3>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Base Price *</span>
                                </label>
                                <input
                                    type="number"
                                    name="base_price"
                                    class="input input-bordered"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                />
                                {createAction.value?.fieldErrors?.base_price && (
                                    <label class="label">
                                        <span class="label-text-alt text-error">
                                            {createAction.value.fieldErrors.base_price}
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
                        </div>
                    </div>
                </div>

                {/* Accommodation-specific fields */}
                {serviceType.value === 'accommodation' && (
                    <div class="card bg-base-100 shadow-sm border border-base-200 mb-4">
                        <div class="card-body">
                            <h3 class="card-title text-base">Accommodation Details</h3>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Room Type</span>
                                    </label>
                                    <select name="room_type" class="select select-bordered">
                                        <option value="">Select room type</option>
                                        {Object.entries(roomTypeLabels).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">View Type</span>
                                    </label>
                                    <select name="view_type" class="select select-bordered">
                                        <option value="">Select view type</option>
                                        {Object.entries(viewTypeLabels).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Size (sqm)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="size_sqm"
                                        class="input input-bordered"
                                        min="0"
                                        placeholder="e.g., 45"
                                    />
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Floor Level</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="floor_level"
                                        class="input input-bordered"
                                        placeholder="e.g., 3"
                                    />
                                </div>

                                <div class="form-control md:col-span-2">
                                    <label class="label cursor-pointer justify-start gap-3">
                                        <input
                                            type="checkbox"
                                            name="is_smoking_allowed"
                                            class="checkbox checkbox-primary"
                                            value="true"
                                        />
                                        <span class="label-text">Smoking Allowed</span>
                                    </label>
                                </div>
                            </div>

                            {/* Bed Configuration */}
                            <div class="mt-6">
                                <div class="flex justify-between items-center mb-3">
                                    <h4 class="font-medium">Bed Configuration</h4>
                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-sm"
                                        onClick$={addBedConfig}
                                    >
                                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Add Bed
                                    </button>
                                </div>

                                <div class="space-y-2">
                                    {bedConfigs.value.map((config, index) => (
                                        <div key={index} class="flex gap-2 items-center">
                                            <select
                                                class="select select-bordered select-sm flex-1"
                                                value={config.type}
                                                onChange$={(e) => updateBedConfig(index, 'type', (e.target as HTMLSelectElement).value)}
                                            >
                                                {Object.entries(bedTypeLabels).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                class="input input-bordered input-sm w-20"
                                                value={config.count}
                                                min="1"
                                                onInput$={(e) => updateBedConfig(index, 'count', parseInt((e.target as HTMLInputElement).value) || 1)}
                                            />
                                            {bedConfigs.value.length > 1 && (
                                                <button
                                                    type="button"
                                                    class="btn btn-ghost btn-sm btn-square"
                                                    onClick$={() => removeBedConfig(index)}
                                                >
                                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Buttons */}
                <div class="flex justify-end gap-2 mt-6">
                    <Link href="/vendor/resources" class="btn btn-ghost">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={createAction.isRunning}
                    >
                        {createAction.isRunning && <span class="loading loading-spinner loading-sm"></span>}
                        Create Resource
                    </button>
                </div>
            </Form>
        </div>
    );
});
