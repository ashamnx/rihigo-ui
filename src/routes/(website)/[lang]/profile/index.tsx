import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import {
  Form,
  Link,
  routeAction$,
  routeLoader$,
  useLocation,
} from "@builder.io/qwik-city";
import { inlineTranslate } from "qwik-speak";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import { getUserBookings } from "~/services/booking-api";
import type { Booking } from "~/types/booking";
import type { UserProfile } from "~/types/api";

// Load user profile data
export const useUserProfile = routeLoader$<UserProfile | null>(async (requestEvent) => {
  const session = requestEvent.sharedMap.get("session");

  if (!session || !session.user) {
    const callbackUrl = encodeURIComponent(requestEvent.url.pathname);
    throw requestEvent.redirect(
      302,
      `/auth/sign-in?callbackUrl=${callbackUrl}`,
    );
  }

  const result = await authenticatedRequest<UserProfile>(requestEvent, async (token) => {
    return await apiClient.users.getProfile(token);
  });

  return result.data ?? null;
});

// Load recent bookings
export const useRecentBookings = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get("session");

  if (!session || !session.user) {
    return { success: false, data: [], pagination: null };
  }

  try {
    const token = session.accessToken || "";
    const response = await getUserBookings(token, { page: 1, page_size: 3 });
    return {
      success: true,
      data: response.data,
      pagination: response.pagination,
    };
  } catch (error) {
    console.error("Failed to load recent bookings:", error);
    return { success: false, data: [], pagination: null };
  }
});

