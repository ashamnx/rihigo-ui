import {component$, useSignal, $} from '@builder.io/qwik';
import type {DocumentHead} from '@builder.io/qwik-city';
import {routeLoader$, routeAction$, Form, Link} from '@builder.io/qwik-city';
import {getAllBookings, updateBookingStatus} from '~/services/booking-api';
import type {Booking} from '~/types/booking';

export const useBookings = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session');

  if (!session || !session.user) {
    return {
      success: false,
      error: 'Unauthorized',
      bookings: []
    };
  }

  try {
    const token = session.user.accessToken || '';
    const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
    const status = requestEvent.url.searchParams.get('status') || undefined;

    const response = await getAllBookings(token, {
      page,
      page_size: 20,
      status
    });

    return {
      success: true,
      error: null,
      bookings: response.data,
      pagination: response.pagination
    };
  } catch (error) {
    console.error('Failed to load bookings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load bookings',
      bookings: []
    };
  }
});

export const useUpdateStatus = routeAction$(async (data, requestEvent) => {
  const session = requestEvent.sharedMap.get('session');

  if (!session || !session.user) {
    return {
      success: false,
      message: 'Unauthorized'
    };
  }

  try {
    const token = session.user.accessToken || '';
    const bookingId = data.booking_id as string;
    const status = data.status as 'pending' | 'confirmed' | 'cancelled' | 'completed';
    const paymentStatus = data.payment_status as 'pending' | 'paid' | 'refunded' | undefined;

    await updateBookingStatus(bookingId, {
      status,
      payment_status: paymentStatus
    }, token);

    return {
      success: true,
      message: 'Booking status updated successfully'
    };
  } catch (error) {
    console.error('Failed to update booking status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update booking status'
    };
  }
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

  // Filter bookings
  const filteredBookings = bookings.filter((booking: Booking) => {
    const matchesStatus = filterStatus.value === 'all' || booking.status === filterStatus.value;
    const matchesSearch = searchTerm.value === '' ||
      booking.id.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      booking.customer_info?.full_name?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      booking.activity?.title?.toLowerCase().includes(searchTerm.value.toLowerCase());

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'completed': return 'badge-info';
      case 'cancelled': return 'badge-error';
      default: return 'badge-ghost';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'refunded': return 'badge-info';
      default: return 'badge-ghost';
    }
  };

  const totalRevenue = bookings
    .filter((b: Booking) => b.payment_status === 'paid')
    .reduce((sum: number, b: Booking) => sum + b.total_price, 0);

  const pendingBookings = bookings.filter((b: Booking) => b.status === 'pending').length;
  const confirmedBookings = bookings.filter((b: Booking) => b.status === 'confirmed').length;

  return (
    <div>
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">Bookings Management</h1>
          <p class="text-sm text-base-content/70 mt-1">
            View and manage all activity bookings
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="stat bg-base-100 rounded-lg shadow">
          <div class="stat-title">Total Bookings</div>
          <div class="stat-value text-primary">{bookings.length}</div>
        </div>
        <div class="stat bg-base-100 rounded-lg shadow">
          <div class="stat-title">Pending</div>
          <div class="stat-value text-warning">{pendingBookings}</div>
        </div>
        <div class="stat bg-base-100 rounded-lg shadow">
          <div class="stat-title">Confirmed</div>
          <div class="stat-value text-success">{confirmedBookings}</div>
        </div>
        <div class="stat bg-base-100 rounded-lg shadow">
          <div class="stat-title">Total Revenue</div>
          <div class="stat-value text-success">${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-base-100 rounded-lg shadow p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="form-control flex-1">
            <input
              type="text"
              placeholder="Search by booking ID, guest name, or activity..."
              class="input input-bordered"
              value={searchTerm.value}
              onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
            />
          </div>
          <div class="flex gap-2 flex-wrap">
            <button
              class={`btn btn-sm ${filterStatus.value === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'all'}
            >
              All
            </button>
            <button
              class={`btn btn-sm ${filterStatus.value === 'pending' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'pending'}
            >
              Pending
            </button>
            <button
              class={`btn btn-sm ${filterStatus.value === 'confirmed' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'confirmed'}
            >
              Confirmed
            </button>
            <button
              class={`btn btn-sm ${filterStatus.value === 'completed' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'completed'}
            >
              Completed
            </button>
            <button
              class={`btn btn-sm ${filterStatus.value === 'cancelled' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'cancelled'}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {updateStatusAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateStatusAction.value.message}</span>
        </div>
      )}

      {updateStatusAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateStatusAction.value.message}</span>
        </div>
      )}

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <div class="bg-base-100 rounded-lg shadow p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-base-content/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <h3 class="text-lg font-semibold mb-2">No bookings found</h3>
          <p class="text-base-content/70">
            {searchTerm.value || filterStatus.value !== 'all'
              ? 'Try adjusting your filters'
              : 'No bookings have been made yet'}
          </p>
        </div>
      ) : (
        <div class="bg-base-100 rounded-lg shadow overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Activity</th>
                <th>Guest</th>
                <th>Date</th>
                <th>People</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking: Booking) => {
                const bookingDate = new Date(booking.booking_date);

                return (
                  <tr key={booking.id}>
                    <td>
                      <div class="font-mono text-xs">{booking.id.substring(0, 8)}...</div>
                    </td>
                    <td>
                      <div class="font-semibold">{booking.activity?.title || 'N/A'}</div>
                      {booking.package && (
                        <div class="text-xs text-base-content/70">{booking.package.name}</div>
                      )}
                    </td>
                    <td>
                      <div>{booking.customer_info?.full_name || 'N/A'}</div>
                      <div class="text-xs text-base-content/70">{booking.customer_info?.email}</div>
                    </td>
                    <td>
                      <div>{bookingDate.toLocaleDateString()}</div>
                      <div class="text-xs text-base-content/70">{bookingDate.toLocaleTimeString()}</div>
                    </td>
                    <td>{booking.number_of_people}</td>
                    <td>
                      <div class="font-semibold">
                        {booking.currency === 'USD' ? '$' : booking.currency}
                        {booking.total_price.toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <span class={`badge badge-sm ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <span class={`badge badge-sm ${getPaymentStatusColor(booking.payment_status)}`}>
                        {booking.payment_status}
                      </span>
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <button
                          class="btn btn-xs btn-outline"
                          onClick$={() => openStatusModal(booking)}
                        >
                          Update
                        </button>
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          class="btn btn-xs btn-ghost"
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
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div class="mt-6 flex justify-center">
          <div class="join">
            {Array.from({length: pagination.total_pages}, (_, i) => i + 1).map(page => (
              <a
                key={page}
                href={`/admin/bookings?page=${page}`}
                class={`join-item btn ${page === pagination.page ? 'btn-active' : ''}`}
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
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Update Booking Status</h3>

            <div class="mb-4">
              <p class="text-sm text-base-content/70 mb-2">
                Booking ID: <span class="font-mono">{selectedBooking.value.id}</span>
              </p>
              <p class="text-sm text-base-content/70">
                Guest: <span class="font-semibold">{selectedBooking.value.customer_info?.full_name}</span>
              </p>
            </div>

            <Form action={updateStatusAction} onSubmitCompleted$={closeStatusModal}>
              <input type="hidden" name="booking_id" value={selectedBooking.value.id} />

              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Booking Status</span>
                </label>
                <select name="status" class="select select-bordered" required>
                  <option value="pending" selected={selectedBooking.value.status === 'pending'}>Pending</option>
                  <option value="confirmed" selected={selectedBooking.value.status === 'confirmed'}>Confirmed</option>
                  <option value="completed" selected={selectedBooking.value.status === 'completed'}>Completed</option>
                  <option value="cancelled" selected={selectedBooking.value.status === 'cancelled'}>Cancelled</option>
                </select>
              </div>

              <div class="form-control mb-6">
                <label class="label">
                  <span class="label-text">Payment Status</span>
                </label>
                <select name="payment_status" class="select select-bordered">
                  <option value="pending" selected={selectedBooking.value.payment_status === 'pending'}>Pending</option>
                  <option value="paid" selected={selectedBooking.value.payment_status === 'paid'}>Paid</option>
                  <option value="refunded" selected={selectedBooking.value.payment_status === 'refunded'}>Refunded</option>
                </select>
              </div>

              <div class="modal-action">
                <button type="button" class="btn" onClick$={closeStatusModal}>Cancel</button>
                <button type="submit" class="btn btn-primary">Update Status</button>
              </div>
            </Form>
          </div>
          <div class="modal-backdrop" onClick$={closeStatusModal}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Bookings Management | Admin',
  meta: [
    {
      name: 'description',
      content: 'Manage activity bookings',
    },
  ],
};
