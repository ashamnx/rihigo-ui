// @ts-nocheck
import { component$, useSignal, useOnDocument, $ } from '@builder.io/qwik';
import {
  routeLoader$,
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

export default component$(() => {
    const bookingsData = useBookingsLoader();
    const navigate = useNavigate();

    const filters = useSignal<Record<string, string>>({});
    const searchValue = useSignal('');
    const selectedBooking = useSignal<VendorBooking | null>(null);

    const bookings = bookingsData.value.data || [];
    const total = bookingsData.value.total || 0;

    // Staggered animation for booking table rows
    useOnDocument(
        'qviewTransition',
        $(async (event: CustomEvent<{ ready: Promise<void> }>) => {
            const rows = document.querySelectorAll<HTMLElement>('[data-booking-row]');
            const visibleRows = Array.from(rows).filter((row) => {
                const rect = row.getBoundingClientRect();
                return rect.top < window.innerHeight && rect.bottom > 0;
            });

            if (visibleRows.length === 0) return;

            const transition = event.detail;
            await transition.ready;

            visibleRows.forEach((row, i) => {
                const name = row.style.viewTransitionName;
                if (name) {
                    document.documentElement.animate(
                        {
                            opacity: [0, 1],
                            transform: ['translateX(-10px)', 'translateX(0)'],
                        },
                        {
                            pseudoElement: `::view-transition-new(${name})`,
                            duration: 200,
                            delay: i * 25,
                            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                            fill: 'forwards',
                        }
                    );
                }
            });
        })
    );

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
        console.log('Confirming booking:', selectedBooking.value.id);
        navigate('/vendor/bookings', { forceReload: true });
    });

    const handleCheckIn = $(async () => {
        if (!selectedBooking.value) return;
        console.log('Checking in booking:', selectedBooking.value.id);
        navigate('/vendor/bookings', { forceReload: true });
    });

    const handleCheckOut = $(async () => {
        if (!selectedBooking.value) return;
        console.log('Checking out booking:', selectedBooking.value.id);
        navigate('/vendor/bookings', { forceReload: true });
    });

    const handleCancelBooking = $(async () => {
        if (!selectedBooking.value) return;
        console.log('Cancelling booking:', selectedBooking.value.id);
        navigate('/vendor/bookings', { forceReload: true });
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    // Format booking amount with display currency
    const formatBookingAmount = (booking: VendorBooking) => {
        const displayCurrency = booking.display_currency || booking.currency || 'USD';
        const exchangeRate = booking.exchange_rate_at_booking;

        if (displayCurrency !== 'USD' && exchangeRate) {
            const displayAmount = booking.total * exchangeRate;
            return {
                primary: formatCurrency(displayAmount, displayCurrency),
                secondary: `${formatCurrency(booking.total, 'USD')} USD`,
                hasExchange: true,
            };
        }
        return {
            primary: formatCurrency(booking.total, displayCurrency),
            secondary: null,
            hasExchange: false,
        };
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
                <div class="overflow-x-auto">
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
                            {bookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    data-booking-row
                                    style={{ viewTransitionName: `booking-row-${booking.id}` }}
                                >
                                    <td>
                                        <Link
                                            href={`/vendor/bookings/${booking.id}`}
                                            class="font-medium hover:text-primary"
                                            style={{ viewTransitionName: `booking-number-${booking.id}` }}
                                        >
                                            #{booking.booking_number}
                                        </Link>
                                        <div class="text-xs text-base-content/60">
                                            {booking.resource?.name || booking.activity?.title || 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        {booking.primary_guest ? (
                                            <div>
                                                <Link
                                                    href={`/vendor/guests/${booking.primary_guest_id}`}
                                                    class="hover:text-primary"
                                                >
                                                    {getGuestFullName(booking.primary_guest)}
                                                </Link>
                                                <div class="text-xs text-base-content/60">
                                                    {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                                                    {booking.children > 0 && `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}`}
                                                </div>
                                            </div>
                                        ) : (
                                            <span class="text-base-content/50">-</span>
                                        )}
                                    </td>
                                    <td>
                                        <div class="text-sm">
                                            {formatDate(booking.check_in_date)}
                                        </div>
                                        <div class="text-xs text-base-content/60">
                                            to {formatDate(booking.check_out_date)} ({booking.nights_count} night{booking.nights_count !== 1 ? 's' : ''})
                                        </div>
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
                                            {formatBookingAmount(booking).primary}
                                        </div>
                                        {formatBookingAmount(booking).hasExchange && (
                                            <div class="text-xs text-base-content/50">
                                                {formatBookingAmount(booking).secondary}
                                            </div>
                                        )}
                                        {booking.net_revenue !== booking.total && (
                                            <div class="text-xs text-base-content/60">
                                                Net: {formatCurrency(booking.net_revenue, 'USD')}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span class="badge badge-sm badge-ghost">
                                            {bookingSourceLabels[booking.source_type]}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Confirm Booking Modal */}
            <ConfirmModal
                id="confirm-booking-modal"
                title="Confirm Booking"
                message={`Are you sure you want to confirm booking #${selectedBooking.value?.booking_number}?`}
                confirmText="Confirm"
                onConfirm$={handleConfirmBooking}
            />

            {/* Check In Modal */}
            <ConfirmModal
                id="checkin-booking-modal"
                title="Check In Guest"
                message={`Check in ${selectedBooking.value?.primary_guest ? getGuestFullName(selectedBooking.value.primary_guest) : 'guest'} for booking #${selectedBooking.value?.booking_number}?`}
                confirmText="Check In"
                onConfirm$={handleCheckIn}
            />

            {/* Check Out Modal */}
            <ConfirmModal
                id="checkout-booking-modal"
                title="Check Out Guest"
                message={`Check out ${selectedBooking.value?.primary_guest ? getGuestFullName(selectedBooking.value.primary_guest) : 'guest'} from booking #${selectedBooking.value?.booking_number}?`}
                confirmText="Check Out"
                onConfirm$={handleCheckOut}
            />

            {/* Cancel Booking Modal */}
            <ConfirmModal
                id="cancel-booking-modal"
                title="Cancel Booking"
                message={`Are you sure you want to cancel booking #${selectedBooking.value?.booking_number}? This action cannot be undone.`}
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

