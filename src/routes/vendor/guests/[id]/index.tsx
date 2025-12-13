// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link, useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { StatusBadge } from '~/components/vendor/shared/StatusBadge';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type Guest,
    type GuestHistory,
    guestSourceLabels,
    guestLoyaltyLabels,
    guestIdTypeLabels,
    getGuestFullName,
} from '~/types/guest';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

export const useGuestLoader = routeLoader$(async (requestEvent) => {
    const guestId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const guest = await apiClient.vendorPortal.guests.get(guestId, token);
            const history = await apiClient.vendorPortal.guests.getHistory(guestId, token);
            return {
                success: true,
                guest: guest as Guest,
                history: (history || []) as GuestHistory[],
            };
        } catch (error) {
            console.error('Failed to load guest:', error);
            return { success: false, guest: null, history: [] };
        }
    });
});

export const useDeleteGuest = routeAction$(async (_, requestEvent) => {
    const guestId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            await apiClient.vendorPortal.guests.delete(guestId, token);
            return { success: true };
        } catch (error) {
            console.error('Failed to delete guest:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete guest',
            };
        }
    });
});

export default component$(() => {
    const guestData = useGuestLoader();
    const deleteAction = useDeleteGuest();
    const navigate = useNavigate();
    const location = useLocation();

    // isEditMode can be used later for inline editing functionality
    const _isEditMode = useSignal(location.url.searchParams.get('edit') === 'true');
    void _isEditMode; // Silence unused variable warning

    const guest = guestData.value.guest;
    const history = guestData.value.history || [];

    // Handle delete success
    if (deleteAction.value?.success) {
        navigate('/vendor/guests');
    }

    const handleDelete = $(() => {
        showModal('delete-guest-modal');
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (!guest) {
        return (
            <div class="flex flex-col items-center justify-center py-12">
                <h2 class="text-xl font-semibold mb-2">Guest Not Found</h2>
                <p class="text-base-content/60 mb-4">The guest you're looking for doesn't exist.</p>
                <Link href="/vendor/guests" class="btn btn-primary">
                    Back to Guests
                </Link>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={getGuestFullName(guest)}
                subtitle={`Guest since ${formatDate(guest.created_at)}`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Guests', href: '/vendor/guests' },
                    { label: getGuestFullName(guest) },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    <Link href={`/vendor/guests/${guest.id}?edit=true`} class="btn btn-outline btn-sm">
                        <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                        Edit
                    </Link>
                    <button type="button" class="btn btn-error btn-sm btn-outline" onClick$={handleDelete}>
                        <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                    </button>
                </div>
            </PageHeader>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div class="lg:col-span-2 space-y-6">
                    {/* Profile Card */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <div class="flex items-start gap-4">
                                <div class="avatar placeholder">
                                    <div class="bg-neutral text-neutral-content w-16 h-16 rounded-full">
                                        <span class="text-xl">
                                            {guest.first_name.charAt(0)}{guest.last_name.charAt(0)}
                                        </span>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <h2 class="text-xl font-semibold">{getGuestFullName(guest)}</h2>
                                    <div class="flex flex-wrap items-center gap-2 mt-1">
                                        <StatusBadge status={guest.source_type} size="sm" />
                                        {guest.loyalty_tier && (
                                            <span class="badge badge-outline">
                                                {guestLoyaltyLabels[guest.loyalty_tier]}
                                            </span>
                                        )}
                                        {guest.tags?.map((tag) => (
                                            <span key={tag} class="badge badge-ghost badge-sm">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Contact Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div class="text-sm text-base-content/60">Email</div>
                                    <div class="font-medium">{guest.email || '-'}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Phone</div>
                                    <div class="font-medium">{guest.phone || '-'}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Nationality</div>
                                    <div class="font-medium">{guest.nationality || '-'}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Country of Residence</div>
                                    <div class="font-medium">{guest.country_of_residence || '-'}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Date of Birth</div>
                                    <div class="font-medium">{formatDate(guest.date_of_birth)}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-base-content/60">Preferred Language</div>
                                    <div class="font-medium">{guest.preferred_language || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Identification */}
                    {(guest.id_type || guest.id_number) && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Identification</h3>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div class="text-sm text-base-content/60">ID Type</div>
                                        <div class="font-medium">
                                            {guest.id_type ? guestIdTypeLabels[guest.id_type] : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-base-content/60">ID Number</div>
                                        <div class="font-medium font-mono">{guest.id_number || '-'}</div>
                                    </div>
                                    <div>
                                        <div class="text-sm text-base-content/60">Expiry Date</div>
                                        <div class="font-medium">{formatDate(guest.id_expiry_date)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preferences */}
                    {(guest.preferences || guest.notes) && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Preferences & Notes</h3>

                                {guest.preferences?.dietary && guest.preferences.dietary.length > 0 && (
                                    <div class="mb-3">
                                        <div class="text-sm text-base-content/60 mb-1">Dietary Requirements</div>
                                        <div class="flex flex-wrap gap-1">
                                            {guest.preferences.dietary.map((item) => (
                                                <span key={item} class="badge badge-outline">{item}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {guest.preferences?.accessibility && guest.preferences.accessibility.length > 0 && (
                                    <div class="mb-3">
                                        <div class="text-sm text-base-content/60 mb-1">Accessibility Needs</div>
                                        <div class="flex flex-wrap gap-1">
                                            {guest.preferences.accessibility.map((item) => (
                                                <span key={item} class="badge badge-outline">{item}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {guest.preferences?.room && guest.preferences.room.length > 0 && (
                                    <div class="mb-3">
                                        <div class="text-sm text-base-content/60 mb-1">Room Preferences</div>
                                        <div class="flex flex-wrap gap-1">
                                            {guest.preferences.room.map((item) => (
                                                <span key={item} class="badge badge-outline">{item}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {guest.notes && (
                                    <div>
                                        <div class="text-sm text-base-content/60 mb-1">Internal Notes</div>
                                        <div class="bg-base-200 p-3 rounded-lg text-sm">{guest.notes}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Activity History */}
                    {history.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Activity History</h3>
                                <ul class="timeline timeline-vertical timeline-compact">
                                    {history.slice(0, 10).map((item, index) => (
                                        <li key={item.id}>
                                            {index !== 0 && <hr />}
                                            <div class="timeline-start text-xs text-base-content/60">
                                                {formatDateTime(item.created_at)}
                                            </div>
                                            <div class="timeline-middle">
                                                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div class="timeline-end timeline-box">
                                                <span class="font-medium capitalize">{item.action}</span>
                                                {item.changed_by && (
                                                    <span class="text-xs text-base-content/60 ml-1">
                                                        by {item.changed_by}
                                                    </span>
                                                )}
                                            </div>
                                            {index !== history.length - 1 && <hr />}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div class="space-y-6">
                    {/* Stats */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Statistics</h3>
                            <div class="stats stats-vertical shadow-none">
                                <div class="stat px-0">
                                    <div class="stat-title">Total Bookings</div>
                                    <div class="stat-value text-2xl">{guest.total_bookings}</div>
                                </div>
                                <div class="stat px-0">
                                    <div class="stat-title">Total Spend</div>
                                    <div class="stat-value text-2xl">{formatCurrency(guest.total_spend)}</div>
                                </div>
                                <div class="stat px-0">
                                    <div class="stat-title">First Visit</div>
                                    <div class="stat-value text-lg">{formatDate(guest.first_visit_at)}</div>
                                </div>
                                <div class="stat px-0">
                                    <div class="stat-title">Last Visit</div>
                                    <div class="stat-value text-lg">{formatDate(guest.last_visit_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Source Info */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Source</h3>
                            <div class="space-y-2">
                                <div>
                                    <div class="text-sm text-base-content/60">Type</div>
                                    <div class="font-medium">{guestSourceLabels[guest.source_type]}</div>
                                </div>
                                {guest.source_name && (
                                    <div>
                                        <div class="text-sm text-base-content/60">Name</div>
                                        <div class="font-medium">{guest.source_name}</div>
                                    </div>
                                )}
                                {guest.external_reference && (
                                    <div>
                                        <div class="text-sm text-base-content/60">External Reference</div>
                                        <div class="font-medium font-mono text-sm">{guest.external_reference}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Quick Actions</h3>
                            <div class="flex flex-col gap-2">
                                <Link
                                    href={`/vendor/bookings/new?guest_id=${guest.id}`}
                                    class="btn btn-outline btn-sm justify-start"
                                >
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Create Booking
                                </Link>
                                <Link
                                    href={`/vendor/quotations/new?guest_id=${guest.id}`}
                                    class="btn btn-outline btn-sm justify-start"
                                >
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    Create Quotation
                                </Link>
                                <Link
                                    href={`/vendor/bookings?guest_id=${guest.id}`}
                                    class="btn btn-outline btn-sm justify-start"
                                >
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                                    </svg>
                                    View Bookings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Form action={deleteAction}>
                <ConfirmModal
                    id="delete-guest-modal"
                    title="Delete Guest"
                    message={`Are you sure you want to delete ${getGuestFullName(guest)}? This action cannot be undone and will remove all associated data.`}
                    confirmText="Delete"
                    danger={true}
                    loading={deleteAction.isRunning}
                    onConfirm$={$(() => {
                        const form = document.querySelector('form[data-action]') as HTMLFormElement;
                        form.requestSubmit();
                    })}
                />
            </Form>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Guest Details | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "View and manage guest profile details",
        },
    ],
};
