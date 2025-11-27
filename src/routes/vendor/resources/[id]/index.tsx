// @ts-nocheck
import { component$, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, useNavigate } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type VendorResource,
    serviceTypeLabels,
    resourceTypeLabels,
    resourceStatusLabels,
    roomTypeLabels,
    viewTypeLabels,
    bedTypeLabels,
} from '~/types/resource';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

export const useResourceLoader = routeLoader$(async (requestEvent) => {
    const resourceId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const resource = await apiClient.vendorPortal.resources?.get(resourceId, token);
            const ratePlans = await apiClient.vendorPortal.resources?.getRatePlans(resourceId, token);
            return {
                success: true,
                resource,
                ratePlans: ratePlans || [],
            };
        } catch (error) {
            console.error('Failed to load resource:', error);
            return {
                success: false,
                resource: null,
                ratePlans: [],
            };
        }
    });
});

export const useUpdateStatus = routeAction$(async (data, requestEvent) => {
    const resourceId = requestEvent.params.id;
    const status = data.status as string;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const result = await apiClient.vendorPortal.resources?.update(resourceId, { status }, token);
            return { success: true, data: result };
        } catch (error) {
            console.error('Failed to update status:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update status',
            };
        }
    });
});

export const useDeleteResource = routeAction$(async (data, requestEvent) => {
    const resourceId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            await apiClient.vendorPortal.resources?.delete(resourceId, token);
            return { success: true };
        } catch (error) {
            console.error('Failed to delete resource:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete resource',
            };
        }
    });
});

