/*
 * WHAT IS THIS FILE?
 *
 * The service-worker.ts file is used to have state of the art prefetching.
 * https://qwik.dev/qwikcity/prefetching/overview/
 *
 * Qwik uses a service worker to speed up your site and reduce latency, ie, not used in the traditional way of offline.
 * You can also use this file to add more functionality that runs in the service worker.
 *
 * Extended to support push notifications for the notification system.
 */
import { setupServiceWorker } from "@builder.io/qwik-city/service-worker";

setupServiceWorker();

addEventListener("install", () => self.skipWaiting());

addEventListener("activate", () => self.clients.claim());

// Extend ServiceWorkerGlobalScope for push notifications
declare const self: ServiceWorkerGlobalScope & {
  skipWaiting: () => Promise<void>;
  clients: Clients;
  registration: ServiceWorkerRegistration;
};

/**
 * Push Notification Handler
 * Receives push messages from the server and displays notifications
 */
self.addEventListener("push", (event) => {
  const pushEvent = event as PushEvent;
  if (!pushEvent.data) {
    console.log("Push event received but no data");
    return;
  }

  try {
    const data = pushEvent.data.json() as {
      id?: string;
      title: string;
      body?: string;
      message?: string;
      action_url?: string;
      action_label?: string;
      priority?: string;
    };

    const options: NotificationOptions = {
      body: data.body || data.message,
      icon: "/assets/icons/icon-192x192.png",
      badge: "/assets/icons/badge-72x72.png",
      tag: data.id || `notification-${Date.now()}`,
      data: {
        url: data.action_url || "/",
        notificationId: data.id,
      },
      // Keep notification visible for urgent/high priority
      requireInteraction: data.priority === "urgent" || data.priority === "high",
    };

    pushEvent.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error("Failed to show push notification:", error);
  }
});

/**
 * Notification Click Handler
 * Handles clicks on push notifications
 */
self.addEventListener("notificationclick", (event) => {
  const notifEvent = event as NotificationEvent;
  notifEvent.notification.close();

  // Handle dismiss action
  if (notifEvent.action === "dismiss") {
    return;
  }

  const urlToOpen = (notifEvent.notification.data as { url?: string })?.url || "/";

  notifEvent.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open at this origin
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            (client as WindowClient).focus();
            // Navigate to the notification URL
            return (client as WindowClient).navigate(urlToOpen);
          }
        }
        // Open a new window if none exists
        return self.clients.openWindow(urlToOpen);
      })
  );
});

/**
 * Push Subscription Change Handler
 * Handles cases where the push subscription changes (e.g., expires)
 */
self.addEventListener("pushsubscriptionchange", () => {
  console.log("Push subscription changed, may need to re-register");
  // The app should handle re-registration when the user next visits
});
