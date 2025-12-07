import {
  component$,
  createContextId,
  type Signal,
  Slot,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  useContext,
  $,
  type QRL,
  noSerialize,
  type NoSerialize,
} from "@builder.io/qwik";
import type { Notification, WebSocketMessage, Toast } from "~/types/notification";
import { useToast } from "~/context/toast-context";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";
const WS_RECONNECT_DELAY = 5000; // 5 seconds

export interface NotificationContextType {
  notifications: Signal<Notification[]>;
  unreadCount: Signal<number>;
  isConnected: Signal<boolean>;
  isLoading: Signal<boolean>;
  hasMore: Signal<boolean>;
  fetchNotifications: QRL<(page?: number, reset?: boolean) => Promise<void>>;
  fetchUnreadCount: QRL<() => Promise<void>>;
  markAsRead: QRL<(id: string) => Promise<void>>;
  markAllAsRead: QRL<() => Promise<void>>;
  deleteNotification: QRL<(id: string) => Promise<void>>;
}

export const NotificationContext =
  createContextId<NotificationContextType>("notification-context");

interface NotificationProviderProps {
  token?: string;
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
}

/**
 * Notification Provider Component
 * Manages notification state and WebSocket connection for real-time updates
 */
export const NotificationProvider = component$<NotificationProviderProps>(
  ({ token, initialNotifications = [], initialUnreadCount = 0 }) => {
    const notifications = useSignal<Notification[]>(initialNotifications);
    const unreadCount = useSignal(initialUnreadCount);
    const isConnected = useSignal(false);
    const isLoading = useSignal(false);
    const hasMore = useSignal(true);
    const currentPage = useSignal(1);
    const wsRef = useSignal<NoSerialize<WebSocket> | null>(null);
    const reconnectTimeoutRef = useSignal<NoSerialize<ReturnType<typeof setTimeout>> | null>(null);
    // Store addToast function reference with noSerialize to avoid Qwik serialization issues
    const addToastRef = useSignal<NoSerialize<(toast: Omit<Toast, "id">) => void> | null>(null);

    // Get toast context - useToast must be called at component top level
    const toastContext = useToast();

    // Store the addToast function reference for use in useVisibleTask$
    // eslint-disable-next-line qwik/valid-lexical-scope
    if (!addToastRef.value) {
      addToastRef.value = noSerialize((toast: Omit<Toast, "id">) => {
        void toastContext.addToast(toast);
      });
    }

    const fetchNotifications = $(async (page = 1, reset = false) => {
      if (!token) return;

      isLoading.value = true;
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/notifications?page=${page}&page_size=20`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json() as {
          success: boolean;
          data?: Notification[];
          pagination_data?: { page: number; total_pages: number };
        };

        if (data.success) {
          const newNotifications = data.data || [];
          if (reset || page === 1) {
            notifications.value = newNotifications;
          } else {
            notifications.value = [...notifications.value, ...newNotifications];
          }
          currentPage.value = page;

          // Check if there are more pages
          const pagination = data.pagination_data;
          if (pagination) {
            hasMore.value = pagination.page < pagination.total_pages;
          } else {
            hasMore.value = newNotifications.length === 20;
          }
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        isLoading.value = false;
      }
    });

    const fetchUnreadCount = $(async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json() as {
          success: boolean;
          data?: { count: number };
        };

        if (data.success && data.data) {
          unreadCount.value = data.data.count;
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    });

    const markAsRead = $(async (id: string) => {
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json() as { success: boolean };

        if (data.success) {
          // Update local state
          const notification = notifications.value.find((n) => n.id === id);
          if (notification && !notification.is_read) {
            notifications.value = notifications.value.map((n) =>
              n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
            );
            unreadCount.value = Math.max(0, unreadCount.value - 1);
          }
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    });

    const markAllAsRead = $(async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json() as { success: boolean };

        if (data.success) {
          // Update local state
          notifications.value = notifications.value.map((n) => ({
            ...n,
            is_read: true,
            read_at: n.read_at || new Date().toISOString(),
          }));
          unreadCount.value = 0;
        }
      } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
      }
    });

    const deleteNotification = $(async (id: string) => {
      if (!token) return;

      try {
        const notification = notifications.value.find((n) => n.id === id);
        const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json() as { success: boolean };

        if (data.success) {
          notifications.value = notifications.value.filter((n) => n.id !== id);
          if (notification && !notification.is_read) {
            unreadCount.value = Math.max(0, unreadCount.value - 1);
          }
        }
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    });

    // WebSocket connection and event handling
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      if (!token) return;

      const connectWebSocket = () => {
        // Determine WebSocket protocol based on current location
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const apiHost = API_BASE_URL.replace(/^https?:\/\//, "");
        // Pass token via query parameter - standard approach for browser WebSocket auth
        // Note: Browser WebSocket API doesn't support Authorization headers
        const wsUrl = `${wsProtocol}//${apiHost}/api/ws/notifications?token=${encodeURIComponent(token)}`;

        try {
          const ws = new WebSocket(wsUrl);

          ws.onopen = () => {
            isConnected.value = true;
            console.log("WebSocket connected for notifications");
          };

          ws.onmessage = (event) => {
            try {
              const message: WebSocketMessage = JSON.parse(event.data);

              if (message.type === "notification" && message.data) {
                const notification = message.data as Notification;

                // Add new notification to the top of the list
                notifications.value = [notification, ...notifications.value];
                unreadCount.value += 1;

                // Show toast for new notification if addToast function is available
                if (addToastRef.value) {
                  const toastType =
                    notification.priority === "urgent"
                      ? "error"
                      : notification.priority === "high"
                        ? "warning"
                        : "info";

                  addToastRef.value({
                    type: toastType,
                    title: notification.title,
                    message: notification.body,
                    duration: notification.priority === "urgent" ? 10000 : 5000,
                  });
                }
              }

              if (message.type === "unread_count" && message.data) {
                unreadCount.value = (message.data as { count: number }).count;
              }

              if (message.type === "ping") {
                ws.send(JSON.stringify({ type: "pong" }));
              }
            } catch (error) {
              console.error("Failed to parse WebSocket message:", error);
            }
          };

          ws.onclose = () => {
            isConnected.value = false;
            console.log("WebSocket disconnected, reconnecting in 5s...");

            // Auto-reconnect after delay
            reconnectTimeoutRef.value = noSerialize(
              setTimeout(connectWebSocket, WS_RECONNECT_DELAY)
            );
          };

          ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            ws.close();
          };

          wsRef.value = noSerialize(ws);
        } catch (error) {
          console.error("Failed to create WebSocket:", error);
          // Retry after delay
          reconnectTimeoutRef.value = noSerialize(
            setTimeout(connectWebSocket, WS_RECONNECT_DELAY)
          );
        }
      };

      // Initial data fetch
      fetchNotifications(1, true);
      fetchUnreadCount();

      // Connect WebSocket
      connectWebSocket();

      // Cleanup on unmount
      cleanup(() => {
        if (wsRef.value) {
          wsRef.value.close();
        }
        if (reconnectTimeoutRef.value) {
          clearTimeout(reconnectTimeoutRef.value);
        }
      });
    });

    useContextProvider(NotificationContext, {
      notifications,
      unreadCount,
      isConnected,
      isLoading,
      hasMore,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    });

    return <Slot />;
  }
);

/**
 * Hook to use notification context
 */
export function useNotifications() {
  return useContext(NotificationContext);
}
