import {component$, useSignal} from '@builder.io/qwik';
import {routeLoader$, useLocation, Link, type DocumentHead} from '@builder.io/qwik-city';
import {getUserBookings} from '~/services/booking-api';
import {inlineTranslate} from 'qwik-speak';
import type {Booking} from '~/types/booking';

export const head: DocumentHead = {
  title: 'My Bookings | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'View and manage your bookings',
    },
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
};

export const useUserBookings = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session');

  if (!session || !session.user) {
    return {
      success: false,
      data: [],
      pagination: null,
      error: 'Unauthorized'
    };
  }

  try {
    const token = session.user.accessToken || '';
    const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
    const response = await getUserBookings(token, { page, page_size: 10 });

    return {
      success: true,
      data: response.data,
      pagination: response.pagination,
      error: null
    };
  } catch (error) {
    console.error('Failed to load bookings:', error);
    return {
      success: false,
      data: [],
      pagination: null,
      error: error instanceof Error ? error.message : 'Failed to load bookings'
    };
  }
});

export default component$(() => {
  const bookingsResponse = useUserBookings();
  const location = useLocation();
  const t = inlineTranslate();
  const lang = location.params.lang || 'en';

  const filterStatus = useSignal<string>('all');

  // Redirect to login if not authenticated
  if (!bookingsResponse.value.success && bookingsResponse.value.error === 'Unauthorized') {
    if (typeof window !== 'undefined') {
      window.location.href = `/${lang}/auth/signin?callbackUrl=${encodeURIComponent(location.url.pathname)}`;
    }
    return <div>Redirecting to login...</div>;
  }

  const bookings = bookingsResponse.value.data;
  const pagination = bookingsResponse.value.pagination;

  // Filter bookings by status
  const filteredBookings = filterStatus.value === 'all'
    ? bookings
    : bookings.filter(b => b.status === filterStatus.value);

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

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <div class="bg-white border-b border-gray-200">
        <div class="container mx-auto px-4 py-8">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">
                {t('bookings.title@@My Bookings')}
              </h1>
              <p class="text-gray-600 mt-2">
                {t('bookings.subtitle@@Manage your activity bookings')}
              </p>
            </div>
            <Link href={`/${lang}/activities`} class="btn btn-primary">
              {t('bookings.browseActivities@@Browse Activities')}
            </Link>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        {/* Filters */}
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div class="flex flex-wrap gap-2">
            <button
              class={`btn btn-sm ${filterStatus.value === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'all'}
            >
              {t('bookings.filter.all@@All')}
            </button>
            <button
              class={`btn btn-sm ${filterStatus.value === 'pending' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'pending'}
            >
              {t('bookings.filter.pending@@Pending')}
            </button>
            <button
              class={`btn btn-sm ${filterStatus.value === 'confirmed' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'confirmed'}
            >
              {t('bookings.filter.confirmed@@Confirmed')}
            </button>
            <button
              class={`btn btn-sm ${filterStatus.value === 'completed' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'completed'}
            >
              {t('bookings.filter.completed@@Completed')}
            </button>
            <button
              class={`btn btn-sm ${filterStatus.value === 'cancelled' ? 'btn-primary' : 'btn-outline'}`}
              onClick$={() => filterStatus.value = 'cancelled'}
            >
              {t('bookings.filter.cancelled@@Cancelled')}
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div class="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">
              {t('bookings.empty.title@@No bookings found')}
            </h3>
            <p class="text-gray-600 mb-6">
              {filterStatus.value === 'all'
                ? t('bookings.empty.message@@You haven\'t made any bookings yet')
                : t('bookings.empty.messageFiltered@@No bookings found with this status')}
            </p>
            {filterStatus.value === 'all' && (
              <Link href={`/${lang}/activities`} class="btn btn-primary">
                {t('bookings.empty.browse@@Browse Activities')}
              </Link>
            )}
          </div>
        ) : (
          <div class="space-y-4">
            {filteredBookings.map((booking: Booking) => {
              const bookingDate = new Date(booking.booking_date);
              const isUpcoming = bookingDate > new Date();

              return (
                <div key={booking.id} class="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div class="p-6">
                    <div class="flex flex-col lg:flex-row gap-6">
                      {/* Activity Image */}
                      {booking.activity?.images && booking.activity.images.length > 0 && (
                        <div class="flex-shrink-0">
                          <img
                            src={booking.activity.images[0]}
                            alt={booking.activity.title}
                            class="w-full lg:w-48 h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Booking Details */}
                      <div class="flex-grow">
                        <div class="flex justify-between items-start mb-3">
                          <div>
                            <h3 class="text-xl font-semibold text-gray-800">
                              {booking.activity?.title || 'Activity'}
                            </h3>
                            {booking.package && (
                              <p class="text-sm text-gray-600">{booking.package.name}</p>
                            )}
                          </div>
                          <div class="flex gap-2">
                            <span class={`badge ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            <span class={`badge ${getPaymentStatusColor(booking.payment_status)}`}>
                              {booking.payment_status}
                            </span>
                          </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p class="text-gray-600">{t('bookings.card.date@@Date')}</p>
                            <p class="font-semibold">
                              {bookingDate.toLocaleDateString(lang, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            {isUpcoming && (
                              <span class="text-xs text-green-600 font-semibold">
                                {t('bookings.card.upcoming@@Upcoming')}
                              </span>
                            )}
                          </div>
                          <div>
                            <p class="text-gray-600">{t('bookings.card.people@@People')}</p>
                            <p class="font-semibold">{booking.number_of_people}</p>
                          </div>
                          <div>
                            <p class="text-gray-600">{t('bookings.card.total@@Total')}</p>
                            <p class="font-semibold text-lg text-primary">
                              {booking.currency === 'USD' ? '$' : booking.currency}
                              {booking.total_price.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {booking.customer_info && (
                          <div class="mt-4 text-sm">
                            <p class="text-gray-600">
                              {t('bookings.card.bookedBy@@Booked by')}: <span class="font-semibold">{booking.customer_info.full_name}</span>
                            </p>
                          </div>
                        )}

                        {booking.notes && (
                          <div class="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <p class="text-gray-600 font-semibold mb-1">{t('bookings.card.notes@@Notes')}:</p>
                            <p class="text-gray-700">{booking.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div class="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/${lang}/bookings/${booking.id}/confirmation`}
                            class="btn btn-sm btn-primary"
                          >
                            {t('bookings.card.viewDetails@@View Details')}
                          </Link>

                          {booking.activity?.slug && (
                            <Link
                              href={`/${lang}/activities/${booking.activity.slug}`}
                              class="btn btn-sm btn-outline"
                            >
                              {t('bookings.card.viewActivity@@View Activity')}
                            </Link>
                          )}

                          {booking.status === 'confirmed' && isUpcoming && (
                            <button class="btn btn-sm btn-outline btn-error">
                              {t('bookings.card.cancel@@Cancel Booking')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking ID Footer */}
                  <div class="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <p class="text-xs text-gray-600">
                      {t('bookings.card.bookingId@@Booking ID')}: <span class="font-mono">{booking.id}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div class="mt-8 flex justify-center">
            <div class="join">
              {Array.from({length: pagination.total_pages}, (_, i) => i + 1).map(page => (
                <Link
                  key={page}
                  href={`/${lang}/bookings?page=${page}`}
                  class={`join-item btn ${page === pagination.page ? 'btn-active' : ''}`}
                >
                  {page}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
