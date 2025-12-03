import { component$, useSignal, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { Booking } from '~/types/booking';

export const useBookings = routeLoader$(async (requestEvent) => {
  const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
  const status = requestEvent.url.searchParams.get('status') || undefined;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.admin.bookings.list(token, {
      page,
      page_size: 20,
      status
    });
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error_message || 'Failed to load bookings',
      bookings: [] as Booking[]
    };
  }

  return {
    success: true,
    error: null,
    bookings: (response.data || []) as Booking[],
    pagination: response.pagination_data
  };
});

export const useUpdateStatus = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const bookingId = data.booking_id as string;
    const status = data.status as string;
    const paymentStatus = data.payment_status as string | undefined;

    const response = await apiClient.admin.bookings.updateStatus(bookingId, {
      status,
      payment_status: paymentStatus
    }, token);

    return {
      success: response.success,
      message: response.success
        ? 'Booking status updated successfully'
        : response.error_message || 'Failed to update booking status'
    };
  });
});

export default component$(() => {
  const bookingsData = useBookings();
  const updateStatusAction = useUpdateStatus();

  const filterStatus = useSignal<string>('all');
  const searchTerm = useSignal<string>('');
  const selectedBooking = useSignal<Booking | null>(null);
  const showStatusModal = useSignal(false);

  const bookings = bookingsData.value.bookings;
  const pagination = bookingsData.value.pagination;

  const filteredBookings = bookings.filter((booking: Booking) => {
    const matchesStatus = filterStatus.value === 'all' || booking.status === filterStatus.value;
    const matchesSearch = searchTerm.value === '' ||
      booking.id.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      booking.customer_info.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      booking.activity?.title.toLowerCase().includes(searchTerm.value.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const openStatusModal = $((booking: Booking) => {
    selectedBooking.value = booking;
    showStatusModal.value = true;
  });

  const closeStatusModal = $(() => {
    selectedBooking.value = null;
    showStatusModal.value = false;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'completed': return 'badge-info';
      case 'cancelled': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  const getPaymentStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'text-success';
      case 'pending': return 'text-warning';
      case 'refunded': return 'text-info';
      default: return 'text-base-content/50';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Format booking amount with display currency
  const formatBookingAmount = (booking: Booking) => {
    const displayCurrency = booking.display_currency || booking.currency || 'USD';
    const exchangeRate = booking.exchange_rate_at_booking;

    if (displayCurrency !== 'USD' && exchangeRate) {
      const displayAmount = booking.total_price * exchangeRate;
      return {
        primary: formatCurrency(displayAmount, displayCurrency),
        secondary: formatCurrency(booking.total_price, 'USD'),
        hasExchange: true,
      };
    }
    return {
      primary: formatCurrency(booking.total_price, displayCurrency),
      secondary: null,
      hasExchange: false,
    };
  };

  // Stats
  const pendingCount = bookings.filter((b: Booking) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b: Booking) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b: Booking) => b.status === 'completed').length;

  return (
    <div class="space-y-6">
      {/* Header */}
      <div>
        <h1 class="text-2xl font-bold">Bookings</h1>
        <p class="text-base-content/60 mt-1">Manage and track all activity bookings</p>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Total Bookings</p>
          <p class="text-2xl font-bold mt-1">{bookings.length}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Pending</p>
          <p class="text-2xl font-bold mt-1 text-warning">{pendingCount}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Confirmed</p>
          <p class="text-2xl font-bold mt-1 text-success">{confirmedCount}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Completed</p>
          <p class="text-2xl font-bold mt-1 text-info">{completedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-base-200 rounded-xl p-4">
        <div class="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div class="flex-1">
            <div class="relative">
              <svg class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search by ID, guest, or activity..."
                class="input input-sm input-bordered w-full pl-9"
                value={searchTerm.value}
                onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
              />
            </div>
          </div>

          {/* Status filter buttons */}
          <div class="flex gap-1 flex-wrap">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                class={`btn btn-sm ${filterStatus.value === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick$={() => filterStatus.value = status}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'pending' && pendingCount > 0 && (
                  <span class="badge badge-xs badge-warning ml-1">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {updateStatusAction.value?.success && (
        <div class="alert alert-success py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateStatusAction.value.message}</span>
        </div>
      )}

      {updateStatusAction.value?.success === false && (
        <div class="alert alert-error py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{updateStatusAction.value.message}</span>
        </div>
      )}

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <div class="bg-base-200 rounded-xl p-12 text-center">
          <div class="size-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
            <svg class="size-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">No bookings found</h3>
          <p class="text-base-content/60">
            {searchTerm.value || filterStatus.value !== 'all'
              ? 'Try adjusting your filters'
              : 'No bookings have been made yet'}
          </p>
        </div>
      ) : (
        <div class="bg-base-200 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="border-base-300">
                  <th>Booking</th>
                  <th>Guest</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking: Booking) => {
                  const bookingDate = new Date(booking.booking_date);

                  return (
                    <tr key={booking.id} class="hover border-base-300">
                      <td>
                        <div>
                          <div class="font-medium">{booking.activity?.title || 'N/A'}</div>
                          <div class="text-xs text-base-content/50 font-mono">
                            {booking.id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div class="font-medium">{booking.customer_info.name}</div>
                          <div class="text-xs text-base-content/50">{booking.customer_info.email}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{bookingDate.toLocaleDateString()}</div>
                          <div class="text-xs text-base-content/50">
                            {booking.number_of_people} {booking.number_of_people === 1 ? 'person' : 'people'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div class="font-medium">
                            {formatBookingAmount(booking).primary}
                          </div>
                          {formatBookingAmount(booking).hasExchange && (
                            <div class="text-xs text-base-content/50">
                              {formatBookingAmount(booking).secondary}
                            </div>
                          )}
                          <div class={`text-xs ${getPaymentStyle(booking.payment_status)}`}>
                            {booking.payment_status}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class={`badge badge-sm ${getStatusStyle(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <div class="flex items-center justify-end gap-1">
                          <button
                            class="btn btn-ghost btn-xs"
                            onClick$={() => openStatusModal(booking)}
                          >
                            Update
                          </button>
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            class="btn btn-ghost btn-xs"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div class="flex justify-center">
          <div class="join">
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(page => (
              <a
                key={page}
                href={`/admin/bookings?page=${page}`}
                class={`join-item btn btn-sm ${page === pagination.page ? 'btn-active' : ''}`}
              >
                {page}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal.value && selectedBooking.value && (
        <div class="modal modal-open">
          <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4">Update Booking</h3>

            <div class="mb-4 p-3 bg-base-200 rounded-lg">
              <p class="text-sm text-base-content/60">
                <span class="font-mono text-xs">{selectedBooking.value.id.substring(0, 8)}...</span>
              </p>
              <p class="font-medium">{selectedBooking.value.customer_info.name}</p>
              <p class="text-sm text-base-content/60">{selectedBooking.value.activity?.title}</p>
            </div>

            <Form action={updateStatusAction} onSubmitCompleted$={closeStatusModal}>
              <input type="hidden" name="booking_id" value={selectedBooking.value.id} />

              <div class="form-control mb-3">
                <label class="label py-1">
                  <span class="label-text text-sm">Booking Status</span>
                </label>
                <select name="status" class="select select-sm select-bordered" required>
                  <option value="pending" selected={selectedBooking.value.status === 'pending'}>Pending</option>
                  <option value="confirmed" selected={selectedBooking.value.status === 'confirmed'}>Confirmed</option>
                  <option value="completed" selected={selectedBooking.value.status === 'completed'}>Completed</option>
                  <option value="cancelled" selected={selectedBooking.value.status === 'cancelled'}>Cancelled</option>
                </select>
              </div>

              <div class="form-control mb-4">
                <label class="label py-1">
                  <span class="label-text text-sm">Payment Status</span>
                </label>
                <select name="payment_status" class="select select-sm select-bordered">
                  <option value="pending" selected={selectedBooking.value.payment_status === 'pending'}>Pending</option>
                  <option value="paid" selected={selectedBooking.value.payment_status === 'paid'}>Paid</option>
                  <option value="refunded" selected={selectedBooking.value.payment_status === 'refunded'}>Refunded</option>
                </select>
              </div>

              <div class="modal-action">
                <button type="button" class="btn btn-ghost btn-sm" onClick$={closeStatusModal}>Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Update</button>
              </div>
            </Form>
          </div>
          <div class="modal-backdrop bg-base-300/50" onClick$={closeStatusModal}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Bookings | Admin | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Manage activity bookings',
    },
  ],
};
