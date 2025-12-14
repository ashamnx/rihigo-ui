import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link, type DocumentHead } from '@builder.io/qwik-city';
import { inlineTranslate } from 'qwik-speak';
import { authenticatedRequest, apiClient } from '~/utils/api-client';

export const useBookingData = routeLoader$(async (requestEvent) => {
    const bookingId = requestEvent.params.id;
    const lang = requestEvent.params.lang || 'en';

    const response = await authenticatedRequest(requestEvent, (token) =>
        apiClient.bookings.getById(bookingId, token)
    );

    if (!response.success || !response.data) {
        return {
            success: false,
            data: null,
            error: response.error_message || 'Booking not found',
        };
    }

    const booking = response.data;

    // Validation: must be vendor confirmed
    if (booking.vendor_confirmation_status !== 'confirmed') {
        throw requestEvent.redirect(302, `/${lang}/bookings/${bookingId}/confirmation`);
    }

    // Validation: payment must be pending
    if (booking.payment_status === 'paid') {
        throw requestEvent.redirect(302, `/${lang}/bookings/${bookingId}/confirmation`);
    }

    return {
        success: true,
        data: booking,
        error: null,
    };
});

export const useInitiatePayment = routeAction$(async (data, requestEvent) => {
    const lang = requestEvent.params.lang || 'en';
    const bookingId = data.booking_id as string;
    const origin = requestEvent.url.origin;

    const callbackUrl = `${origin}/${lang}/bookings/${bookingId}/pay/callback`;

    const response = await authenticatedRequest(requestEvent, (token) =>
      apiClient.bmlPayments.initiate(
        {
          booking_id: bookingId,
          redirect_url: callbackUrl,
        },
        token,
      ),
    );

    if (response.success && response.data?.payment_url) {
      console.log('Redirecting to BML payment page: ', response.data.payment_url, '...');
      requestEvent.headers.set('Location', response.data.payment_url);
      requestEvent.send(302, '');
      return response;
    }

    return response;
});

