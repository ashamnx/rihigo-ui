import {component$, useSignal} from '@builder.io/qwik';
import {routeLoader$, useLocation, Link, type DocumentHead} from '@builder.io/qwik-city';
import {inlineTranslate} from 'qwik-speak';
import type {Booking} from '~/types/booking';
import {authenticatedRequest, apiClient} from '~/utils/api-client';

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
  const page = parseInt(requestEvent.url.searchParams.get('page') || '1');

  return authenticatedRequest(requestEvent, (token) =>
    apiClient.bookings.list(page, 10, token)
  );
});

export default component$(() => {
  const bookingsResponse = useUserBookings();
  const location = useLocation();
  const t = inlineTranslate();
  const lang = location.params.lang || 'en';

  const filterStatus = useSignal<string>('all');

  // Redirect to login if not authenticated
  if (!bookingsResponse.value.success && bookingsResponse.value.error_message === 'Authentication required') {
    if (typeof window !== 'undefined') {
      window.location.href = `/${lang}/auth/signin?callbackUrl=${encodeURIComponent(location.url.pathname)}`;
    }
    return <div>Redirecting to login...</div>;
  }

  const bookings = bookingsResponse.value.data || [];
  const pagination = bookingsResponse.value.pagination_data;

  // Filter bookings by status
  const filteredBookings = filterStatus.value === 'all'
    ? bookings
    : bookings.filter(b => b.status === filterStatus.value);

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentBgColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <div class="bg-white border-b border-gray-200">
        <div class="container mx-auto py-12 max-w-7xl px-6 lg:px-8">
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

      <div class="container mx-auto py-12 max-w-7xl px-6 lg:px-8">
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
                            width={192}
                            height={192}
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
                          <div class="flex gap-3">
                            <div class="text-center">
                              <span class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBgColor(booking.status)}`}>
                                <span class={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(booking.status)}`}></span>
                                {booking.status}
                              </span>
                            </div>
                            <div class="text-center">
                              <span class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getPaymentBgColor(booking.payment_status)}`}>
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {booking.payment_status}
                              </span>
                            </div>
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
                          {booking.payment_status === 'pending' && (
                            <Link
                              href={`/${lang}/bookings/${booking.id}/pay`}
                              class="btn btn-sm btn-success gap-1"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              {t('bookings.card.payNow@@Pay Now')}
                            </Link>
                          )}

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
