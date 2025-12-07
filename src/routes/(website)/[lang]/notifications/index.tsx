import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { inlineTranslate } from "qwik-speak";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { Notification, NotificationType } from "~/types/notification";
import { NotificationItem } from "~/components/notifications/NotificationItem";

export const useNotificationsData = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get("session");

  if (!session?.user) {
    const callbackUrl = encodeURIComponent(requestEvent.url.pathname);
    throw requestEvent.redirect(302, `/auth/sign-in?callbackUrl=${callbackUrl}`);
  }

  const result = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.notifications.list(token, { page: 1, page_size: 50 });
  });

  return {
    notifications: result.data || [],
    pagination: result.pagination_data,
  };
});

type FilterType = "all" | "unread" | NotificationType;

export default component$(() => {
  const t = inlineTranslate();
  const data = useNotificationsData();
  const filter = useSignal<FilterType>("all");

  // Filter notifications based on selected filter
  const filteredNotifications = data.value.notifications.filter((n: Notification) => {
    if (filter.value === "all") return true;
    if (filter.value === "unread") return !n.is_read;
    return n.type === filter.value;
  });

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "all", label: t("notifications.filter.all@@All") },
    { key: "unread", label: t("notifications.filter.unread@@Unread") },
    { key: "booking_created", label: t("notifications.filter.bookings@@Bookings") },
    { key: "payment_received", label: t("notifications.filter.payments@@Payments") },
    { key: "ticket_reply", label: t("notifications.filter.support@@Support") },
    { key: "system_announcement", label: t("notifications.filter.announcements@@Announcements") },
  ];

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto py-8 max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800">
            {t("notifications.title@@Notifications")}
          </h1>
          <p class="text-gray-600 mt-1">
            {t("notifications.subtitle@@Stay updated with your bookings and activities")}
          </p>
        </div>

        {/* Filters */}
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div class="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                type="button"
                class={`btn btn-sm ${filter.value === btn.key ? "btn-primary" : "btn-ghost"}`}
                onClick$={() => (filter.value = btn.key)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div class="py-12 text-center">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h3 class="mt-4 text-lg font-medium text-gray-900">
                {t("notifications.empty.title@@No notifications")}
              </h3>
              <p class="mt-2 text-sm text-gray-500">
                {filter.value === "unread"
                  ? t("notifications.empty.unread@@You're all caught up!")
                  : t("notifications.empty.default@@No notifications match your filter.")}
              </p>
            </div>
          ) : (
            <div class="divide-y divide-gray-200">
              {filteredNotifications.map((notification: Notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        {data.value.notifications.length > 0 && (
          <div class="mt-4 text-sm text-gray-500 text-center">
            {t("notifications.stats@@Showing {{count}} notifications", {
              count: filteredNotifications.length.toString(),
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Notifications - Rihigo",
  meta: [
    {
      name: "description",
      content: "View your notifications and stay updated with your bookings",
    },
  ],
};
