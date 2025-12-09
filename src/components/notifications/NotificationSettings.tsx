import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { NotificationPreferences } from "~/types/notification";
import { useToast } from "~/context/toast-context";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";

interface NotificationSettingsProps {
  initialPreferences?: NotificationPreferences;
  token: string;
}

/**
 * Notification Settings Component
 * Allows users to configure their notification preferences
 */
export const NotificationSettings = component$<NotificationSettingsProps>(
  ({ initialPreferences, token }) => {
    const { addToast } = useToast();

    // Local state for preferences
    const preferences = useSignal<NotificationPreferences>(
      initialPreferences || {
        email_enabled: true,
        push_enabled: false,
        sms_enabled: false,
        telegram_enabled: false,
      }
    );

    // UI state
    const isLoading = useSignal(false);
    const isSaving = useSignal(false);

    // Fetch preferences on mount
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(async () => {
      if (!token || initialPreferences) return;

      isLoading.value = true;
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json() as {
          success: boolean;
          data?: NotificationPreferences;
        };
        if (data.success && data.data) {
          preferences.value = data.data;
        }
      } catch (error) {
        console.error("Failed to fetch notification preferences:", error);
      } finally {
        isLoading.value = false;
      }
    });

    // Save preferences
    const savePreferences = $(async () => {
      isSaving.value = true;
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(preferences.value),
        });
        const data = await response.json() as {
          success: boolean;
          error_message?: string;
        };

        if (data.success) {
          await addToast({
            type: "success",
            message: "Preferences saved successfully!",
          });
        } else {
          throw new Error(data.error_message || "Failed to save preferences");
        }
      } catch (error) {
        console.error("Failed to save preferences:", error);
        await addToast({
          type: "error",
          message: "Failed to save preferences. Please try again.",
        });
      } finally {
        isSaving.value = false;
      }
    });

    if (isLoading.value) {
      return (
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md" />
        </div>
      );
    }

    return (
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold mb-4">Notification Channels</h3>

          {/* Email */}
          <div class="form-control mb-4">
            <label class="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                checked={preferences.value.email_enabled}
                class="toggle toggle-primary"
                onChange$={(e) => {
                  preferences.value = {
                    ...preferences.value,
                    email_enabled: (e.target as HTMLInputElement).checked,
                  };
                }}
              />
              <div>
                <span class="label-text font-medium">Email Notifications</span>
                <p class="text-sm text-base-content/60">
                  Receive updates via email
                </p>
              </div>
            </label>
          </div>

          {/* SMS */}
          <div class="form-control mb-4">
            <label class="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                checked={preferences.value.sms_enabled}
                class="toggle toggle-primary"
                onChange$={(e) => {
                  preferences.value = {
                    ...preferences.value,
                    sms_enabled: (e.target as HTMLInputElement).checked,
                  };
                }}
              />
              <div>
                <span class="label-text font-medium">SMS Notifications</span>
                <p class="text-sm text-base-content/60">
                  Receive important updates via SMS
                </p>
              </div>
            </label>
          </div>

        </div>

        <div class="divider" />

        {/* Quiet Hours */}
        <div>
          <h4 class="font-medium mb-3">Quiet Hours</h4>
          <div class="form-control mb-4">
            <label class="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                checked={!!preferences.value.quiet_hours_start}
                class="toggle toggle-primary"
                onChange$={(e) => {
                  const checked = (e.target as HTMLInputElement).checked;
                  preferences.value = {
                    ...preferences.value,
                    quiet_hours_start: checked ? "22:00" : undefined,
                    quiet_hours_end: checked ? "08:00" : undefined,
                  };
                }}
              />
              <div>
                <span class="label-text font-medium">Enable Quiet Hours</span>
                <p class="text-sm text-base-content/60">
                  Mute non-urgent notifications during specified hours
                </p>
              </div>
            </label>
          </div>

          {preferences.value.quiet_hours_start && (
            <div class="grid grid-cols-2 gap-4 pl-12">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Start Time</span>
                </label>
                <input
                  type="time"
                  value={preferences.value.quiet_hours_start || "22:00"}
                  class="input input-bordered"
                  onChange$={(e) => {
                    preferences.value = {
                      ...preferences.value,
                      quiet_hours_start: (e.target as HTMLInputElement).value,
                    };
                  }}
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">End Time</span>
                </label>
                <input
                  type="time"
                  value={preferences.value.quiet_hours_end || "08:00"}
                  class="input input-bordered"
                  onChange$={(e) => {
                    preferences.value = {
                      ...preferences.value,
                      quiet_hours_end: (e.target as HTMLInputElement).value,
                    };
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div class="pt-4">
          <button
            type="button"
            class={`btn btn-primary ${isSaving.value ? "loading" : ""}`}
            onClick$={savePreferences}
            disabled={isSaving.value}
          >
            Save Preferences
          </button>
        </div>
      </div>
    );
  }
);

export default NotificationSettings;
