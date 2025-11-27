// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, Link, useNavigate } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { StatusBadge } from '~/components/vendor/shared/StatusBadge';
import { EmptyState } from '~/components/vendor/shared/EmptyState';
import { FilterBar, type FilterDefinition } from '~/components/vendor/shared/FilterBar';
import { ActionDropdown, type Action } from '~/components/vendor/shared/ActionDropdown';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type Guest,
    type GuestFilters,
    guestLoyaltyLabels,
} from '~/types/guest';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

interface GuestListResponse {
    success: boolean;
    data: Guest[];
    total: number;
    page: number;
    limit: number;
}

export const useGuestsLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const url = requestEvent.url;
            const filters: GuestFilters = {
                search: url.searchParams.get('search') || undefined,
                source_type: url.searchParams.get('source_type') as GuestFilters['source_type'] || undefined,
                loyalty_tier: url.searchParams.get('loyalty_tier') as GuestFilters['loyalty_tier'] || undefined,
                page: parseInt(url.searchParams.get('page') || '1'),
                limit: parseInt(url.searchParams.get('limit') || '20'),
            };

            // API call - adjust based on actual API structure
            const response = await apiClient.vendorPortal.guests?.list(token, filters);
            return response as GuestListResponse;
        } catch (error) {
            console.error('Failed to load guests:', error);
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
    const guestsData = useGuestsLoader();
    const navigate = useNavigate();

    const filters = useSignal<Record<string, string>>({});
    const searchValue = useSignal('');
    const selectedGuest = useSignal<Guest | null>(null);

    const guests = guestsData.value?.data || [];
    const total = guestsData.value?.total || 0;

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'source_type',
            label: 'Source',
            type: 'select',
            options: [
                { value: 'direct', label: 'Direct' },
                { value: 'platform', label: 'Platform' },
                { value: 'ota', label: 'OTA' },
                { value: 'agent', label: 'Agent' },
            ],
        },
        {
            key: 'loyalty_tier',
            label: 'Loyalty Tier',
            type: 'select',
            options: [
                { value: 'bronze', label: 'Bronze' },
                { value: 'silver', label: 'Silver' },
                { value: 'gold', label: 'Gold' },
                { value: 'platinum', label: 'Platinum' },
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
        navigate('/vendor/guests');
    });

    const applyFilters = $(() => {
        const params = new URLSearchParams();
        if (searchValue.value) params.set('search', searchValue.value);
        Object.entries(filters.value).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const queryString = params.toString();
        navigate(`/vendor/guests${queryString ? `?${queryString}` : ''}`);
    });

    const getGuestActions = $((guest: Guest): Action[] => [
        {
            label: 'View Details',
            icon: 'view',
            onClick$: $(() => navigate(`/vendor/guests/${guest.id}`)),
        },
        {
            label: 'Edit',
            icon: 'edit',
            onClick$: $(() => navigate(`/vendor/guests/${guest.id}?edit=true`)),
        },
        {
            label: 'Delete',
            icon: 'delete',
            danger: true,
            dividerBefore: true,
            onClick$: $(() => {
                selectedGuest.value = guest;
                showModal('delete-guest-modal');
            }),
        },
    ]);

    const handleDeleteGuest = $(async () => {
        if (!selectedGuest.value) return;
        // API call to delete guest
        console.log('Deleting guest:', selectedGuest.value.id);
        // Refresh page after deletion
        navigate('/vendor/guests', { forceReload: true });
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div>
            <PageHeader
                title="Guests"
                subtitle={`${total} guest${total !== 1 ? 's' : ''} total`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Guests' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/guests/new" class="btn btn-primary btn-sm">
                    <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Guest
                </Link>
            </PageHeader>

            {/* Filters */}
            <FilterBar
                filters={filterDefinitions}
                values={filters.value}
                onChange$={handleFilterChange}
                onReset$={handleReset}
                searchPlaceholder="Search by name, email, phone..."
                onSearch$={handleSearch}
                searchValue={searchValue.value}
            />

            {/* Guest List */}
            {guests.length === 0 ? (
                <EmptyState
                    title="No guests found"
                    description="Add your first guest to get started with guest management."
                    icon="users"
                >
                    <Link q:slot="action" href="/vendor/guests/new" class="btn btn-primary btn-sm">
                        Add Guest
                    </Link>
                </EmptyState>
            ) : (
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {guests.map((guest) => (
                        <div key={guest.id} class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body p-4">
                                {/* Header */}
                                <div class="flex items-start justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="avatar placeholder">
                                            <div class="bg-neutral text-neutral-content w-10 h-10 rounded-full">
                                                <span class="text-sm">
                                                    {guest.first_name.charAt(0)}{guest.last_name.charAt(0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <Link
                                                href={`/vendor/guests/${guest.id}`}
                                                class="font-medium hover:text-primary"
                                            >
                                                {getGuestFullName(guest)}
                                            </Link>
                                            <div class="flex items-center gap-2 mt-0.5">
                                                <StatusBadge status={guest.source_type} size="xs" />
                                                {guest.loyalty_tier && (
                                                    <span class="badge badge-xs badge-outline">
                                                        {guestLoyaltyLabels[guest.loyalty_tier]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ActionDropdown actions={getGuestActions(guest)} />
                                </div>

                                {/* Contact Info */}
                                <div class="mt-3 space-y-1 text-sm">
                                    {guest.email && (
                                        <div class="flex items-center gap-2 text-base-content/70">
                                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                            </svg>
                                            <span class="truncate">{guest.email}</span>
                                        </div>
                                    )}
                                    {guest.phone && (
                                        <div class="flex items-center gap-2 text-base-content/70">
                                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                            </svg>
                                            <span>{guest.phone}</span>
                                        </div>
                                    )}
                                    {guest.nationality && (
                                        <div class="flex items-center gap-2 text-base-content/70">
                                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                            </svg>
                                            <span>{guest.nationality}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div class="divider my-2"></div>
                                <div class="flex justify-between text-sm">
                                    <div>
                                        <div class="text-base-content/60">Bookings</div>
                                        <div class="font-medium">{guest.total_bookings}</div>
                                    </div>
                                    <div>
                                        <div class="text-base-content/60">Total Spend</div>
                                        <div class="font-medium">{formatCurrency(guest.total_spend)}</div>
                                    </div>
                                    <div>
                                        <div class="text-base-content/60">Last Visit</div>
                                        <div class="font-medium">{formatDate(guest.last_visit_at)}</div>
                                    </div>
                                </div>

                                {/* Tags */}
                                {guest.tags && guest.tags.length > 0 && (
                                    <div class="flex flex-wrap gap-1 mt-2">
                                        {guest.tags.slice(0, 3).map((tag) => (
                                            <span key={tag} class="badge badge-xs badge-ghost">{tag}</span>
                                        ))}
                                        {guest.tags.length > 3 && (
                                            <span class="badge badge-xs badge-ghost">+{guest.tags.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                id="delete-guest-modal"
                title="Delete Guest"
                message={`Are you sure you want to delete ${selectedGuest.value ? getGuestFullName(selectedGuest.value) : 'this guest'}? This action cannot be undone.`}
                confirmText="Delete"
                danger={true}
                onConfirm$={handleDeleteGuest}
            />
        </div>
    );
});
