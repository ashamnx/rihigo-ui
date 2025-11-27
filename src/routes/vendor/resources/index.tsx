// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, Link, useNavigate } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { EmptyState } from '~/components/vendor/shared/EmptyState';
import { FilterBar, type FilterDefinition } from '~/components/vendor/shared/FilterBar';
import { ActionDropdown, type Action } from '~/components/vendor/shared/ActionDropdown';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type VendorResource,
    type ResourceFilters,
    serviceTypeLabels,
    resourceTypeLabels,
    resourceStatusLabels,
} from '~/types/resource';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

interface ResourceListResponse {
    success: boolean;
    data: VendorResource[];
    total: number;
    page: number;
    limit: number;
}

export const useResourcesLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const url = requestEvent.url;
            const filters: ResourceFilters = {
                search: url.searchParams.get('search') || undefined,
                service_type: url.searchParams.get('service_type') as ResourceFilters['service_type'] || undefined,
                resource_type: url.searchParams.get('resource_type') as ResourceFilters['resource_type'] || undefined,
                status: url.searchParams.get('status') as ResourceFilters['status'] || undefined,
                page: parseInt(url.searchParams.get('page') || '1'),
                limit: parseInt(url.searchParams.get('limit') || '20'),
            };

            const response = await apiClient.vendorPortal.resources?.list(token, filters);
            return response as ResourceListResponse;
        } catch (error) {
            console.error('Failed to load resources:', error);
            return {
                success: false,
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            };
        }
    });
});

