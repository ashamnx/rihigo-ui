import { component$, $, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { useNotifications } from "~/context/notification-context";
import type { Notification, NotificationType, NotificationPriority } from "~/types/notification";

/**
 * Icons for different notification types
 */
const TypeIcon = component$<{ type: NotificationType }>(({ type }) => {
  switch (type) {
    case "booking_created":
    case "booking_confirmed":
    case "booking_cancelled":
      return (
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case "payment_received":
      return (
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "ticket_reply":
      return (
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    case "system_announcement":
    case "custom":
    default:
      return (
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      );
  }
});

/**
 * Priority-based background colors
 */
const priorityColors: Record<NotificationPriority, string> = {
  urgent: "bg-error/10 text-error",
  high: "bg-warning/10 text-warning",
  normal: "bg-info/10 text-info",
  low: "bg-base-200 text-base-content/60",
};

/**
 * Format relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
  onAction$?: QRL<() => void>;
}

/**
 * Notification Item Component
 * Displays a single notification with icon, content, and actions
 */
export const NotificationItem = component$<NotificationItemProps>(
  ({ notification, compact = false, onAction$ }) => {
    const { markAsRead, deleteNotification } = useNotifications();

    const handleClick = $(async () => {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
      if (onAction$) {
        await onAction$();
      }
    });

    const handleDelete = $(async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      await deleteNotification(notification.id);
    });

    const content = (
      <div
        class={`flex gap-3 p-4 ${!notification.is_read ? "bg-primary/5" : ""} hover:bg-base-200 transition-colors cursor-pointer`}
      >
        {/* Icon */}
        <div
          class={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${priorityColors[notification.priority]}`}
        >
          <TypeIcon type={notification.type} />
        </div>

        {/* Content */}
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <p class={`text-sm ${!notification.is_read ? "font-semibold" : ""} line-clamp-1`}>
              {notification.title}
            </p>
            {!compact && (
              <button
                type="button"
                class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick$={handleDelete}
                aria-label="Delete notification"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <p class="text-sm text-base-content/70 mt-0.5 line-clamp-2">{notification.body}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs text-base-content/50">
              {formatRelativeTime(notification.created_at)}
            </span>
            {!notification.is_read && <span class="w-2 h-2 rounded-full bg-primary" />}
            {notification.action_label && (
              <span class="text-xs text-primary font-medium">{notification.action_label}</span>
            )}
          </div>
        </div>
      </div>
    );

    // Wrap in Link if action_url exists
    if (notification.action_url) {
      return (
        <Link href={notification.action_url} onClick$={handleClick} class="group block">
          {content}
        </Link>
      );
    }

    return (
      <div onClick$={handleClick} class="group">
        {content}
      </div>
    );
  }
);

export default NotificationItem;
