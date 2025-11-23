import {component$} from '@builder.io/qwik';
import {routeLoader$, useLocation, Link} from '@builder.io/qwik-city';
import {getBookingById} from '~/services/booking-api';
import {inlineTranslate} from 'qwik-speak';

export const useBookingData = routeLoader$(async (requestEvent) => {
  const bookingId = requestEvent.params.id;
  const session = requestEvent.sharedMap.get('session');

  if (!session || !session.user) {
    return {
      success: false,
      data: null,
      error: 'Unauthorized'
    };
  }

  try {
    const token = session.user.accessToken || '';
    const booking = await getBookingById(bookingId, token);

    return {
      success: true,
      data: booking,
      error: null
    };
  } catch (error) {
    console.error('Failed to load booking:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Booking not found'
    };
  }
});

export default component$(() => {
  const bookingDataResponse = useBookingData();
  const location = useLocation();
  const t = inlineTranslate();
  const lang = location.params.lang || 'en';

  if (!bookingDataResponse.value.success || !bookingDataResponse.value.data) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">{t('confirmation.error@@Booking Not Found')}</h1>
          <p class="text-gray-600 mb-6">{bookingDataResponse.value.error}</p>
          <Link href={`/${lang}/bookings`} class="btn btn-primary">
            {t('confirmation.viewBookings@@View My Bookings')}
          </Link>
        </div>
      </div>
    );
  }

  const booking = bookingDataResponse.value.data;
  const bookingDate = new Date(booking.booking_date);

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-12">
        {/* Success Header */}
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg class="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            {t('confirmation.title@@Booking Confirmed!')}
          </h1>
          <p class="text-gray-600">
            {t('confirmation.subtitle@@Your booking has been successfully confirmed')}
          </p>
        </div>

        {/* Booking Details Card */}
        <div class="max-w-3xl mx-auto">
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Booking ID Header */}
            <div class="bg-primary text-white px-6 py-4">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm opacity-90">{t('confirmation.bookingId@@Booking ID')}</p>
                  <p class="text-lg font-bold">{booking.id}</p>
                </div>
                <div class="text-right">
                  <span class={`badge ${
                    booking.status === 'confirmed' ? 'badge-success' :
                    booking.status === 'pending' ? 'badge-warning' :
                    'badge-ghost'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div class="p-6 space-y-6">
              {/* Activity Information */}
              {booking.activity && (
                <div>
                  <h2 class="text-lg font-semibold text-gray-800 mb-3">
                    {t('confirmation.activityDetails@@Activity Details')}
                  </h2>
                  <div class="flex gap-4">
                    {booking.activity.images && booking.activity.images.length > 0 && (
                      <img
                        src={booking.activity.images[0]}
                        alt={booking.activity.title}
                        class="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 class="font-semibold text-gray-900">{booking.activity.title}</h3>
                      {booking.package && (
                        <p class="text-sm text-gray-600">{booking.package.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div class="divider"></div>

              {/* Booking Information */}
              <div>
                <h2 class="text-lg font-semibold text-gray-800 mb-3">
                  {t('confirmation.bookingInfo@@Booking Information')}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600">{t('confirmation.date@@Date')}</p>
                    <p class="font-semibold">{bookingDate.toLocaleDateString(lang, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">{t('confirmation.people@@Number of People')}</p>
                    <p class="font-semibold">{booking.number_of_people}</p>
                  </div>
                </div>
              </div>

              <div class="divider"></div>

              {/* Guest Information */}
              {booking.customer_info && (
                <div>
                  <h2 class="text-lg font-semibold text-gray-800 mb-3">
                    {t('confirmation.guestInfo@@Guest Information')}
                  </h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p class="text-sm text-gray-600">{t('confirmation.name@@Name')}</p>
                      <p class="font-semibold">{booking.customer_info.full_name}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">{t('confirmation.email@@Email')}</p>
                      <p class="font-semibold">{booking.customer_info.email}</p>
                    </div>
                    <div>
                      <p class="text-sm text-gray-600">{t('confirmation.phone@@Phone')}</p>
                      <p class="font-semibold">{booking.customer_info.phone}</p>
                    </div>
                    {booking.customer_info.nationality && (
                      <div>
                        <p class="text-sm text-gray-600">{t('confirmation.nationality@@Nationality')}</p>
                        <p class="font-semibold">{booking.customer_info.nationality}</p>
                      </div>
                    )}
                  </div>
                  {booking.customer_info.special_requests && (
                    <div class="mt-4">
                      <p class="text-sm text-gray-600">{t('confirmation.specialRequests@@Special Requests')}</p>
                      <p class="text-gray-800">{booking.customer_info.special_requests}</p>
                    </div>
                  )}
                </div>
              )}

              <div class="divider"></div>

              {/* Payment Information */}
              <div>
                <h2 class="text-lg font-semibold text-gray-800 mb-3">
                  {t('confirmation.payment@@Payment Information')}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600">{t('confirmation.total@@Total Amount')}</p>
                    <p class="text-2xl font-bold text-primary">
                      {booking.currency === 'USD' ? '$' : booking.currency}
                      {booking.total_price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">{t('confirmation.paymentMethod@@Payment Method')}</p>
                    <p class="font-semibold capitalize">{booking.payment_method?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">{t('confirmation.paymentStatus@@Payment Status')}</p>
                    <span class={`badge ${
                      booking.payment_status === 'paid' ? 'badge-success' :
                      booking.payment_status === 'pending' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {booking.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Information */}
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex gap-3">
                  <svg class="w-6 h-6 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                  <div class="text-sm">
                    <p class="font-semibold text-yellow-800 mb-1">
                      {t('confirmation.important@@Important Information')}
                    </p>
                    <ul class="text-yellow-700 space-y-1">
                      <li>{t('confirmation.confirmationEmail@@A confirmation email has been sent to your email address')}</li>
                      <li>{t('confirmation.arriveEarly@@Please arrive 15 minutes before the scheduled time')}</li>
                      <li>{t('confirmation.cancellationReminder@@Free cancellation up to 24 hours before the activity')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/${lang}/bookings`} class="btn btn-primary">
                  {t('confirmation.viewAllBookings@@View All Bookings')}
                </Link>
                <Link href={`/${lang}/activities`} class="btn btn-outline">
                  {t('confirmation.browseActivities@@Browse More Activities')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
