import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { ApiResponse } from "~/types/api";
import type { Vendor } from "~/types/vendor";
import type { VendorStaff } from "~/types/vendor-user";
import { VENDOR_STAFF_ROLES } from "~/types/vendor-user";

export const useVendor = routeLoader$<ApiResponse<Vendor>>(async (requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendors.getById(vendorId, token);
  });
});

export const useVendorStaff = routeLoader$<ApiResponse<VendorStaff[]>>(async (requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendors.getStaff(vendorId, token);
  });
});

export const useAddStaff = routeAction$(async (data, requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    const staffData = {
      user_email: data.user_email as string,
      role: data.role as string,
    };
    return await apiClient.vendors.addStaff(vendorId, staffData, token);
  });
});

export default component$(() => {
  const vendorResponse = useVendor();
  const vendorStaffResponse = useVendorStaff();
  const addStaffAction = useAddStaff();

  const showAddModal = useSignal(false);

  const vendor = vendorResponse.value.data;
  const staffMembers = vendorStaffResponse.value.data || [];

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
      default:
        return <span class="badge">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span class="badge badge-success badge-sm">Active</span>;
      case 'inactive':
        return <span class="badge badge-ghost badge-sm">Inactive</span>;
      default:
        return <span class="badge badge-sm">{status}</span>;
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
            <h1 class="text-3xl font-bold">Vendor Staff</h1>
            <p class="text-gray-600 mt-2">
              Manage staff for <span class="font-semibold">{vendor.business_name}</span>
            </p>
          </div>
          <button
            class="btn btn-primary"
            onClick$={() => showAddModal.value = true}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            Add Staff
          </button>
        </div>
      </div>

      {/* Alerts */}
      {addStaffAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Staff member added successfully</span>
        </div>
      )}

      {addStaffAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{addStaffAction.value.error_message || 'Failed to add staff member'}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div class="tabs tabs-boxed mb-6">
        <Link href={`/admin/vendors/${vendor.id}/edit`} class="tab">Details</Link>
        <Link href={`/admin/vendors/${vendor.id}/users`} class="tab tab-active">Staff</Link>
        <Link href={`/admin/vendors/${vendor.id}/logs`} class="tab">Activity Logs</Link>
      </div>

      {/* Staff List */}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} class="text-center py-8 text-gray-500">
                      <div class="flex flex-col items-center gap-2">
                        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p>No staff members assigned to this vendor yet.</p>
                        <button
                          class="btn btn-primary btn-sm mt-2"
                          onClick$={() => showAddModal.value = true}
                        >
                          Add First Staff Member
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  staffMembers.map((staff) => (
                    <tr key={staff.id} class="hover">
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="avatar placeholder">
                            <div class="bg-neutral text-neutral-content rounded-full w-10">
                              <span>{staff.user_email.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <div class="font-medium">{staff.user_email}</div>
                            <div class="text-xs text-gray-500">ID: {staff.user_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(staff.role)}</td>
                      <td>{getStatusBadge(staff.status)}</td>
                      <td class="text-sm text-gray-600">
                        {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4">Add Staff Member</h3>
            <Form action={addStaffAction} onSubmitCompleted$={() => {
              if (addStaffAction.value?.success) {
                showAddModal.value = false;
              }
            }}>
              {/* Email */}
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Email Address <span class="text-error">*</span></span>
                </label>
                <input
                  type="email"
                  name="user_email"
                  placeholder="staff@example.com"
                  class="input input-bordered w-full"
                  required
                />
                <label class="label">
                  <span class="label-text-alt text-gray-500">Enter the email of the user to add as staff</span>
                </label>
              </div>

              {/* Role Selection */}
              <div class="form-control w-full mb-4">
                <label class="label">
                  <span class="label-text font-semibold">Role <span class="text-error">*</span></span>
                </label>
                <select name="role" class="select select-bordered w-full" required>
                  {VENDOR_STAFF_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>{`${role.label} - ${role.description}`}</option>
                  ))}
                </select>
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
                  disabled={addStaffAction.isRunning}
                >
                  {addStaffAction.isRunning ? (
                    <>
                      <span class="loading loading-spinner"></span>
                      Adding...
                    </>
                  ) : (
                    'Add Staff'
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
    </div>
  );
});

export const head: DocumentHead = {
  title: "Vendor Staff - Admin",
  meta: [
    {
      name: "description",
      content: "Manage vendor staff members",
    },
  ],
};
