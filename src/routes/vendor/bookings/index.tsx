// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  Link,
  useNavigate,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { EmptyState } from '~/components/vendor/shared/EmptyState';
import { FilterBar, type FilterDefinition } from '~/components/vendor/shared/FilterBar';
import { ActionDropdown } from '~/components/vendor/shared/ActionDropdown';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type VendorBooking,
    type BookingFilters,
    bookingSourceLabels,
    bookingStatusLabels,
    paymentStatusLabels,
    bookingStatusColors,
    paymentStatusColors,
} from '~/types/booking-vendor';
import { getGuestFullName } from '~/types/guest';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

interface BookingListResponse {
    success: boolean;
    data: VendorBooking[];
    total: number;
    page: number;
    limit: number;
}

export const useBookingsLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const url = requestEvent.url;
            const filters: BookingFilters = {
                search: url.searchParams.get('search') || undefined,
                source_type: url.searchParams.get('source_type') as BookingFilters['source_type'] || undefined,
                status: url.searchParams.get('status') as BookingFilters['status'] || undefined,
                payment_status: url.searchParams.get('payment_status') as BookingFilters['payment_status'] || undefined,
                date_from: url.searchParams.get('date_from') || undefined,
                date_to: url.searchParams.get('date_to') || undefined,
                page: parseInt(url.searchParams.get('page') || '1'),
                limit: parseInt(url.searchParams.get('limit') || '20'),
            };

            const response = await apiClient.vendorPortal.bookings.list(token, filters);
            return response as BookingListResponse;
        } catch (error) {
            console.error('Failed to load bookings:', error);
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

export const useConfirmBooking = routeAction$(async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        const result = await apiClient.vendorPortal.bookings.confirm(
            data.booking_id as string,
            { notes: data.notes as string || undefined },
            token
        );
        if (!result.success) {
            return { success: false, error: result.error_message || 'Failed to confirm booking' };
        }
        return { success: true };
    });
});

export const useUpdateBookingStatus = routeAction$(async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        const result = await apiClient.vendorPortal.bookings.updateStatus(
            data.booking_id as string,
            { status: data.status as string, notes: data.notes as string || undefined },
            token
        );
        if (!result.success) {
            return { success: false, error: result.error_message || 'Failed to update booking status' };
        }
        return { success: true };
    });
});

