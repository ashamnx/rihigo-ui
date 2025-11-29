import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { ApiResponse } from "~/types/api";
import type { Vendor } from "~/types/vendor";
import type { VendorUser } from "~/types/vendor-user";

export const useVendor = routeLoader$<ApiResponse<Vendor>>(async (requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendors.getById(vendorId, token);
  });
});

export const useVendorUsers = routeLoader$<ApiResponse<VendorUser[]>>(async (requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendors.getUsers(vendorId, token);
  });
});

export const useAllUsers = routeLoader$<ApiResponse<any[]>>(async (requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.admin.users.list(1, 100, token);
  });
});

export const useAddVendorUser = routeAction$(async (data, requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    const userData = {
      user_id: data.user_id as string,
      role: data.role as string,
      permissions: (data.permissions as string || '').split(',').filter(Boolean),
    };
    return await apiClient.vendors.addUser(vendorId, userData, token);
  });
});

export const useUpdateVendorUser = routeAction$(async (data, requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    const userData = {
      role: data.role as string,
      permissions: (data.permissions as string || '').split(',').filter(Boolean),
    };
    return await apiClient.vendors.updateUser(vendorId, data.user_id as string, userData, token);
  });
});

export const useRemoveVendorUser = routeAction$(async (data, requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendors.removeUser(vendorId, data.user_id as string, token);
  });
});

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_bookings', label: 'Manage Bookings', description: 'Create, update, and cancel bookings' },
  { id: 'view_reports', label: 'View Reports', description: 'Access analytics and reports' },
  { id: 'manage_activities', label: 'Manage Activities', description: 'Create and edit activities' },
  { id: 'manage_resources', label: 'Manage Resources', description: 'Manage rooms, vehicles, equipment' },
  { id: 'manage_guests', label: 'Manage Guests', description: 'Create and edit guest profiles' },
  { id: 'manage_invoices', label: 'Manage Invoices', description: 'Create and manage invoices' },
  { id: 'manage_payments', label: 'Manage Payments', description: 'Record and process payments' },
  { id: 'manage_staff', label: 'Manage Staff', description: 'Add and remove staff members' },
  { id: 'manage_settings', label: 'Manage Settings', description: 'Update vendor settings' },
];

