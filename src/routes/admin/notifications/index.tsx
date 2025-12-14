import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, routeAction$, Form } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type {
  NotificationType,
  NotificationPriority,
} from "~/types/notification";

export const useNotificationStats = routeLoader$(async (requestEvent) => {
  const result = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.admin.notifications.getStats(token);
  });
  return result.data || null;
});

export const useSendNotification = routeAction$(async (formData, requestEvent) => {
  const isBroadcast = formData.broadcast === "true";

  if (isBroadcast) {
    const userIds = formData.user_ids
      ? String(formData.user_ids)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
      : undefined;

    const result = await authenticatedRequest(requestEvent, async (token) => {
      return await apiClient.admin.notifications.broadcast(
        {
          type: formData.type as NotificationType,
          title: String(formData.title),
          body: String(formData.body),
          priority: (formData.priority as NotificationPriority) || "normal",
          action_url: formData.action_url ? String(formData.action_url) : undefined,
          user_ids: userIds,
        },
        token
      );
    });

    return {
      success: result.success,
      error: result.error_message,
      data: result.data as { count?: number } | undefined,
    };
  } else {
    const result = await authenticatedRequest(requestEvent, async (token) => {
      return await apiClient.admin.notifications.create(
        {
          user_id: String(formData.user_id),
          type: formData.type as NotificationType,
          title: String(formData.title),
          body: String(formData.body),
          priority: (formData.priority as NotificationPriority) || "normal",
          action_url: formData.action_url ? String(formData.action_url) : undefined,
        },
        token
      );
    });

    return {
      success: result.success,
      error: result.error_message,
      data: result.data as { count?: number } | undefined,
    };
  }
});

