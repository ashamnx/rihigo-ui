import { component$, useSignal } from "@builder.io/qwik";
import { useNotifications } from "~/context/notification-context";
import { NotificationDropdown } from "./NotificationDropdown";

interface NotificationBellProps {
  isScrolled?: boolean;
  lang?: string;
}

/**
 * Notification Bell Component
 * Displays a bell icon with unread count badge and dropdown
 */
export const NotificationBell = component$<NotificationBellProps>(
  ({ isScrolled = false, lang = "en-US" }) => {
    const { unreadCount, isConnected } = useNotifications();
    const isOpen = useSignal(false);

    return (
      <div class="relative">
        <button
          type="button"
          class={`btn btn-ghost btn-circle btn-sm relative ${
            isScrolled ? "text-gray-700" : "text-white"
          }`}
          onClick$={() => (isOpen.value = !isOpen.value)}
          aria-label="Notifications"
          aria-expanded={isOpen.value}
        >
          {/* Bell Icon */}
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {/* Unread Badge */}
          {unreadCount.value > 0 && (
            <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-xs font-bold text-error-content">
              {unreadCount.value > 99 ? "99+" : unreadCount.value}
            </span>
          )}

          {/* Connection Status Indicator */}
          {!isConnected.value && (
            <span
              class="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-warning"
              title="Disconnected from real-time updates"
            />
          )}
        </button>

        {/* Dropdown */}
        {isOpen.value && (
          <>
            {/* Backdrop to close on click outside */}
            <div class="fixed inset-0 z-40" onClick$={() => (isOpen.value = false)} />
            <NotificationDropdown onClose$={() => (isOpen.value = false)} lang={lang} />
          </>
        )}
      </div>
    );
  }
);

export default NotificationBell;