const ROLES = [
  { id: 'owner', label: 'Owner', description: 'Full access to all features' },
  { id: 'manager', label: 'Manager', description: 'Manage day-to-day operations' },
  { id: 'staff', label: 'Staff', description: 'Limited access based on permissions' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only access' },
];

export default component$(() => {
  const vendorResponse = useVendor();
  const vendorUsersResponse = useVendorUsers();
  const allUsersResponse = useAllUsers();
  const addUserAction = useAddVendorUser();
  const updateUserAction = useUpdateVendorUser();
  const removeUserAction = useRemoveVendorUser();

  const showAddModal = useSignal(false);
  const showEditModal = useSignal(false);
  const removeModalUserId = useSignal<string | null>(null);
  const editingUser = useSignal<VendorUser | null>(null);
  const selectedPermissions = useSignal<string[]>([]);

  const vendor = vendorResponse.value.data;
  const vendorUsers = vendorUsersResponse.value.data || [];
  const allUsers = allUsersResponse.value.data || [];

  // Filter out users that are already assigned to this vendor
  const availableUsers = allUsers.filter(
    (user: any) => !vendorUsers.some((vu) => vu.user_id === user.id)
  );

  if (!vendor) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{vendorResponse.value.error_message || 'Vendor not found'}</span>
        </div>
        <div class="mt-4">
          <Link href="/admin/vendors" class="btn btn-ghost">
            Back to Vendors
          </Link>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <span class="badge badge-primary">Owner</span>;
      case 'manager':
        return <span class="badge badge-secondary">Manager</span>;
      case 'staff':
        return <span class="badge badge-accent">Staff</span>;
      case 'viewer':
        return <span class="badge badge-ghost">Viewer</span>;
      default:
        return <span class="badge">{role}</span>;
    }
  };

  return (
    <div class="container mx-auto px-4 py-8">
      {/* Header */}
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <Link href="/admin/vendors" class="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to Vendors
          </Link>
        </div>
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold">Vendor Users</h1>
            <p class="text-gray-600 mt-2">
              Manage users for <span class="font-semibold">{vendor.business_name}</span>
            </p>
          </div>
          <button
            class="btn btn-primary"
            onClick$={() => {
              selectedPermissions.value = [];
              showAddModal.value = true;
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Alerts */}
      {addUserAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>User added successfully</span>
        </div>
      )}

      {addUserAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{addUserAction.value.error_message || 'Failed to add user'}</span>
        </div>
      )}

      {removeUserAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>User removed successfully</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div class="tabs tabs-boxed mb-6">
        <Link href={`/admin/vendors/${vendor.id}/edit`} class="tab">Details</Link>
        <Link href={`/admin/vendors/${vendor.id}/users`} class="tab tab-active">Users</Link>
      </div>

      {/* Users List */}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} class="text-center py-8 text-gray-500">
                      <div class="flex flex-col items-center gap-2">
                        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p>No users assigned to this vendor yet.</p>
                        <button
                          class="btn btn-primary btn-sm mt-2"
                          onClick$={() => showAddModal.value = true}
                        >
                          Add First User
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vendorUsers.map((vendorUser) => (
                    <tr key={vendorUser.id} class="hover">
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="avatar placeholder">
                            <div class="bg-neutral text-neutral-content rounded-full w-10">
                              <span>{vendorUser.user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                          </div>
                          <div>
                            <div class="font-bold">{vendorUser.user?.name || 'Unknown'}</div>
                            <div class="text-sm text-gray-500">{vendorUser.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(vendorUser.role)}</td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          {vendorUser.permissions?.slice(0, 3).map((perm) => (
                            <span key={perm} class="badge badge-outline badge-sm">{perm.replace(/_/g, ' ')}</span>
                          ))}
                          {(vendorUser.permissions?.length || 0) > 3 && (
                            <span class="badge badge-outline badge-sm">+{vendorUser.permissions!.length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td class="text-sm text-gray-600">
                        {vendorUser.created_at ? new Date(vendorUser.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <button
                            class="btn btn-sm btn-ghost"
                            title="Edit user"
                            onClick$={() => {
                              editingUser.value = vendorUser;
                              selectedPermissions.value = vendorUser.permissions || [];
                              showEditModal.value = true;
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            class="btn btn-sm btn-ghost text-error"
                            title="Remove user"
                            onClick$={() => removeModalUserId.value = vendorUser.user_id}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">Add User to Vendor</h3>
            <Form action={addUserAction} onSubmitCompleted$={() => {
              if (addUserAction.value?.success) {
                showAddModal.value = false;
              }
            }}>
              {/* User Selection */}
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Select User <span class="text-error">*</span></span>
                </label>
                <select name="user_id" class="select select-bordered w-full" required>
                  <option value="">Choose a user...</option>
                  {availableUsers.map((user: any) => (
                    <option key={user.id} value={user.id}>{`${user.name} (${user.email})`}</option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <label class="label">
                    <span class="label-text-alt text-warning">All users are already assigned to this vendor</span>
                  </label>
                )}
              </div>

              {/* Role Selection */}
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Role <span class="text-error">*</span></span>
                </label>
                <select name="role" class="select select-bordered w-full" required>
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>{`${role.label} - ${role.description}`}</option>
                  ))}
                </select>
              </div>

              {/* Permissions */}
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Permissions</span>
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-base-200 rounded-lg">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label key={perm.id} class="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm mt-0.5"
                        checked={selectedPermissions.value.includes(perm.id)}
                        onChange$={(e) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          if (checked) {
                            selectedPermissions.value = [...selectedPermissions.value, perm.id];
                          } else {
                            selectedPermissions.value = selectedPermissions.value.filter(p => p !== perm.id);
                          }
                        }}
                      />
                      <div>
                        <div class="text-sm font-medium">{perm.label}</div>
                        <div class="text-xs text-gray-500">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <input type="hidden" name="permissions" value={selectedPermissions.value.join(',')} />
              </div>

              <div class="modal-action">
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick$={() => showAddModal.value = false}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={addUserAction.isRunning || availableUsers.length === 0}
                >
                  {addUserAction.isRunning ? (
                    <>
                      <span class="loading loading-spinner"></span>
                      Adding...
                    </>
                  ) : (
                    'Add User'
                  )}
                </button>
              </div>
            </Form>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button onClick$={() => showAddModal.value = false}>close</button>
          </form>
        </dialog>
      )}

      {/* Edit User Modal */}
      {showEditModal.value && editingUser.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">Edit User Permissions</h3>
            <div class="flex items-center gap-3 mb-4 p-4 bg-base-200 rounded-lg">
              <div class="avatar placeholder">
                <div class="bg-neutral text-neutral-content rounded-full w-12">
                  <span>{editingUser.value.user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
              </div>
              <div>
                <div class="font-bold">{editingUser.value.user?.name || 'Unknown'}</div>
                <div class="text-sm text-gray-500">{editingUser.value.user?.email}</div>
              </div>
            </div>
            <Form action={updateUserAction} onSubmitCompleted$={() => {
              if (updateUserAction.value?.success) {
                showEditModal.value = false;
                editingUser.value = null;
              }
            }}>
              <input type="hidden" name="user_id" value={editingUser.value.user_id} />

              {/* Role Selection */}
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Role <span class="text-error">*</span></span>
                </label>
                <select name="role" class="select select-bordered w-full" required value={editingUser.value.role}>
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id} selected={role.id === editingUser.value?.role}>{`${role.label} - ${role.description}`}</option>
                  ))}
                </select>
              </div>

              {/* Permissions */}
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Permissions</span>
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-base-200 rounded-lg">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label key={perm.id} class="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm mt-0.5"
                        checked={selectedPermissions.value.includes(perm.id)}
                        onChange$={(e) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          if (checked) {
                            selectedPermissions.value = [...selectedPermissions.value, perm.id];
                          } else {
                            selectedPermissions.value = selectedPermissions.value.filter(p => p !== perm.id);
                          }
                        }}
                      />
                      <div>
                        <div class="text-sm font-medium">{perm.label}</div>
                        <div class="text-xs text-gray-500">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <input type="hidden" name="permissions" value={selectedPermissions.value.join(',')} />
              </div>

              <div class="modal-action">
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick$={() => {
                    showEditModal.value = false;
                    editingUser.value = null;
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={updateUserAction.isRunning}
                >
                  {updateUserAction.isRunning ? (
                    <>
                      <span class="loading loading-spinner"></span>
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </button>
              </div>
            </Form>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button onClick$={() => {
              showEditModal.value = false;
              editingUser.value = null;
            }}>close</button>
          </form>
        </dialog>
      )}

      {/* Remove Confirmation Modal */}
      {removeModalUserId.value && (
        <dialog class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Remove User</h3>
            <p class="py-4">Are you sure you want to remove this user from the vendor? They will lose access to all vendor features.</p>
            <div class="modal-action">
              <button
                class="btn btn-ghost"
                onClick$={() => removeModalUserId.value = null}
              >
                Cancel
              </button>
              <Form action={removeUserAction} onSubmitCompleted$={() => {
                removeModalUserId.value = null;
              }}>
                <input type="hidden" name="user_id" value={removeModalUserId.value} />
                <button
                  type="submit"
                  class="btn btn-error"
                  disabled={removeUserAction.isRunning}
                >
                  {removeUserAction.isRunning ? (
                    <>
                      <span class="loading loading-spinner"></span>
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </button>
              </Form>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button onClick$={() => removeModalUserId.value = null}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Vendor Users - Admin",
  meta: [
    {
      name: "description",
      content: "Manage vendor users and permissions",
    },
  ],
};
