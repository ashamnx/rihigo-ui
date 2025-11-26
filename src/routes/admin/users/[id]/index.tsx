import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$, routeAction$, Form } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { ApiResponse } from "~/types/api";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: 'user' | 'admin';
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  created_at: string;
  updated_at?: string;
  preferences?: {
    currency?: string;
    language?: string;
    notifications?: boolean;
  };
}

export const useUserDetail = routeLoader$<ApiResponse<User>>(async (requestEvent) => {
  const userId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.users.getById(userId, token);
  });
});

export const useUpdateUser = routeAction$(async (data, requestEvent) => {
  const userId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const updateData: any = {
      name: data.name as string,
      phone: data.phone as string || undefined,
      nationality: data.nationality as string || undefined,
      date_of_birth: data.date_of_birth as string || undefined,
    };

    // Handle preferences
    if (data.currency || data.language) {
      updateData.preferences = {
        currency: data.currency as string || undefined,
        language: data.language as string || undefined,
        notifications: data.notifications === 'on',
      };
    }

    return await apiClient.users.update(userId, updateData, token);
  });
});

export default component$(() => {
  const userResponse = useUserDetail();
  const updateAction = useUpdateUser();

  const user = userResponse.value.data;

  if (!user) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{userResponse.value.error_message || 'User not found'}</span>
        </div>
        <Link href="/admin/users" class="btn btn-ghost mt-4">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div class="container mx-auto px-4 py-8">
      {/* Header */}
      <div class="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/users" class="btn btn-ghost btn-sm mb-2">
            ← Back to Users
          </Link>
          <h1 class="text-3xl font-bold">User Details</h1>
          <p class="text-gray-600 mt-2">View and edit user information</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {updateAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>User updated successfully</span>
        </div>
      )}

      {updateAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateAction.value.error_message || 'Failed to update user'}</span>
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center">
              {user.image ? (
                <div class="avatar">
                  <div class="w-24 rounded-full">
                    <img src={user.image} alt={user.name} />
                  </div>
                </div>
              ) : (
                <div class="avatar placeholder">
                  <div class="bg-neutral-focus text-neutral-content rounded-full w-24">
                    <span class="text-3xl">{user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              )}

              <h2 class="card-title mt-4">{user.name || 'No name'}</h2>
              <p class="text-sm text-base-content/70 break-all">{user.email}</p>

              <div class={`badge badge-lg mt-4 ${user.role === 'admin' ? 'badge-error' : 'badge-info'}`}>
                {user.role}
              </div>

              <div class="divider"></div>

              <div class="w-full text-left space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-base-content/70">User ID</span>
                  <span class="text-sm font-mono">{user.id.substring(0, 12)}...</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-base-content/70">Joined</span>
                  <span class="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                {user.updated_at && (
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-base-content/70">Last Updated</span>
                    <span class="text-sm">{new Date(user.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div class="lg:col-span-2">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title">Edit User Information</h2>

              <Form action={updateAction}>
                {/* Basic Information */}
                <div class="form-control mb-4">
                  <label class="label">
                    <span class="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    class="input input-bordered"
                    value={user.name || ''}
                    required
                  />
                </div>

                <div class="form-control mb-4">
                  <label class="label">
                    <span class="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    class="input input-bordered"
                    value={user.email}
                    disabled
                  />
                  <label class="label">
                    <span class="label-text-alt text-base-content/70">Email cannot be changed</span>
                  </label>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      class="input input-bordered"
                      value={user.phone || ''}
                      placeholder="+960XXXXXXX"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Nationality</span>
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      class="input input-bordered"
                      value={user.nationality || ''}
                      placeholder="US"
                      maxLength={2}
                    />
                    <label class="label">
                      <span class="label-text-alt">2-letter country code</span>
                    </label>
                  </div>
                </div>

                <div class="form-control mb-4">
                  <label class="label">
                    <span class="label-text">Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    class="input input-bordered"
                    value={user.date_of_birth ? user.date_of_birth.split('T')[0] : ''}
                  />
                </div>

                <div class="divider">Preferences</div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Preferred Language</span>
                    </label>
                    <select name="language" class="select select-bordered">
                      <option value="en" selected={user.preferences?.language === 'en'}>English</option>
                      <option value="it" selected={user.preferences?.language === 'it'}>Italian</option>
                      <option value="es" selected={user.preferences?.language === 'es'}>Spanish</option>
                      <option value="fr" selected={user.preferences?.language === 'fr'}>French</option>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Preferred Currency</span>
                    </label>
                    <select name="currency" class="select select-bordered">
                      <option value="USD" selected={user.preferences?.currency === 'USD'}>USD - US Dollar</option>
                      <option value="EUR" selected={user.preferences?.currency === 'EUR'}>EUR - Euro</option>
                      <option value="GBP" selected={user.preferences?.currency === 'GBP'}>GBP - British Pound</option>
                      <option value="JPY" selected={user.preferences?.currency === 'JPY'}>JPY - Japanese Yen</option>
                    </select>
                  </div>
                </div>

                <div class="form-control mb-6">
                  <label class="label cursor-pointer">
                    <span class="label-text">Email Notifications</span>
                    <input
                      type="checkbox"
                      name="notifications"
                      class="toggle toggle-primary"
                      checked={user.preferences?.notifications !== false}
                    />
                  </label>
                </div>

                <div class="card-actions justify-end">
                  <Link href="/admin/users" class="btn btn-ghost">
                    Cancel
                  </Link>
                  <button type="submit" class="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </Form>
            </div>
          </div>

          {/* Additional Info Card */}
          <div class="card bg-base-100 shadow-xl mt-6">
            <div class="card-body">
              <h2 class="card-title">Account Status</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="stat bg-base-200 rounded-lg">
                  <div class="stat-title">Account Type</div>
                  <div class="stat-value text-2xl">{user.role}</div>
                  <div class="stat-desc">User role in the system</div>
                </div>

                <div class="stat bg-base-200 rounded-lg">
                  <div class="stat-title">Email Status</div>
                  <div class="stat-value text-2xl text-success">Verified</div>
                  <div class="stat-desc">Via OAuth provider</div>
                </div>
              </div>

              <div class="alert alert-info mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>To change user role, go back to the users list and use the role management action.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'User Details | Admin',
  meta: [
    {
      name: 'description',
      content: 'View and edit user details',
    },
  ],
};