export default component$(() => {
    const resourceData = useResourceLoader();
    const updateStatusAction = useUpdateStatus();
    const deleteAction = useDeleteResource();
    const navigate = useNavigate();

    const resource = resourceData.value?.resource as VendorResource | null;
    const ratePlans = resourceData.value?.ratePlans || [];

    // Redirect on delete success
    if (deleteAction.value?.success) {
        navigate('/vendor/resources');
    }

    if (!resource) {
        return (
            <div class="flex flex-col items-center justify-center py-12">
                <svg class="size-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 class="text-lg font-medium mb-2">Resource Not Found</h3>
                <p class="text-base-content/60 mb-4">The resource you're looking for doesn't exist or has been removed.</p>
                <Link href="/vendor/resources" class="btn btn-primary">
                    Back to Resources
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
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'available':
                return 'badge-success';
            case 'maintenance':
                return 'badge-warning';
            case 'retired':
                return 'badge-ghost';
            default:
                return 'badge-ghost';
        }
    };

    const handleSetMaintenance = $(() => {
        showModal('maintenance-modal');
    });

    const handleSetAvailable = $(() => {
        showModal('available-modal');
    });

    const handleRetire = $(() => {
        showModal('retire-modal');
    });

    const confirmMaintenance = $(async () => {
        await updateStatusAction.submit({ status: 'maintenance' });
        navigate('/vendor/resources/' + resource.id, { forceReload: true });
    });

    const confirmAvailable = $(async () => {
        await updateStatusAction.submit({ status: 'available' });
        navigate('/vendor/resources/' + resource.id, { forceReload: true });
    });

    const confirmRetire = $(async () => {
        await deleteAction.submit({});
    });

    return (
        <div>
            <PageHeader
                title={resource.name}
                subtitle={`${serviceTypeLabels[resource.service_type]} - ${resourceTypeLabels[resource.resource_type]}`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Resources', href: '/vendor/resources' },
                    { label: resource.name },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    <Link
                        href={`/vendor/resources/${resource.id}/availability`}
                        class="btn btn-ghost btn-sm"
                    >
                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        Availability
                    </Link>
                    <Link
                        href={`/vendor/resources/${resource.id}?edit=true`}
                        class="btn btn-primary btn-sm"
                    >
                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit
                    </Link>
                </div>
            </PageHeader>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div class="lg:col-span-2 space-y-6">
                    {/* Status Banner */}
                    <div class={`alert ${
                        resource.status === 'available' ? 'alert-success' :
                        resource.status === 'maintenance' ? 'alert-warning' :
                        'alert-info'
                    }`}>
                        <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            {resource.status === 'available' ? (
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : resource.status === 'maintenance' ? (
                                <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                            ) : (
                                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            )}
                        </svg>
                        <div>
                            <h3 class="font-bold">{resourceStatusLabels[resource.status]}</h3>
                            <div class="text-sm">
                                {resource.status === 'available' && 'This resource is available for bookings.'}
                                {resource.status === 'maintenance' && 'This resource is currently under maintenance and not available for bookings.'}
                                {resource.status === 'retired' && 'This resource has been retired and is no longer available.'}
                            </div>
                        </div>
                        {resource.status !== 'retired' && (
                            <div class="flex gap-2">
                                {resource.status === 'available' ? (
                                    <button class="btn btn-sm btn-warning" onClick$={handleSetMaintenance}>
                                        Set Maintenance
                                    </button>
                                ) : (
                                    <button class="btn btn-sm btn-success" onClick$={handleSetAvailable}>
                                        Mark Available
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resource Image Gallery */}
                    {resource.media && resource.media.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <figure class="h-64">
                                <img
                                    src={resource.media.find(m => m.is_primary)?.url || resource.media[0].url}
                                    alt={resource.name}
                                    class="w-full h-full object-cover"
                                />
                            </figure>
                            {resource.media.length > 1 && (
                                <div class="flex gap-2 p-4 overflow-x-auto">
                                    {resource.media.map((media) => (
                                        <img
                                            key={media.id}
                                            src={media.url}
                                            alt={media.alt_text || resource.name}
                                            class="w-20 h-20 object-cover rounded-lg"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Basic Details */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Resource Details</h3>

                            <div class="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <div class="text-sm text-base-content/60">Service Type</div>
                                    <div class="font-medium">{serviceTypeLabels[resource.service_type]}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Resource Type</div>
                                    <div class="font-medium">{resourceTypeLabels[resource.resource_type]}</div>
                                </div>
                                {resource.code && (
                                    <div>
                                        <div class="text-sm text-base-content/60">Code</div>
                                        <div class="font-medium font-mono">{resource.code}</div>
                                    </div>
                                )}
                                <div>
                                    <div class="text-sm text-base-content/60">Status</div>
                                    <span class={`badge ${getStatusBadgeClass(resource.status)}`}>
                                        {resourceStatusLabels[resource.status]}
                                    </span>
                                </div>
                            </div>

                            {resource.description && (
                                <div class="mt-4">
                                    <div class="text-sm text-base-content/60 mb-1">Description</div>
                                    <p class="whitespace-pre-wrap">{resource.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Capacity & Pricing */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Capacity & Pricing</h3>

                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div class="text-center p-4 bg-base-200/50 rounded-lg">
                                    <div class="text-2xl font-bold">{resource.max_adults}</div>
                                    <div class="text-sm text-base-content/60">Max Adults</div>
                                </div>
                                <div class="text-center p-4 bg-base-200/50 rounded-lg">
                                    <div class="text-2xl font-bold">{resource.max_children}</div>
                                    <div class="text-sm text-base-content/60">Max Children</div>
                                </div>
                                <div class="text-center p-4 bg-base-200/50 rounded-lg">
                                    <div class="text-2xl font-bold">{resource.max_occupancy}</div>
                                    <div class="text-sm text-base-content/60">Max Occupancy</div>
                                </div>
                                <div class="text-center p-4 bg-primary/10 rounded-lg">
                                    <div class="text-2xl font-bold text-primary">
                                        {formatCurrency(resource.base_price, resource.currency)}
                                    </div>
                                    <div class="text-sm text-base-content/60">Base Price/Night</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Accommodation Details */}
                    {resource.service_type === 'accommodation' && resource.accommodation_details && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Accommodation Details</h3>

                                <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                    {resource.accommodation_details.room_type && (
                                        <div>
                                            <div class="text-sm text-base-content/60">Room Type</div>
                                            <div class="font-medium">
                                                {roomTypeLabels[resource.accommodation_details.room_type]}
                                            </div>
                                        </div>
                                    )}
                                    {resource.accommodation_details.view_type && (
                                        <div>
                                            <div class="text-sm text-base-content/60">View</div>
                                            <div class="font-medium">
                                                {viewTypeLabels[resource.accommodation_details.view_type]}
                                            </div>
                                        </div>
                                    )}
                                    {resource.accommodation_details.size_sqm && (
                                        <div>
                                            <div class="text-sm text-base-content/60">Size</div>
                                            <div class="font-medium">{resource.accommodation_details.size_sqm} sqm</div>
                                        </div>
                                    )}
                                    {resource.accommodation_details.floor_level !== undefined && (
                                        <div>
                                            <div class="text-sm text-base-content/60">Floor</div>
                                            <div class="font-medium">Level {resource.accommodation_details.floor_level}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div class="text-sm text-base-content/60">Smoking</div>
                                        <div class="font-medium">
                                            {resource.accommodation_details.is_smoking_allowed ? 'Allowed' : 'Not Allowed'}
                                        </div>
                                    </div>
                                </div>

                                {/* Bed Configuration */}
                                {resource.accommodation_details.bed_configuration && resource.accommodation_details.bed_configuration.length > 0 && (
                                    <div class="mt-4">
                                        <div class="text-sm text-base-content/60 mb-2">Bed Configuration</div>
                                        <div class="flex flex-wrap gap-2">
                                            {resource.accommodation_details.bed_configuration.map((bed, index) => (
                                                <span key={index} class="badge badge-outline">
                                                    {bed.count}x {bedTypeLabels[bed.type]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Amenities */}
                    {resource.amenities && resource.amenities.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Amenities</h3>

                                <div class="flex flex-wrap gap-2 mt-4">
                                    {resource.amenities.map((amenity) => (
                                        <div
                                            key={amenity.id}
                                            class={`badge ${amenity.is_included ? 'badge-success' : 'badge-outline'}`}
                                        >
                                            {amenity.amenity?.name}
                                            {!amenity.is_included && amenity.additional_cost && (
                                                <span class="ml-1">
                                                    (+{formatCurrency(amenity.additional_cost, resource.currency)})
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rate Plans */}
                    {ratePlans.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <div class="flex justify-between items-center">
                                    <h3 class="card-title text-base">Rate Plans</h3>
                                    <button class="btn btn-ghost btn-sm">
                                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Add Plan
                                    </button>
                                </div>

                                <div class="overflow-x-auto mt-4">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Discount</th>
                                                <th>Valid Period</th>
                                                <th>Stay Requirements</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ratePlans.map((plan) => (
                                                <tr key={plan.id}>
                                                    <td class="font-medium">{plan.name}</td>
                                                    <td>
                                                        {plan.discount_type === 'percentage'
                                                            ? `${plan.discount_value}%`
                                                            : formatCurrency(plan.discount_value, resource.currency)}
                                                    </td>
                                                    <td class="text-sm">
                                                        {formatDate(plan.valid_from)} - {formatDate(plan.valid_to)}
                                                    </td>
                                                    <td class="text-sm">
                                                        {plan.min_stay && `Min: ${plan.min_stay} nights`}
                                                        {plan.min_stay && plan.max_stay && ' / '}
                                                        {plan.max_stay && `Max: ${plan.max_stay} nights`}
                                                        {!plan.min_stay && !plan.max_stay && '-'}
                                                    </td>
                                                    <td>
                                                        <span class={`badge badge-sm ${plan.is_active ? 'badge-success' : 'badge-ghost'}`}>
                                                            {plan.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
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
                                <Link
                                    href={`/vendor/resources/${resource.id}/availability`}
                                    class="btn btn-outline btn-sm justify-start"
                                >
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    Manage Availability
                                </Link>
                                <Link
                                    href={`/vendor/resources/${resource.id}?edit=true`}
                                    class="btn btn-outline btn-sm justify-start"
                                >
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                    Edit Resource
                                </Link>
                                {resource.status === 'available' && (
                                    <button class="btn btn-warning btn-sm justify-start" onClick$={handleSetMaintenance}>
                                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                                        </svg>
                                        Set Maintenance
                                    </button>
                                )}
                                {resource.status === 'maintenance' && (
                                    <button class="btn btn-success btn-sm justify-start" onClick$={handleSetAvailable}>
                                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Mark Available
                                    </button>
                                )}
                                {resource.status !== 'retired' && (
                                    <button class="btn btn-error btn-sm justify-start" onClick$={handleRetire}>
                                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                        </svg>
                                        Retire Resource
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Information</h3>
                            <div class="space-y-3 mt-4 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-base-content/60">Created</span>
                                    <span>{formatDate(resource.created_at)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/60">Last Updated</span>
                                    <span>{formatDate(resource.updated_at)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-base-content/60">ID</span>
                                    <span class="font-mono text-xs">{resource.id.slice(0, 8)}...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Linked Services */}
                    {resource.services && resource.services.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Linked Services</h3>
                                <div class="space-y-2 mt-4">
                                    {resource.services.map((svc) => (
                                        <div key={svc.id} class="flex justify-between items-center p-2 bg-base-200/50 rounded-lg">
                                            <div>
                                                <div class="font-medium text-sm">{svc.service?.name}</div>
                                                {svc.is_mandatory && (
                                                    <span class="badge badge-xs badge-warning">Mandatory</span>
                                                )}
                                            </div>
                                            <div class="text-sm font-medium">
                                                {formatCurrency(svc.override_price || svc.service?.price || 0, resource.currency)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal
                id="maintenance-modal"
                title="Set Maintenance Mode"
                message="Set this resource to maintenance mode? It will no longer be available for new bookings."
                confirmText="Set Maintenance"
                onConfirm$={confirmMaintenance}
            />

            <ConfirmModal
                id="available-modal"
                title="Mark as Available"
                message="Mark this resource as available? It will be available for bookings again."
                confirmText="Mark Available"
                onConfirm$={confirmAvailable}
            />

            <ConfirmModal
                id="retire-modal"
                title="Retire Resource"
                message={`Are you sure you want to retire "${resource.name}"? This action cannot be undone and the resource will no longer be available for bookings.`}
                confirmText="Retire"
                danger={true}
                onConfirm$={confirmRetire}
            />
        </div>
    );
});
