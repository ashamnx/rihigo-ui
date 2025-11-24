import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { ApiResponse } from "~/types/api";
import type { Vendor } from "~/types/vendor";

export const useVendor = routeLoader$<ApiResponse<Vendor>>(async (requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendors.getById(vendorId, token);
  });
});

export const useUpdateVendor = routeAction$(async (data, requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    const vendorData = {
      business_name: data.business_name as string,
      email: data.email as string,
      phone: data.phone as string || undefined,
      address: data.address as string || undefined,
      status: data.status as 'pending' | 'verified' | 'suspended',
    };

    const response = await apiClient.vendors.update(vendorId, vendorData, token);

    if (response.success) {
      throw requestEvent.redirect(302, '/admin/vendors');
    }

    return response;
  });
});

export default component$(() => {
  const vendorResponse = useVendor();
  const updateAction = useUpdateVendor();

  const vendor = vendorResponse.value.data;

  if (!vendor) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="alert alert-error">
          <span>{vendorResponse.value.error_message || 'Vendor not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div class="container mx-auto px-4 py-8 max-w-2xl">
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <Link href="/admin/vendors" class="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to Vendors
          </Link>
        </div>
        <h1 class="text-3xl font-bold">Edit Vendor</h1>
        <p class="text-gray-600 mt-2">Update vendor information</p>
      </div>

      {updateAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateAction.value.error_message || 'Failed to update vendor'}</span>
        </div>
      )}

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <Form action={updateAction}>
            {/* Business Name */}
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text font-semibold">Business Name <span class="text-error">*</span></span>
              </label>
              <input
                type="text"
                name="business_name"
                value={vendor.business_name}
                placeholder="Enter business name"
                class="input input-bordered w-full"
                required
              />
            </div>

            {/* Email */}
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text font-semibold">Email <span class="text-error">*</span></span>
              </label>
              <input
                type="email"
                name="email"
                value={vendor.email}
                placeholder="vendor@example.com"
                class="input input-bordered w-full"
                required
              />
            </div>

            {/* Phone */}
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text font-semibold">Phone</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={vendor.phone || ''}
                placeholder="+960 123 4567"
                class="input input-bordered w-full"
              />
            </div>

            {/* Address */}
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text font-semibold">Address</span>
              </label>
              <textarea
                name="address"
                value={vendor.address || ''}
                placeholder="Enter business address"
                class="textarea textarea-bordered w-full"
                rows={3}
              />
            </div>

            {/* Status */}
            <div class="form-control w-full mb-6">
              <label class="label">
                <span class="label-text font-semibold">Status <span class="text-error">*</span></span>
              </label>
              <select
                name="status"
                class="select select-bordered w-full"
                value={vendor.status}
              >
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Metadata */}
            <div class="bg-base-200 p-4 rounded-lg mb-6">
              <h3 class="font-semibold mb-2">Metadata</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-gray-600">Vendor ID:</span>
                  <span class="ml-2 font-mono">{vendor.id}</span>
                </div>
                <div>
                  <span class="text-gray-600">Verified:</span>
                  <span class="ml-2">{vendor.is_verified ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span class="text-gray-600">Created:</span>
                  <span class="ml-2">{new Date(vendor.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span class="text-gray-600">Updated:</span>
                  <span class="ml-2">{new Date(vendor.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div class="flex gap-3 justify-end">
              <Link href="/admin/vendors" class="btn btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                class="btn btn-primary"
                disabled={updateAction.isRunning}
              >
                {updateAction.isRunning ? (
                  <>
                    <span class="loading loading-spinner"></span>
                    Updating...
                  </>
                ) : (
                  'Update Vendor'
                )}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Edit Vendor - Admin",
  meta: [
    {
      name: "description",
      content: "Edit vendor information",
    },
  ],
};