export default component$(() => {
    const bookingData = useBookingData();
    const initiatePayment = useInitiatePayment();
    const t = inlineTranslate();

    if (!bookingData.value.success || !bookingData.value.data) {
        return (
            <div class="min-h-screen bg-gray-50 flex items-center justify-center">
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-gray-800 mb-4">
                        {t('payment.error@@Booking Not Found')}
                    </h1>
                    <p class="text-gray-600 mb-6">{bookingData.value.error}</p>
                    <Link href="/bookings" class="btn btn-primary">
                        {t('payment.viewBookings@@View My Bookings')}
                    </Link>
                </div>
            </div>
        );
    }

    const booking = bookingData.value.data;
    const bookingDate = new Date(booking.booking_date);

    return (
      <div class="min-h-screen bg-gray-50">
        <div class="container mx-auto px-4 py-12">
          {/* Header */}
          <div class="mb-8 text-center">
            <div class="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                class="text-primary h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h1 class="mb-2 text-3xl font-bold text-gray-800">
              {t("payment.title@@Complete Your Payment")}
            </h1>
            <p class="text-gray-600">
              {t(
                "payment.subtitle@@Secure payment powered by Bank of Maldives",
              )}
            </p>
          </div>

          <div class="mx-auto max-w-2xl">
            {/* Error Alert */}
            {initiatePayment.value && !initiatePayment.value.success && (
              <div class="alert alert-error mb-6">
                <svg
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {initiatePayment.value.error_message ||
                    t(
                      "payment.initError@@Failed to initiate payment. Please try again.",
                    )}
                </span>
              </div>
            )}

            <div class="overflow-hidden rounded-lg bg-white shadow-md">
              {/* Booking Summary Header */}
              <div class="bg-primary px-6 py-4 text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">
                      {t("payment.bookingId@@Booking ID")}
                    </p>
                    <p class="font-mono font-bold">{booking.id}</p>
                  </div>
                  <span class="badge badge-success">
                    {t("payment.confirmed@@CONFIRMED")}
                  </span>
                </div>
              </div>

              <div class="space-y-6 p-6">
                {/* Activity Details */}
                {booking.activity && (
                  <div>
                    <h2 class="mb-3 text-lg font-semibold text-gray-800">
                      {t("payment.activityDetails@@Activity Details")}
                    </h2>
                    <div class="flex gap-4">
                      {booking.activity.images &&
                        booking.activity.images.length > 0 && (
                          <img
                            src={booking.activity.images[0]}
                            alt={booking.activity.title}
                            width={80}
                            height={80}
                            class="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                      <div>
                        <h3 class="font-semibold text-gray-900">
                          {booking.activity.title}
                        </h3>
                        {booking.package && (
                          <p class="text-sm text-gray-600">
                            {booking.package.name}
                          </p>
                        )}
                        <div class="mt-2 flex gap-4 text-sm text-gray-600">
                          <span>
                            {bookingDate.toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span>
                            {booking.number_of_people}{" "}
                            {booking.number_of_people === 1
                              ? t("payment.person@@person")
                              : t("payment.people@@people")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div class="divider"></div>

                {/* Price Breakdown */}
                <div>
                  <h2 class="mb-3 text-lg font-semibold text-gray-800">
                    {t("payment.priceBreakdown@@Price Breakdown")}
                  </h2>
                  <div class="space-y-2">
                    <div class="flex justify-between">
                      <span class="text-gray-600">
                        {t("payment.subtotal@@Subtotal")}
                      </span>
                      <span>
                        {booking.currency === "USD" ? "$" : booking.currency}
                        {booking.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {booking.tax_amount > 0 && (
                      <div class="flex justify-between text-gray-600">
                        <span>{t("payment.taxes@@Taxes & Fees")}</span>
                        <span>
                          {booking.currency === "USD" ? "$" : booking.currency}
                          {booking.tax_amount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div class="divider my-2"></div>

                    <div class="flex justify-between text-lg font-bold">
                      <span>{t("payment.total@@Total")}</span>
                      <span class="text-primary">
                        {booking.currency === "USD" ? "$" : booking.currency}
                        {booking.total_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="divider"></div>

                {/* Payment Method Info */}
                <div class="rounded-lg bg-gray-50 p-4 ring-2 ring-primary">
                  <div class="mb-2 flex items-center gap-3">
                    <img
                      src="https://imagedelivery.net/qcaLCK1uCdpYtBNx7SBE1g/02907a90-b88c-450b-a2c0-3acad81fc900/public"
                      alt="Bank of Maldives"
                      width={40}
                      height={40}
                      class="h-10 w-auto"
                    />
                    <div>
                      <p class="font-semibold text-gray-800">
                        {t("payment.bmlPay@@BML Pay")}
                      </p>
                      <p class="text-sm text-gray-600">
                        {t(
                          "payment.bmlDesc@@Secure payment via Bank of Maldives",
                        )}
                      </p>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500">
                    {t(
                      "payment.redirectNotice@@You will be redirected to BML's secure payment page to complete your payment.",
                    )}
                  </p>
                </div>

                {/* Pay Button */}
                <Form action={initiatePayment}>
                  <input type="hidden" name="booking_id" value={booking.id} />
                  <input
                    type="hidden"
                    name="amount"
                    value={booking.total_price.toString()}
                  />
                  <input
                    type="hidden"
                    name="currency"
                    value={booking.currency}
                  />

                  <button
                    type="submit"
                    class="btn btn-primary btn-lg w-full"
                    disabled={initiatePayment.isRunning}
                  >
                    {initiatePayment.isRunning ? (
                      <>
                        <span class="loading loading-spinner loading-sm"></span>
                        {t("payment.processing@@Processing...")}
                      </>
                    ) : (
                      <>
                        <svg
                          class="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        {t("payment.payNow@@Pay Now")} -{" "}
                        {booking.currency === "USD" ? "$" : booking.currency}
                        {booking.total_price.toFixed(2)}
                      </>
                    )}
                  </button>
                </Form>

              </div>

              {/* Cancel Link */}
              <div class="border-t border-gray-200 bg-gray-50 px-6 py-4 text-center">
                <Link
                  href={`/bookings/${booking.id}/confirmation`}
                  class="hover:text-primary text-sm text-gray-600"
                >
                  {t("payment.cancel@@Cancel and return to booking")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
});

export const head: DocumentHead = {
    title: 'Complete Payment | Rihigo',
    meta: [
        {
            name: 'description',
            content: 'Complete your booking payment securely',
        },
        {
            name: 'robots',
            content: 'noindex, nofollow',
        },
    ],
};
