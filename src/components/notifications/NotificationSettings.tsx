import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { Form, type ActionStore } from "@builder.io/qwik-city";
import { useToast } from "~/context/toast-context";

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

interface SaveActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface NotificationSettingsProps {
  initialPreferences: NotificationPreferences | null;
  saveAction: ActionStore<SaveActionResult, Record<string, unknown>, true>;
}

/**
 * Notification Settings Component
 * Allows users to configure their notification preferences
 */
export const NotificationSettings = component$<NotificationSettingsProps>(
  ({ initialPreferences, saveAction }) => {
    const { addToast } = useToast();

    // Local state for form values
    const emailEnabled = useSignal(initialPreferences?.email_enabled ?? true);
    const smsEnabled = useSignal(initialPreferences?.sms_enabled ?? false);
    const quietHoursEnabled = useSignal(!!initialPreferences?.quiet_hours_start);
    const quietHoursStart = useSignal(initialPreferences?.quiet_hours_start || "22:00");
    const quietHoursEnd = useSignal(initialPreferences?.quiet_hours_end || "08:00");

    // Show toast on action completion
    useTask$(({ track }) => {
      track(() => saveAction.value);

      if (saveAction.value?.success) {
        addToast({
          type: "success",
          message: saveAction.value.message || "Preferences saved successfully!",
        });
      } else if (saveAction.value?.error) {
        addToast({
          type: "error",
          message: saveAction.value.error,
        });
      }
    });

    return (
      <div class="space-y-6">
        <Form action={saveAction}>
          <div>
            <h3 class="text-lg font-semibold mb-4">Notification Channels</h3>

            {/* Email */}
            <div class="form-control mb-4">
              <label class="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  name="email_enabled"
                  value="true"
                  checked={emailEnabled.value}
                  class="toggle toggle-primary"
                  onChange$={(e) => {
                    emailEnabled.value = (e.target as HTMLInputElement).checked;
                  }}
                />
                <input type="hidden" name="email_enabled" value={emailEnabled.value ? "true" : "false"} />
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
                  checked={smsEnabled.value}
                  class="toggle toggle-primary"
                  onChange$={(e) => {
                    smsEnabled.value = (e.target as HTMLInputElement).checked;
                  }}
                />
                <input type="hidden" name="sms_enabled" value={smsEnabled.value ? "true" : "false"} />
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
                  checked={quietHoursEnabled.value}
                  class="toggle toggle-primary"
                  onChange$={(e) => {
                    quietHoursEnabled.value = (e.target as HTMLInputElement).checked;
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

            {quietHoursEnabled.value && (
              <div class="grid grid-cols-2 gap-4 pl-12">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Start Time</span>
                  </label>
                  <input
                    type="time"
                    name="quiet_hours_start"
                    value={quietHoursStart.value}
                    class="input input-bordered"
                    onChange$={(e) => {
                      quietHoursStart.value = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">End Time</span>
                  </label>
                  <input
                    type="time"
                    name="quiet_hours_end"
                    value={quietHoursEnd.value}
                    class="input input-bordered"
                    onChange$={(e) => {
                      quietHoursEnd.value = (e.target as HTMLInputElement).value;
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div class="pt-4">
            <button
              type="submit"
              class={`btn btn-primary ${saveAction.isRunning ? "loading" : ""}`}
              disabled={saveAction.isRunning}
            >
              {saveAction.isRunning ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </Form>
      </div>
    );
  }
);

export default NotificationSettings;
