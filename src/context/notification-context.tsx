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
  useTask$,
} from "@builder.io/qwik";
import type { ActionStore } from "@builder.io/qwik-city";
import type { Notification, WebSocketMessage, Toast } from "~/types/notification";
import { useToast } from "~/context/toast-context";

const WS_RECONNECT_DELAY = 5000; // 5 seconds

interface ActionResult {
  success: boolean;
  error?: string;
}

export interface NotificationContextType {
  notifications: Signal<Notification[]>;
  unreadCount: Signal<number>;
  isConnected: Signal<boolean>;
  markAsRead: QRL<(id: string) => void>;
  markAllAsRead: QRL<() => void>;
  deleteNotification: QRL<(id: string) => void>;
}

export const NotificationContext =
  createContextId<NotificationContextType>("notification-context");

interface NotificationProviderProps {
  token?: string;
  initialNotifications?: Notification[];
  initialUnreadCount?: number;
  markReadAction: ActionStore<ActionResult, Record<string, unknown>, true>;
  markAllReadAction: ActionStore<ActionResult, Record<string, unknown>, true>;
  deleteAction: ActionStore<ActionResult, Record<string, unknown>, true>;
}

/**
 * Notification Provider Component
 * Manages notification state and WebSocket connection for real-time updates
 */
export const NotificationProvider = component$<NotificationProviderProps>(
  ({
    token,
    initialNotifications = [],
    initialUnreadCount = 0,
    markReadAction,
    markAllReadAction,
    deleteAction,
  }) => {
    const notifications = useSignal<Notification[]>(initialNotifications);
    const unreadCount = useSignal(initialUnreadCount);
    const isConnected = useSignal(false);
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

    // Track action results to update local state
    useTask$(({ track }) => {
      track(() => markReadAction.value);
      // Action completed - local state already updated optimistically
    });

    useTask$(({ track }) => {
      track(() => markAllReadAction.value);
      // Action completed - local state already updated optimistically
    });

    useTask$(({ track }) => {
      track(() => deleteAction.value);
      // Action completed - local state already updated optimistically
    });

    const markAsRead = $((id: string) => {
      // Optimistic update
      const notification = notifications.value.find((n) => n.id === id);
      if (notification && !notification.is_read) {
        notifications.value = notifications.value.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        );
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      // Submit action
      markReadAction.submit({ id });
    });

    const markAllAsRead = $(() => {
      // Optimistic update
      notifications.value = notifications.value.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString(),
      }));
      unreadCount.value = 0;
      // Submit action
      markAllReadAction.submit({});
    });

    const deleteNotification = $((id: string) => {
      // Optimistic update
      const notification = notifications.value.find((n) => n.id === id);
      notifications.value = notifications.value.filter((n) => n.id !== id);
      if (notification && !notification.is_read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      // Submit action
      deleteAction.submit({ id });
    });

    // WebSocket connection for real-time updates
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      if (!token) return;

      const connectWebSocket = () => {
        // Determine WebSocket protocol based on current location
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        // Use current host for WebSocket - nginx proxies /api/ws/ to the backend
        const wsHost = window.location.host;
        // Pass token via query parameter - standard approach for browser WebSocket auth
        // Note: Browser WebSocket API doesn't support Authorization headers
        const wsUrl = `${wsProtocol}//${wsHost}/api/ws/notifications?token=${encodeURIComponent(token)}`;

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
