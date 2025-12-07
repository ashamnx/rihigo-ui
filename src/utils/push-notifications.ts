/**
 * Push Notification Utilities
 * Handles web push notification setup, permission, and registration
 */

/**
 * Check if push notifications are supported in the current browser
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 * @returns The permission status after the request
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }
  return await Notification.requestPermission();
}

/**
 * Convert VAPID key from base64 URL-safe to Uint8Array
 * @param base64String - Base64 URL-safe encoded VAPID public key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications and get the subscription endpoint
 * @param vapidPublicKey - The VAPID public key from the server
 * @returns The push subscription endpoint URL, or null if subscription failed
 */
export async function subscribeToPush(vapidPublicKey: string): Promise<string | null> {
  if (!isPushSupported()) {
    console.warn("Push notifications are not supported");
    return null;
  }

  // Check permission
  const permission = await requestPermission();
  if (permission !== "granted") {
    console.warn("Push notification permission denied");
    return null;
  }

  try {
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // Return the endpoint (which contains the token for FCM)
    return subscription.endpoint;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return null;
  }
}

/**
 * Get the full push subscription object
 * @returns The PushSubscription object or null
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Failed to get push subscription:", error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * @returns true if unsubscribed successfully, false otherwise
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    return false;
  }
}

/**
 * Show a local notification (for testing or when app is in foreground)
 * @param title - Notification title
 * @param options - Notification options
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushSupported()) {
    console.warn("Notifications are not supported");
    return;
  }

  const permission = getPermissionStatus();
  if (permission !== "granted") {
    console.warn("Notification permission not granted");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: "/assets/icons/icon-192x192.png",
      badge: "/assets/icons/badge-72x72.png",
      ...options,
    });
  } catch (error) {
    console.error("Failed to show notification:", error);
  }
}

/**
 * Check if the app currently has an active push subscription
 */
export async function hasActivePushSubscription(): Promise<boolean> {
  const subscription = await getPushSubscription();
  return subscription !== null;
}
