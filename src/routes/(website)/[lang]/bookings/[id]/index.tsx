import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  Link,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { inlineTranslate } from "qwik-speak";
import { authenticatedRequest, apiClient } from "~/utils/api-client";

export const useBookingData = routeLoader$(async (requestEvent) => {
  const bookingId = requestEvent.params.id;

  const response = await authenticatedRequest(requestEvent, (token) =>
    apiClient.bookings.getById(bookingId, token)
  );

  if (!response.success) {
    return {
      success: false,
      data: null,
      error: response.error_message || "Booking not found",
    };
  }

  return {
    success: true,
    data: response.data,
    error: null,
  };
});

export default component$(() => {
  const bookingDataResponse = useBookingData();
  const location = useLocation();
  const t = inlineTranslate();
  const lang = location.params.lang || "en-US";

  if (!bookingDataResponse.value.success || !bookingDataResponse.value.data) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">
            {t("booking.error@@Booking Not Found")}
          </h1>
          <p class="text-gray-600 mb-6">{bookingDataResponse.value.error}</p>
          <Link href={`/${lang}/bookings`} class="btn btn-primary">
            {t("booking.viewBookings@@View My Bookings")}
          </Link>
        </div>
      </div>
    );
  }

  const booking = bookingDataResponse.value.data;
  const bookingDate = new Date(booking.booking_date);
  const createdDate = new Date(booking.created_at);

  const vendorStatus = booking.vendor_confirmation_status || "pending";
  const isConfirmed = vendorStatus === "confirmed";
  const isRejected = vendorStatus === "rejected";

  const statusColor = isConfirmed
    ? "bg-primary"
    : isRejected
      ? "bg-red-600"
      : "bg-amber-500";

  const statusBadge = isConfirmed
    ? "badge-success"
    : isRejected
      ? "badge-error"
      : "badge-warning";

  const statusLabel = isConfirmed
    ? t("booking.statusConfirmed@@CONFIRMED")
    : isRejected
      ? t("booking.statusRejected@@REJECTED")
      : t("booking.statusPending@@PENDING");

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div class="mb-6">
          <nav class="text-sm text-gray-500">
            <Link href={`/${lang}/bookings`} class="hover:text-primary">
              {t("booking.breadcrumbBookings@@My Bookings")}
            </Link>
            <span class="mx-2">/</span>
            <span class="text-gray-800">
              {t("booking.breadcrumbDetails@@Booking Details")}
            </span>
          </nav>
        </div>

        <div class="max-w-3xl mx-auto">
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Booking ID Header */}
            <div class={`px-6 py-4 ${statusColor} text-white`}>
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm opacity-90">
                    {t("booking.bookingId@@Booking ID")}
                  </p>
                  <p class="text-lg font-bold">{booking.id}</p>
                </div>
                <div class="text-right space-y-1">
                  <span class={`badge ${statusBadge}`}>{statusLabel}</span>
                </div>
              </div>
            </div>

            <div class="p-6 space-y-6">
              {/* Activity Information */}
              {booking.activity && (
                <div>
                  <h2 class="text-lg font-semibold text-gray-800 mb-3">
                    {t("booking.activityDetails@@Activity Details")}
                  </h2>
                  <div class="flex gap-4">
                    {booking.activity.images &&
                      booking.activity.images.length > 0 && (
                        <img
                          src={booking.activity.images[0]}
                          alt={booking.activity.title}
                          width={96}
                          height={96}
                          class="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                    <div>
                      <Link
                        href={
                          booking.activity.slug
                            ? `/${lang}/activities/${booking.activity.slug}`
                            : undefined
                        }
                        class="font-semibold text-gray-900 hover:text-primary"
                      >
                        {booking.activity.title}
                      </Link>
                      {booking.package && (
                        <p class="text-sm text-gray-600">
                          {booking.package.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div class="divider" />

              {/* Booking Information */}
              <div>
                <h2 class="text-lg font-semibold text-gray-800 mb-3">
                  {t("booking.bookingInfo@@Booking Information")}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600">
                      {t("booking.date@@Date")}
                    </p>
                    <p class="font-semibold">
                      {bookingDate.toLocaleDateString(lang, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">
                      {t("booking.people@@Number of People")}
                    </p>
                    <p class="font-semibold">{booking.number_of_people}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">
                      {t("booking.bookedOn@@Booked On")}
                    </p>
                    <p class="font-semibold">
                      {createdDate.toLocaleDateString(lang, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">
                      {t("booking.bookingStatus@@Booking Status")}
                    </p>
                    <span
                      class={`badge ${
                        booking.status === "confirmed"
                          ? "badge-success"
                          : booking.status === "completed"
                            ? "badge-info"
                            : booking.status === "cancelled"
                              ? "badge-error"
                              : "badge-warning"
                      }`}
                    >
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div class="divider" />

              {/* Guest Information */}
              {booking.customer_info && (
                <>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-800 mb-3">
                      {t("booking.guestInfo@@Guest Information")}
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p class="text-sm text-gray-600">
                          {t("booking.name@@Name")}
                        </p>
                        <p class="font-semibold">
                          {booking.customer_info.full_name}
                        </p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-600">
                          {t("booking.email@@Email")}
                        </p>
                        <p class="font-semibold">
                          {booking.customer_info.email}
                        </p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-600">
                          {t("booking.phone@@Phone")}
                        </p>
                        <p class="font-semibold">
                          {booking.customer_info.phone}
                        </p>
                      </div>
                      {booking.customer_info.nationality && (
                        <div>
                          <p class="text-sm text-gray-600">
                            {t("booking.nationality@@Nationality")}
                          </p>
                          <p class="font-semibold">
                            {booking.customer_info.nationality}
                          </p>
                        </div>
                      )}
                    </div>
                    {booking.customer_info.special_requests && (
                      <div class="mt-4">
                        <p class="text-sm text-gray-600">
                          {t("booking.specialRequests@@Special Requests")}
                        </p>
                        <p class="text-gray-800">
                          {booking.customer_info.special_requests}
                        </p>
                      </div>
                    )}
                  </div>
                  <div class="divider" />
                </>
              )}

              {/* Payment Information */}
              <div>
                <h2 class="text-lg font-semibold text-gray-800 mb-3">
                  {t("booking.payment@@Payment Information")}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm text-gray-600">
                      {t("booking.subtotal@@Subtotal")}
                    </p>
                    <p class="font-semibold">
                      {booking.currency === "USD" ? "$" : booking.currency}
                      {booking.subtotal?.toFixed(2)}
                    </p>
                  </div>
                  {booking.tax_amount > 0 && (
                    <div>
                      <p class="text-sm text-gray-600">
                        {t("booking.tax@@Tax")}
                      </p>
                      <p class="font-semibold">
                        {booking.currency === "USD" ? "$" : booking.currency}
                        {booking.tax_amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p class="text-sm text-gray-600">
                      {t("booking.total@@Total Amount")}
                    </p>
                    <p class="text-2xl font-bold text-primary">
                      {booking.currency === "USD" ? "$" : booking.currency}
                      {booking.total_price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600">
                      {t("booking.paymentStatus@@Payment Status")}
                    </p>
                    <span
                      class={`badge ${
                        booking.payment_status === "paid"
                          ? "badge-success"
                          : booking.payment_status === "pending"
                            ? "badge-warning"
                            : "badge-error"
                      }`}
                    >
                      {booking.payment_status.toUpperCase()}
                    </span>
                  </div>
                  {booking.payment_method && (
                    <div>
                      <p class="text-sm text-gray-600">
                        {t("booking.paymentMethod@@Payment Method")}
                      </p>
                      <p class="font-semibold capitalize">
                        {booking.payment_method.replace("_", " ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Notes (if rejected) */}
              {isRejected && booking.vendor_notes && (
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div class="flex gap-3">
                    <svg
                      class="w-6 h-6 text-red-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div class="text-sm">
                      <p class="font-semibold text-red-800 mb-1">
                        {t("booking.vendorMessage@@Message from Vendor")}
                      </p>
                      <p class="text-red-700">{booking.vendor_notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p class="text-sm font-semibold text-gray-700 mb-1">
                    {t("booking.notes@@Notes")}
                  </p>
                  <p class="text-sm text-gray-600">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div class="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                {vendorStatus === "confirmed" &&
                  booking.payment_status === "pending" && (
                    <Link
                      href={`/${lang}/bookings/${booking.id}/pay`}
                      class="btn btn-success gap-1"
                    >
                      <svg
                        class="w-4 h-4"
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
                      {t("booking.payNow@@Pay Now")}
                    </Link>
                  )}
                <Link href={`/${lang}/bookings`} class="btn btn-primary">
                  {t("booking.viewAllBookings@@View All Bookings")}
                </Link>
                {booking.activity?.slug && (
                  <Link
                    href={`/${lang}/activities/${booking.activity.slug}`}
                    class="btn btn-outline"
                  >
                    {t("booking.viewActivity@@View Activity")}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Booking Details | Rihigo",
  meta: [
    {
      name: "description",
      content: "View your booking details",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
};