export default component$(() => {
    const resourcesData = useResourcesLoader();
    const navigate = useNavigate();

    const filters = useSignal<Record<string, string>>({});
    const searchValue = useSignal('');
    const selectedResource = useSignal<VendorResource | null>(null);

    const resources = resourcesData.value?.data || [];
    const total = resourcesData.value?.total || 0;

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'service_type',
            label: 'Service Type',
            type: 'select',
            options: [
                { value: 'accommodation', label: 'Accommodation' },
                { value: 'transfer', label: 'Transfer' },
                { value: 'rental', label: 'Rental' },
                { value: 'tour', label: 'Tour' },
                { value: 'activity', label: 'Activity' },
            ],
        },
        {
            key: 'resource_type',
            label: 'Type',
            type: 'select',
            options: [
                { value: 'room', label: 'Room' },
                { value: 'vehicle', label: 'Vehicle' },
                { value: 'equipment', label: 'Equipment' },
                { value: 'boat', label: 'Boat' },
            ],
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'available', label: 'Available' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'retired', label: 'Retired' },
            ],
        },
    ];

    const handleFilterChange = $((key: string, value: string) => {
        filters.value = { ...filters.value, [key]: value };
        applyFilters();
    });

    const handleSearch = $((value: string) => {
        searchValue.value = value;
        applyFilters();
    });

    const handleReset = $(() => {
        filters.value = {};
        searchValue.value = '';
        navigate('/vendor/resources');
    });

    const applyFilters = $(() => {
        const params = new URLSearchParams();
        if (searchValue.value) params.set('search', searchValue.value);
        Object.entries(filters.value).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const queryString = params.toString();
        navigate(`/vendor/resources${queryString ? `?${queryString}` : ''}`);
    });

    const getResourceActions = $((resource: VendorResource): Action[] => {
        const actions: Action[] = [
            {
                label: 'View Details',
                icon: 'view',
                onClick$: $(() => navigate(`/vendor/resources/${resource.id}`)),
            },
            {
                label: 'Edit',
                icon: 'edit',
                onClick$: $(() => navigate(`/vendor/resources/${resource.id}?edit=true`)),
            },
            {
                label: 'Manage Availability',
                icon: 'calendar',
                onClick$: $(() => navigate(`/vendor/resources/${resource.id}/availability`)),
            },
        ];

        if (resource.status !== 'retired') {
            actions.push({
                label: resource.status === 'maintenance' ? 'Mark Available' : 'Set Maintenance',
                icon: resource.status === 'maintenance' ? 'check' : 'settings',
                dividerBefore: true,
                onClick$: $(() => {
                    selectedResource.value = resource;
                    showModal('status-change-modal');
                }),
            });
        }

        if (resource.status !== 'retired') {
            actions.push({
                label: 'Retire Resource',
                icon: 'delete',
                danger: true,
                onClick$: $(() => {
                    selectedResource.value = resource;
                    showModal('retire-resource-modal');
                }),
            });
        }

        return actions;
    });

    const handleStatusChange = $(async () => {
        if (!selectedResource.value) return;
        console.log('Changing status for resource:', selectedResource.value.id);
        navigate('/vendor/resources', { forceReload: true });
    });

    const handleRetire = $(async () => {
        if (!selectedResource.value) return;
        console.log('Retiring resource:', selectedResource.value.id);
        navigate('/vendor/resources', { forceReload: true });
    });

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
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

    const getServiceTypeIcon = (serviceType: string) => {
        switch (serviceType) {
            case 'accommodation':
                return (
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                );
            case 'transfer':
                return (
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                );
            case 'rental':
                return (
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                );
            default:
                return (
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                    </svg>
                );
        }
    };

    // Calculate stats
    const availableCount = resources.filter((r) => r.status === 'available').length;
    const maintenanceCount = resources.filter((r) => r.status === 'maintenance').length;
    const accommodationCount = resources.filter((r) => r.service_type === 'accommodation').length;

    return (
        <div>
            <PageHeader
                title="Resources"
                subtitle={`${total} resource${total !== 1 ? 's' : ''} total`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Resources' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/resources/new" class="btn btn-primary btn-sm">
                    <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Resource
                </Link>
            </PageHeader>

            {/* Filters */}
            <FilterBar
                filters={filterDefinitions}
                values={filters.value}
                onChange$={handleFilterChange}
                onReset$={handleReset}
                searchPlaceholder="Search by name, code..."
                onSearch$={handleSearch}
                searchValue={searchValue.value}
            />

            {/* Quick Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Total Resources</div>
                    <div class="stat-value text-lg">{total}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Available</div>
                    <div class="stat-value text-lg text-success">{availableCount}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Maintenance</div>
                    <div class="stat-value text-lg text-warning">{maintenanceCount}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Accommodations</div>
                    <div class="stat-value text-lg">{accommodationCount}</div>
                </div>
            </div>

            {/* Resource Grid/List */}
            {resources.length === 0 ? (
                <EmptyState
                    title="No resources found"
                    description="Add your first resource to manage availability and bookings."
                    icon="resource"
                >
                    <Link q:slot="action" href="/vendor/resources/new" class="btn btn-primary btn-sm">
                        Add Resource
                    </Link>
                </EmptyState>
            ) : (
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map((resource) => (
                        <div key={resource.id} class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
                            {/* Resource Image */}
                            <figure class="relative h-40 bg-base-200">
                                {resource.media && resource.media.length > 0 ? (
                                    <img
                                        src={resource.media.find(m => m.is_primary)?.url || resource.media[0].url}
                                        alt={resource.name}
                                        class="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div class="flex items-center justify-center w-full h-full text-base-content/30">
                                        {getServiceTypeIcon(resource.service_type)}
                                    </div>
                                )}
                                <div class="absolute top-2 right-2">
                                    <span class={`badge badge-sm ${getStatusBadgeClass(resource.status)}`}>
                                        {resourceStatusLabels[resource.status]}
                                    </span>
                                </div>
                                <div class="absolute top-2 left-2">
                                    <span class="badge badge-sm badge-neutral">
                                        {serviceTypeLabels[resource.service_type]}
                                    </span>
                                </div>
                            </figure>

                            <div class="card-body p-4">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="card-title text-base">
                                            <Link href={`/vendor/resources/${resource.id}`} class="hover:text-primary">
                                                {resource.name}
                                            </Link>
                                        </h3>
                                        {resource.code && (
                                            <div class="text-xs text-base-content/60 font-mono">{resource.code}</div>
                                        )}
                                    </div>
                                    <ActionDropdown actions={getResourceActions(resource)} />
                                </div>

                                <p class="text-sm text-base-content/70 line-clamp-2 mt-1">
                                    {resource.description || 'No description'}
                                </p>

                                <div class="flex flex-wrap gap-2 mt-3">
                                    <span class="badge badge-outline badge-sm">
                                        {resourceTypeLabels[resource.resource_type]}
                                    </span>
                                    <span class="badge badge-outline badge-sm">
                                        <svg class="size-3 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                        {resource.max_occupancy} guests
                                    </span>
                                </div>

                                <div class="flex justify-between items-center mt-3 pt-3 border-t border-base-200">
                                    <div class="text-lg font-bold">
                                        {formatCurrency(resource.base_price, resource.currency)}
                                        <span class="text-sm font-normal text-base-content/60">/night</span>
                                    </div>
                                    <Link
                                        href={`/vendor/resources/${resource.id}/availability`}
                                        class="btn btn-ghost btn-xs"
                                    >
                                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                        </svg>
                                        Calendar
                                    </Link>
                                </div>

                                {/* Amenities preview */}
                                {resource.amenities && resource.amenities.length > 0 && (
                                    <div class="flex items-center gap-1 mt-2 text-xs text-base-content/60">
                                        <span>
                                            {resource.amenities.slice(0, 3).map(a => a.amenity?.name).join(', ')}
                                        </span>
                                        {resource.amenities.length > 3 && (
                                            <span>+{resource.amenities.length - 3} more</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Status Change Modal */}
            <ConfirmModal
                id="status-change-modal"
                title="Change Status"
                message={`${selectedResource.value?.status === 'maintenance' ? 'Mark this resource as available?' : 'Set this resource to maintenance mode?'} This will affect its availability for bookings.`}
                confirmText={selectedResource.value?.status === 'maintenance' ? 'Mark Available' : 'Set Maintenance'}
                onConfirm$={handleStatusChange}
            />

            {/* Retire Modal */}
            <ConfirmModal
                id="retire-resource-modal"
                title="Retire Resource"
                message={`Are you sure you want to retire "${selectedResource.value?.name}"? This resource will no longer be available for bookings.`}
                confirmText="Retire"
                danger={true}
                onConfirm$={handleRetire}
            />
        </div>
    );
});