export default component$(() => {
    const bookingsData = useBookingsLoader();
    const confirmAction = useConfirmBooking();
    const statusAction = useUpdateBookingStatus();
    const navigate = useNavigate();

    const filters = useSignal<Record<string, string>>({});
    const searchValue = useSignal('');
    const selectedBooking = useSignal<VendorBooking | null>(null);

    const bookings = bookingsData.value.data || [];
    const total = bookingsData.value.total || 0;


    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'checked_in', label: 'Checked In' },
                { value: 'checked_out', label: 'Checked Out' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'no_show', label: 'No Show' },
            ],
        },
        {
            key: 'payment_status',
            label: 'Payment',
            type: 'select',
            options: [
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'partial', label: 'Partial' },
                { value: 'paid', label: 'Paid' },
                { value: 'refunded', label: 'Refunded' },
            ],
        },
        {
            key: 'source_type',
            label: 'Source',
            type: 'select',
            options: [
                { value: 'platform', label: 'Platform' },
                { value: 'direct', label: 'Direct' },
                { value: 'ota', label: 'OTA' },
                { value: 'agent', label: 'Agent' },
                { value: 'phone', label: 'Phone' },
                { value: 'walk_in', label: 'Walk-in' },
            ],
        },
        {
            key: 'date_from',
            label: 'From',
            type: 'date',
        },
        {
            key: 'date_to',
            label: 'To',
            type: 'date',
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
        navigate('/vendor/bookings');
    });

    const applyFilters = $(() => {
        const params = new URLSearchParams();
        if (searchValue.value) params.set('search', searchValue.value);
        Object.entries(filters.value).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const queryString = params.toString();
        navigate(`/vendor/bookings${queryString ? `?${queryString}` : ''}`);
    });

    const handleConfirmBooking = $(async () => {
        if (!selectedBooking.value) return;
        await confirmAction.submit({ booking_id: selectedBooking.value.id });
        navigate('/vendor/bookings', { forceReload: true });
    });

    const handleCheckIn = $(async () => {
        if (!selectedBooking.value) return;
        await statusAction.submit({ booking_id: selectedBooking.value.id, status: 'checked_in' });
        navigate('/vendor/bookings', { forceReload: true });
    });

    const handleCheckOut = $(async () => {
        if (!selectedBooking.value) return;
        await statusAction.submit({ booking_id: selectedBooking.value.id, status: 'checked_out' });
        navigate('/vendor/bookings', { forceReload: true });
    });

    const handleCancelBooking = $(async () => {
        if (!selectedBooking.value) return;
        await statusAction.submit({ booking_id: selectedBooking.value.id, status: 'cancelled' });
        navigate('/vendor/bookings', { forceReload: true });
    });

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number | null | undefined, currency: string = 'USD') => {
        if (amount == null || isNaN(amount)) return formatCurrencyValue(0, currency);
        return formatCurrencyValue(amount, currency);
    };

    const formatCurrencyValue = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };


    return (
        <div>
            <PageHeader
                title="Bookings"
                subtitle={`${total} booking${total !== 1 ? 's' : ''} total`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Bookings' },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    <Link href="/vendor/bookings/calendar" class="btn btn-ghost btn-sm">
                        <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        Calendar
                    </Link>
                    <Link href="/vendor/bookings/new" class="btn btn-primary btn-sm">
                        <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New Booking
                    </Link>
                </div>
            </PageHeader>

            {/* Filters */}
            <FilterBar
                filters={filterDefinitions}
                values={filters.value}
                onChange$={handleFilterChange}
                onReset$={handleReset}
                searchPlaceholder="Search by booking #, guest name..."
                onSearch$={handleSearch}
                searchValue={searchValue.value}
            />

            {/* Quick Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Today's Check-ins</div>
                    <div class="stat-value text-xl">0</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Today's Check-outs</div>
                    <div class="stat-value text-xl">0</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Pending Confirmation</div>
                    <div class="stat-value text-xl text-warning">0</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Unpaid Bookings</div>
                    <div class="stat-value text-xl text-error">0</div>
                </div>
            </div>

            {/* Booking List */}
            {bookings.length === 0 ? (
                <EmptyState
                    title="No bookings found"
                    description="Create your first booking or wait for platform reservations."
                    icon="calendar"
                >
                    <Link q:slot="action" href="/vendor/bookings/new" class="btn btn-primary btn-sm">
                        Create Booking
                    </Link>
                </EmptyState>
            ) : (
                <div class="w-full">
                    <table class="table table-zebra bg-base-100">
                        <thead>
                            <tr>
                                <th>Booking</th>
                                <th>Guest</th>
                                <th>Dates</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Total</th>
                                <th>Source</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => {
                                // Handle both PMS bookings (check_in_date/total) and platform bookings (booking_date/total_price)
                                const b = booking as any;
                                const bookingNumber = b.booking_number || b.id?.substring(0, 8);
                                const guestName = b.primary_guest
                                    ? getGuestFullName(b.primary_guest)
                                    : b.customer_info?.full_name || b.customer_info?.name || null;
                                const guestEmail = b.primary_guest?.email || b.customer_info?.email || null;
                                const checkIn = b.check_in_date || b.booking_date;
                                const checkOut = b.check_out_date;
                                const nights = b.nights_count ?? (checkOut ? null : undefined);
                                const totalAmount = b.total ?? b.total_price ?? 0;
                                const peopleCount = b.adults || b.number_of_people || 0;

                                return (
                                <tr
                                    key={booking.id}
                                    data-booking-row
                                >
                                    <td>
                                        <Link
                                            href={`/vendor/bookings/${booking.id}`}
                                            class="font-medium hover:text-primary"
                                        >
                                            #{bookingNumber}
                                        </Link>
                                        <div class="text-xs text-base-content/60">
                                            {b.resource?.name || b.activity?.title || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        {guestName ? (
                                            <div>
                                                <span class="hover:text-primary">
                                                    {guestName}
                                                </span>
                                                <div class="text-xs text-base-content/60">
                                                    {guestEmail || `${peopleCount} person${peopleCount !== 1 ? 's' : ''}`}
                                                </div>
                                            </div>
                                        ) : (
                                            <span class="text-base-content/50">-</span>
                                        )}
                                    </td>
                                    <td>
                                        <div class="text-sm">
                                            {formatDate(checkIn)}
                                        </div>
                                        {checkOut ? (
                                            <div class="text-xs text-base-content/60">
                                                to {formatDate(checkOut)} ({nights ?? 0} night{nights !== 1 ? 's' : ''})
                                            </div>
                                        ) : (
                                            <div class="text-xs text-base-content/60">
                                                {peopleCount} person{peopleCount !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span class={`badge badge-sm ${bookingStatusColors[booking.status]}`}>
                                            {bookingStatusLabels[booking.status]}
                                        </span>
                                    </td>
                                    <td>
                                        <span class={`badge badge-sm ${paymentStatusColors[booking.payment_status]}`}>
                                            {paymentStatusLabels[booking.payment_status]}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="font-medium">
                                            {formatCurrency(totalAmount, b.display_currency || b.currency || 'USD')}
                                        </div>
                                        {b.tax_amount > 0 && (
                                            <div class="text-xs text-base-content/60">
                                                incl. {formatCurrency(b.tax_amount, 'USD')} tax
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span class="badge badge-sm badge-ghost">
                                            {bookingSourceLabels[b.source_type] || 'Platform'}
                                        </span>
                                    </td>
                                    <td>
                                        <ActionDropdown actions={[
                                            {
                                                label: 'View Details',
                                                icon: 'view',
                                                onClick$: $(() => navigate(`/vendor/bookings/${booking.id}`)),
                                            },
                                            {
                                                label: 'Edit',
                                                icon: 'edit',
                                                onClick$: $(() => navigate(`/vendor/bookings/${booking.id}?edit=true`)),
                                            },
                                            ...(booking.status === 'pending' ? [{
                                                label: 'Confirm',
                                                icon: 'check',
                                                onClick$: $(() => {
                                                    selectedBooking.value = booking;
                                                    showModal('confirm-booking-modal');
                                                }),
                                            }] : []),
                                            ...(booking.status === 'confirmed' ? [{
                                                label: 'Check In',
                                                icon: 'check',
                                                onClick$: $(() => {
                                                    selectedBooking.value = booking;
                                                    showModal('checkin-booking-modal');
                                                }),
                                            }] : []),
                                            ...(booking.status === 'checked_in' ? [{
                                                label: 'Check Out',
                                                icon: 'check',
                                                onClick$: $(() => {
                                                    selectedBooking.value = booking;
                                                    showModal('checkout-booking-modal');
                                                }),
                                            }] : []),
                                            ...(booking.payment_status !== 'paid' ? [
                                                {
                                                    label: 'Create Invoice',
                                                    icon: 'document',
                                                    dividerBefore: true,
                                                    onClick$: $(() => navigate(`/vendor/invoices/new?booking_id=${booking.id}`)),
                                                },
                                                {
                                                    label: 'Record Payment',
                                                    icon: 'payment',
                                                    onClick$: $(() => navigate(`/vendor/payments/new?booking_id=${booking.id}`)),
                                                },
                                            ] : []),
                                            ...(['pending', 'confirmed'].includes(booking.status) ? [{
                                                label: 'Cancel Booking',
                                                icon: 'delete',
                                                danger: true,
                                                dividerBefore: true,
                                                onClick$: $(() => {
                                                    selectedBooking.value = booking;
                                                    showModal('cancel-booking-modal');
                                                }),
                                            }] : []),
                                        ]} />
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Confirm Booking Modal */}
            <ConfirmModal
                id="confirm-booking-modal"
                title="Confirm Booking"
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                message={`Are you sure you want to confirm booking #${selectedBooking.value?.booking_number || selectedBooking.value?.id?.substring(0, 8)}?`}
                confirmText="Confirm"
                onConfirm$={handleConfirmBooking}
            />

            {/* Check In Modal */}
            <ConfirmModal
                id="checkin-booking-modal"
                title="Check In Guest"
                message={`Check in guest for booking #${selectedBooking.value?.booking_number || selectedBooking.value?.id?.substring(0, 8)}?`}
                confirmText="Check In"
                onConfirm$={handleCheckIn}
            />

            {/* Check Out Modal */}
            <ConfirmModal
                id="checkout-booking-modal"
                title="Check Out Guest"
                message={`Check out guest from booking #${selectedBooking.value?.booking_number || selectedBooking.value?.id?.substring(0, 8)}?`}
                confirmText="Check Out"
                onConfirm$={handleCheckOut}
            />

            {/* Cancel Booking Modal */}
            <ConfirmModal
                id="cancel-booking-modal"
                title="Cancel Booking"
                message={`Are you sure you want to cancel booking #${selectedBooking.value?.booking_number || selectedBooking.value?.id?.substring(0, 8)}? This action cannot be undone.`}
                confirmText="Cancel Booking"
                danger={true}
                onConfirm$={handleCancelBooking}
            />
        </div>
    );
});

export const head: DocumentHead = {
  title: 'Bookings | Vendor Portal',
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
};