// Update profile action
export const useUpdateProfile = routeAction$(async (formData, requestEvent) => {
  const session = requestEvent.sharedMap.get("session");

  if (!session || !session.user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const token = session.accessToken || "";
    const updates = {
      name: formData.name as string,
      phone: formData.phone as string,
      date_of_birth: formData.date_of_birth as string,
      nationality: formData.nationality as string,
    };

    const response = await apiClient.users.updateProfile(updates, token);

    if (response.success) {
      return {
        success: true,
        message: "Profile updated successfully",
      };
    } else {
      return {
        success: false,
        error: response.error_message || "Failed to update profile",
      };
    }
  } catch (error) {
    console.error("Failed to update profile:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
});

// Update preferences action
export const useUpdatePreferences = routeAction$(
  async (formData, requestEvent) => {
    const session = requestEvent.sharedMap.get("session");

    if (!session || !session.user) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    try {
      const token = session.accessToken || "";
      const updates = {
        preferences: {
          language: formData.language as string,
          currency: formData.currency as string,
          notifications: formData.notifications === "true",
        },
      };

      const response = await apiClient.users.updateProfile(updates, token);

      if (response.success) {
        return {
          success: true,
          message: "Preferences updated successfully",
        };
      } else {
        return {
          success: false,
          error: response.error_message || "Failed to update preferences",
        };
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update preferences",
      };
    }
  },
);

export default component$(() => {
  const profile = useUserProfile();
  const recentBookings = useRecentBookings();
  const updateProfileAction = useUpdateProfile();
  const updatePreferencesAction = useUpdatePreferences();
  const location = useLocation();
  const t = inlineTranslate();
  const lang = location.params.lang || "en-US";

  const activeTab = useSignal<"overview" | "bookings" | "settings">("overview");
  const isEditingProfile = useSignal(false);
  const isEditingPreferences = useSignal(false);

  if (!profile.value) {
    return (
      <div class="flex min-h-screen items-center justify-center">
        <div class="text-center">
          <h2 class="mb-2 text-2xl font-bold text-gray-800">Loading...</h2>
          <p class="text-gray-600">Please wait while we load your profile</p>
        </div>
      </div>
    );
  }

  const user = profile.value;
  const bookings = recentBookings.value.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "badge-success";
      case "pending":
        return "badge-warning";
      case "completed":
        return "badge-info";
      case "cancelled":
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <div class="border-b border-gray-200 bg-white">
        <div class="container mx-auto py-12 max-w-7xl px-6 lg:px-8">
          <div class="flex flex-col items-start gap-6 md:flex-row md:items-center">
            {/* Profile Avatar */}
            <div class="avatar">
              <div class="ring-primary ring-offset-base-100 h-24 w-24 rounded-full ring ring-offset-2">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    width={96}
                    height={96}
                  />
                ) : (
                  <div class="bg-primary text-primary-content flex items-center justify-center text-3xl font-bold">
                    {user.name?.charAt(0).toUpperCase() ||
                      user.email.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-800">
                {user.name || "User"}
              </h1>
              <p class="mt-1 text-gray-600">{user.email}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="badge badge-outline">{user.role}</span>
                {user.phone && (
                  <span class="badge badge-outline">{user.phone}</span>
                )}
                {user.nationality && (
                  <span class="badge badge-outline">{user.nationality}</span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div class="tabs tabs-boxed mt-6 bg-gray-100">
            <button
              class={`tab ${activeTab.value === "overview" ? "tab-active" : ""}`}
              onClick$={() => (activeTab.value = "overview")}
            >
              <svg
                class="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {t("profile.tabs.overview@@Overview")}
            </button>
            <button
              class={`tab ${activeTab.value === "bookings" ? "tab-active" : ""}`}
              onClick$={() => (activeTab.value = "bookings")}
            >
              <svg
                class="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {t("profile.tabs.bookings@@My Bookings")}
            </button>
            <button
              class={`tab ${activeTab.value === "settings" ? "tab-active" : ""}`}
              onClick$={() => (activeTab.value = "settings")}
            >
              <svg
                class="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t("profile.tabs.settings@@Settings")}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div class="container mx-auto py-12 max-w-7xl px-6 lg:px-8">
        {/* Overview Tab */}
        {activeTab.value === "overview" && (
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Profile Information Card */}
            <div class="card bg-white shadow-lg">
              <div class="card-body">
                <div class="mb-4 flex items-center justify-between">
                  <h2 class="card-title">
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {t("profile.info.title@@Personal Information")}
                  </h2>
                  <button
                    class="btn btn-sm btn-ghost"
                    onClick$={() =>
                      (isEditingProfile.value = !isEditingProfile.value)
                    }
                  >
                    {isEditingProfile.value
                      ? t("profile.cancel@@Cancel")
                      : t("profile.edit@@Edit")}
                  </button>
                </div>

                {!isEditingProfile.value ? (
                  <div class="space-y-4">
                    <div>
                      <label class="text-sm font-semibold text-gray-600">
                        {t("profile.info.name@@Full Name")}
                      </label>
                      <p class="text-gray-800">{user.name || "Not provided"}</p>
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-gray-600">
                        {t("profile.info.email@@Email")}
                      </label>
                      <p class="text-gray-800">{user.email}</p>
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-gray-600">
                        {t("profile.info.phone@@Phone")}
                      </label>
                      <p class="text-gray-800">
                        {user.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-gray-600">
                        {t("profile.info.dob@@Date of Birth")}
                      </label>
                      <p class="text-gray-800">
                        {user.date_of_birth || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-gray-600">
                        {t("profile.info.nationality@@Nationality")}
                      </label>
                      <p class="text-gray-800">
                        {user.nationality || "Not provided"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Form action={updateProfileAction} class="space-y-4">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          {t("profile.info.name@@Full Name")}
                        </span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={user.name || ""}
                        class="input input-bordered"
                      />
                    </div>
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          {t("profile.info.phone@@Phone")}
                        </span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={user.phone || ""}
                        class="input input-bordered"
                      />
                    </div>
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          {t("profile.info.dob@@Date of Birth")}
                        </span>
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={user.date_of_birth || ""}
                        class="input input-bordered"
                      />
                    </div>
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          {t("profile.info.nationality@@Nationality")}
                        </span>
                      </label>
                      <input
                        type="text"
                        name="nationality"
                        value={user.nationality || ""}
                        class="input input-bordered"
                      />
                    </div>
                    <div class="card-actions justify-end">
                      <button type="submit" class="btn btn-primary">
                        {t("profile.save@@Save Changes")}
                      </button>
                    </div>
                    {updateProfileAction.value?.success && (
                      <div class="alert alert-success">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-6 w-6 shrink-0 stroke-current"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{updateProfileAction.value.message}</span>
                      </div>
                    )}
                    {updateProfileAction.value?.error && (
                      <div class="alert alert-error">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-6 w-6 shrink-0 stroke-current"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{updateProfileAction.value.error}</span>
                      </div>
                    )}
                  </Form>
                )}
              </div>
            </div>

            {/* Account Statistics */}
            <div class="card bg-white shadow-lg">
              <div class="card-body">
                <h2 class="card-title">
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {t("profile.stats.title@@Account Statistics")}
                </h2>
                <div class="stats stats-vertical mt-4 shadow">
                  <div class="stat">
                    <div class="stat-figure text-primary">
                      <svg
                        class="h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div class="stat-title">
                      {t("profile.stats.totalBookings@@Total Bookings")}
                    </div>
                    <div class="stat-value text-primary">
                      {recentBookings.value.pagination?.total_count || 0}
                    </div>
                  </div>

                  <div class="stat">
                    <div class="stat-figure text-secondary">
                      <svg
                        class="h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div class="stat-title">
                      {t("profile.stats.memberSince@@Member Since")}
                    </div>
                    <div class="stat-value text-secondary text-xl">
                      {new Date(user.created_at).toLocaleDateString(lang, {
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div class="divider"></div>

                {/* Account Info */}
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">
                      {t("profile.stats.role@@Role")}
                    </span>
                    <span class="badge badge-primary">{user.role}</span>
                  </div>
                  {user.updated_at && (
                    <div class="flex justify-between">
                      <span class="text-sm text-gray-600">
                        {t("profile.stats.lastUpdated@@Last Updated")}
                      </span>
                      <span class="text-sm text-gray-800">
                        {new Date(user.updated_at).toLocaleDateString(lang)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preferences Card */}
            <div class="card bg-white shadow-lg lg:col-span-2">
              <div class="card-body">
                <div class="mb-4 flex items-center justify-between">
                  <h2 class="card-title">
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    {t("profile.preferences.title@@Preferences")}
                  </h2>
                  <button
                    class="btn btn-sm btn-ghost"
                    onClick$={() =>
                      (isEditingPreferences.value = !isEditingPreferences.value)
                    }
                  >
                    {isEditingPreferences.value
                      ? t("profile.cancel@@Cancel")
                      : t("profile.edit@@Edit")}
                  </button>
                </div>

                {!isEditingPreferences.value ? (
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label class="text-sm font-semibold text-gray-600">
                        {t("profile.preferences.language@@Language")}
                      </label>
                      <p class="text-gray-800">{user.preferences?.language || "en-US"}</p>
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-gray-600">
                        {t("profile.preferences.currency@@Currency")}
                      </label>
                      <p class="text-gray-800">{user.preferences?.currency || "USD"}</p>
                    </div>
                    <div>
                      <label class="text-sm font-semibold text-gray-600">
                        {t("profile.preferences.notifications@@Notifications")}
                      </label>
                      <p class="text-gray-800">
                        {user.preferences?.notifications
                          ? t("profile.enabled@@Enabled")
                          : t("profile.disabled@@Disabled")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Form
                    action={updatePreferencesAction}
                    class="grid grid-cols-1 gap-4 md:grid-cols-3"
                  >
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          {t("profile.preferences.language@@Language")}
                        </span>
                      </label>
                      <select
                        name="language"
                        value={user.preferences?.language || "en-US"}
                        class="select select-bordered"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="it-IT">Italiano</option>
                      </select>
                    </div>
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          {t("profile.preferences.currency@@Currency")}
                        </span>
                      </label>
                      <select
                        name="currency"
                        value={user.preferences?.currency || "USD"}
                        class="select select-bordered"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div class="form-control">
                      <label class="label cursor-pointer">
                        <span class="label-text">
                          {t(
                            "profile.preferences.notifications@@Notifications",
                          )}
                        </span>
                        <input
                          type="checkbox"
                          name="notifications"
                          value="true"
                          checked={user.preferences?.notifications}
                          class="toggle toggle-primary"
                        />
                      </label>
                    </div>
                    <div class="md:col-span-3">
                      <button type="submit" class="btn btn-primary">
                        {t("profile.save@@Save Changes")}
                      </button>
                    </div>
                    {updatePreferencesAction.value?.success && (
                      <div class="alert alert-success md:col-span-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-6 w-6 shrink-0 stroke-current"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{updatePreferencesAction.value.message}</span>
                      </div>
                    )}
                    {updatePreferencesAction.value?.error && (
                      <div class="alert alert-error md:col-span-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-6 w-6 shrink-0 stroke-current"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{updatePreferencesAction.value.error}</span>
                      </div>
                    )}
                  </Form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab.value === "bookings" && (
          <div>
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-2xl font-bold text-gray-800">
                {t("profile.bookings.recent@@Recent Bookings")}
              </h2>
              <Link href={`/${lang}/bookings`} class="btn btn-primary btn-sm">
                {t("profile.bookings.viewAll@@View All Bookings")}
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div class="card bg-white shadow-lg">
                <div class="card-body py-12 text-center">
                  <svg
                    class="mx-auto mb-4 h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 class="mb-2 text-xl font-semibold text-gray-800">
                    {t("profile.bookings.empty@@No bookings yet")}
                  </h3>
                  <p class="mb-6 text-gray-600">
                    {t(
                      "profile.bookings.emptyMessage@@Start exploring activities",
                    )}
                  </p>
                  <Link href={`/${lang}/activities`} class="btn btn-primary">
                    {t("profile.bookings.browse@@Browse Activities")}
                  </Link>
                </div>
              </div>
            ) : (
              <div class="space-y-4">
                {bookings.map((booking: Booking) => (
                  <div key={booking.id} class="card bg-white shadow-lg">
                    <div class="card-body">
                      <div class="flex flex-col gap-4 lg:flex-row">
                        {booking.activity?.images &&
                          booking.activity.images.length > 0 && (
                            <div class="flex-shrink-0">
                              <img
                                src={booking.activity.images[0]}
                                alt={booking.activity.title}
                                width={128}
                                height={128}
                                class="h-32 w-full rounded-lg object-cover lg:w-32"
                              />
                            </div>
                          )}
                        <div class="flex-1">
                          <div class="mb-2 flex items-start justify-between">
                            <div>
                              <h3 class="text-lg font-semibold">
                                {booking.activity?.title || "Activity"}
                              </h3>
                              {booking.package && (
                                <p class="text-sm text-gray-600">
                                  {booking.package.name}
                                </p>
                              )}
                            </div>
                            <div class="flex gap-2">
                              <span
                                class={`badge ${getStatusColor(booking.status)}`}
                              >
                                {booking.status}
                              </span>
                              <span
                                class={`badge ${booking.payment_status === 'paid' ? 'badge-success' : booking.payment_status === 'pending' ? 'badge-warning' : 'badge-ghost'}`}
                              >
                                {booking.payment_status}
                              </span>
                            </div>
                          </div>
                          <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                            <div>
                              <p class="text-gray-600">
                                {t("profile.bookings.date@@Date")}
                              </p>
                              <p class="font-semibold">
                                {new Date(
                                  booking.booking_date,
                                ).toLocaleDateString(lang, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <p class="text-gray-600">
                                {t("profile.bookings.people@@People")}
                              </p>
                              <p class="font-semibold">
                                {booking.number_of_people}
                              </p>
                            </div>
                            <div>
                              <p class="text-gray-600">
                                {t("profile.bookings.total@@Total")}
                              </p>
                              <p class="text-primary font-semibold">
                                {booking.currency === "USD"
                                  ? "$"
                                  : booking.currency}
                                {booking.total_price.toFixed(2)}
                              </p>
                            </div>
                            <div class="flex gap-2">
                              {booking.payment_status === "pending" && (
                                <Link
                                  href={`/${lang}/bookings/${booking.id}/pay`}
                                  class="btn btn-sm btn-success gap-1"
                                >
                                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                  {t("profile.bookings.pay@@Pay")}
                                </Link>
                              )}
                              <Link
                                href={`/${lang}/bookings/${booking.id}/confirmation`}
                                class="btn btn-sm btn-outline"
                              >
                                {t(
                                  "profile.bookings.viewDetails@@View Details",
                                )}
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab.value === "settings" && (
          <div class="space-y-6">
            <div class="card bg-white shadow-lg">
              <div class="card-body">
                <h2 class="card-title">
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  {t("profile.settings.security@@Security")}
                </h2>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold">
                        {t("profile.settings.password@@Password")}
                      </p>
                      <p class="text-sm text-gray-600">
                        {t(
                          "profile.settings.passwordDesc@@Last changed: Never",
                        )}
                      </p>
                    </div>
                    <button class="btn btn-outline btn-sm">
                      {t("profile.settings.changePassword@@Change Password")}
                    </button>
                  </div>
                  <div class="divider"></div>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold">
                        {t("profile.settings.2fa@@Two-Factor Authentication")}
                      </p>
                      <p class="text-sm text-gray-600">
                        {t(
                          "profile.settings.2faDesc@@Add an extra layer of security",
                        )}
                      </p>
                    </div>
                    <button class="btn btn-outline btn-sm">
                      {t("profile.settings.enable@@Enable")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-white shadow-lg">
              <div class="card-body">
                <h2 class="card-title text-error">
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  {t("profile.settings.danger@@Danger Zone")}
                </h2>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold">
                        {t("profile.settings.deleteAccount@@Delete Account")}
                      </p>
                      <p class="text-sm text-gray-600">
                        {t(
                          "profile.settings.deleteAccountDesc@@Permanently delete your account and all data",
                        )}
                      </p>
                    </div>
                    <button class="btn btn-error btn-sm">
                      {t("profile.settings.delete@@Delete")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "My Profile • Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage your Rihigo profile, bookings, and account settings",
    },
  ],
};