export default component$(() => {
  const stats = useNotificationStats();
  const sendAction = useSendNotification();
  const activeTab = useSignal<"send" | "stats">("send");
  const isBroadcast = useSignal(false);

  const notificationTypes: { value: NotificationType; label: string }[] = [
    { value: "system_announcement", label: "System Announcement" },
    { value: "booking_created", label: "Booking Created" },
    { value: "booking_confirmed", label: "Booking Confirmed" },
    { value: "booking_cancelled", label: "Booking Cancelled" },
    { value: "payment_received", label: "Payment Received" },
    { value: "ticket_reply", label: "Ticket Reply" },
    { value: "custom", label: "Custom" },
  ];

  const priorities: { value: NotificationPriority; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Notifications</h1>
          <p class="text-base-content/60 mt-1">Send and manage user notifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div class="tabs tabs-boxed bg-base-200 w-fit">
        <button
          type="button"
          class={`tab ${activeTab.value === "send" ? "tab-active" : ""}`}
          onClick$={() => (activeTab.value = "send")}
        >
          Send Notification
        </button>
        <button
          type="button"
          class={`tab ${activeTab.value === "stats" ? "tab-active" : ""}`}
          onClick$={() => (activeTab.value = "stats")}
        >
          Statistics
        </button>
      </div>

      {/* Send Tab */}
      {activeTab.value === "send" && (
        <div class="card bg-base-200">
          <div class="card-body">
            <Form action={sendAction} class="space-y-4">
              {/* Broadcast Toggle */}
              <div class="form-control">
                <label class="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    name="broadcast"
                    value="true"
                    checked={isBroadcast.value}
                    class="toggle toggle-primary"
                    onChange$={(e) => {
                      isBroadcast.value = (e.target as HTMLInputElement).checked;
                    }}
                  />
                  <div>
                    <span class="label-text font-medium">Broadcast Mode</span>
                    <p class="text-sm text-base-content/60">
                      Send to multiple users or all users
                    </p>
                  </div>
                </label>
              </div>

              {/* User Selection */}
              {!isBroadcast.value ? (
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">User ID</span>
                  </label>
                  <input
                    type="text"
                    name="user_id"
                    placeholder="Enter user ID (UUID)"
                    class="input input-bordered"
                    required={!isBroadcast.value}
                  />
                </div>
              ) : (
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">User IDs (optional, comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    name="user_ids"
                    placeholder="Leave empty to send to all users"
                    class="input input-bordered"
                  />
                  <label class="label">
                    <span class="label-text-alt">Empty = broadcast to all users</span>
                  </label>
                </div>
              )}

              {/* Notification Type */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Type</span>
                </label>
                <select name="type" class="select select-bordered" required>
                  {notificationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Priority</span>
                </label>
                <select name="priority" class="select select-bordered">
                  {priorities.map((priority) => (
                    <option
                      key={priority.value}
                      value={priority.value}
                      selected={priority.value === "normal"}
                    >
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Title</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Notification title"
                  class="input input-bordered"
                  required
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Message</span>
                </label>
                <textarea
                  name="body"
                  placeholder="Notification message"
                  class="textarea textarea-bordered h-24"
                  required
                  maxLength={500}
                />
              </div>

              {/* Action URL */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Action URL (optional)</span>
                </label>
                <input
                  type="text"
                  name="action_url"
                  placeholder="/bookings/123 or https://example.com"
                  class="input input-bordered"
                />
                <label class="label">
                  <span class="label-text-alt">
                    URL to navigate when notification is clicked
                  </span>
                </label>
              </div>

              <div class="card-actions justify-end pt-4">
                <button
                  type="submit"
                  class={`btn btn-primary ${sendAction.isRunning ? "loading" : ""}`}
                  disabled={sendAction.isRunning}
                >
                  {isBroadcast.value ? "Send Broadcast" : "Send Notification"}
                </button>
              </div>

              {sendAction.value?.success && (
                <div class="alert alert-success">
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {sendAction.value.data?.count
                      ? `Notification sent to ${sendAction.value.data.count} users!`
                      : "Notification sent successfully!"}
                  </span>
                </div>
              )}

              {sendAction.value?.error && (
                <div class="alert alert-error">
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{sendAction.value.error}</span>
                </div>
              )}
            </Form>
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab.value === "stats" && (
        <div class="space-y-6">
          {stats.value ? (
            <>
              {/* Overview Stats */}
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div class="stat bg-base-200 rounded-xl">
                  <div class="stat-title">Total Sent</div>
                  <div class="stat-value text-primary">
                    {stats.value.total_sent.toLocaleString() || 0}
                  </div>
                </div>
                <div class="stat bg-base-200 rounded-xl">
                  <div class="stat-title">Delivered</div>
                  <div class="stat-value text-success">
                    {stats.value.total_delivered.toLocaleString() || 0}
                  </div>
                </div>
                <div class="stat bg-base-200 rounded-xl">
                  <div class="stat-title">Failed</div>
                  <div class="stat-value text-error">
                    {stats.value.total_failed.toLocaleString() || 0}
                  </div>
                </div>
                <div class="stat bg-base-200 rounded-xl">
                  <div class="stat-title">Read</div>
                  <div class="stat-value text-info">
                    {stats.value.total_read.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* By Channel */}
              {stats.value.by_channel && Object.keys(stats.value.by_channel).length > 0 && (
                <div class="card bg-base-200">
                  <div class="card-body">
                    <h3 class="card-title">By Channel</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {Object.entries(stats.value.by_channel).map(([channel, count]) => (
                        <div key={channel} class="bg-base-100 rounded-lg p-4 text-center">
                          <p class="text-sm text-base-content/60 capitalize">
                            {channel.replace(/_/g, " ")}
                          </p>
                          <p class="text-2xl font-bold">{count.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* By Type */}
              {stats.value.by_type && Object.keys(stats.value.by_type).length > 0 && (
                <div class="card bg-base-200">
                  <div class="card-body">
                    <h3 class="card-title">By Type</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {Object.entries(stats.value.by_type).map(([type, count]) => (
                        <div key={type} class="bg-base-100 rounded-lg p-4">
                          <p class="text-sm text-base-content/60 capitalize">
                            {type.replace(/_/g, " ")}
                          </p>
                          <p class="text-2xl font-bold">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div class="text-center py-12">
              <p class="text-base-content/60">No statistics available yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Notifications | Admin | Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage and send notifications",
    },
  ],
};
