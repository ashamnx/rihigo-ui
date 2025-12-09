import { component$, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { useNotifications } from "~/context/notification-context";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  onClose$: QRL<() => void>;
  lang?: string;
}

/**
 * Notification Dropdown Component
 * Displays recent notifications in a dropdown panel
 */
export const NotificationDropdown = component$<NotificationDropdownProps>(
  ({ onClose$, lang = "en-US" }) => {
    const { notifications, unreadCount, markAllAsRead } = useNotifications();

    // Show only the 5 most recent notifications
    const recentNotifications = notifications.value.slice(0, 5);

    return (
      <div class="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-base-100 rounded-xl shadow-xl border border-base-300">
        {/* Header */}
        <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold">Notifications</h3>
            {unreadCount.value > 0 && (
              <span class="badge badge-primary badge-sm">{unreadCount.value} new</span>
            )}
          </div>
          {unreadCount.value > 0 && (
            <button
              type="button"
              class="text-sm text-primary hover:underline"
              onClick$={markAllAsRead}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div class="max-h-96 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div class="py-8 text-center">
              <svg
                class="mx-auto h-12 w-12 text-base-content/40"
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
              <p class="mt-2 text-sm text-base-content/60">No notifications yet</p>
            </div>
          ) : (
            <div class="divide-y divide-base-200">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onAction$={onClose$}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div class="border-t border-base-300 px-4 py-3">
          <Link
            href={`/${lang}/notifications`}
            class="block text-center text-sm text-primary hover:underline"
            onClick$={onClose$}
          >
            View all notifications
          </Link>
        </div>
      </div>
    );
  }
);

export default NotificationDropdown;
