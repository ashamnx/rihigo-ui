import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";

export const useCreateVendor = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const vendorData = {
      business_name: data.business_name as string,
      email: data.email as string,
      phone: data.phone as string || undefined,
      address: data.address as string || undefined,
    };

    const response = await apiClient.vendors.create(vendorData, token);

    if (response.success) {
      throw requestEvent.redirect(302, '/admin/vendors');
    }

    return response;
  });
});

export default component$(() => {
  const createAction = useCreateVendor();

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
        <h1 class="text-3xl font-bold">Create New Vendor</h1>
        <p class="text-gray-600 mt-2">Add a new vendor to the platform</p>
      </div>

      {createAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{createAction.value.error_message || 'Failed to create vendor'}</span>
        </div>
      )}

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <Form action={createAction}>
            {/* Business Name */}
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text font-semibold">Business Name <span class="text-error">*</span></span>
              </label>
              <input
                type="text"
                name="business_name"
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
                placeholder="+960 123 4567"
                class="input input-bordered w-full"
              />
            </div>

            {/* Address */}
            <div class="form-control w-full mb-6">
              <label class="label">
                <span class="label-text font-semibold">Address</span>
              </label>
              <textarea
                name="address"
                placeholder="Enter business address"
                class="textarea textarea-bordered w-full"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div class="flex gap-3 justify-end">
              <Link href="/admin/vendors" class="btn btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                class="btn btn-primary"
                disabled={createAction.isRunning}
              >
                {createAction.isRunning ? (
                  <>
                    <span class="loading loading-spinner"></span>
                    Creating...
                  </>
                ) : (
                  'Create Vendor'
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
  title: "New Vendor - Admin",
  meta: [
    {
      name: "description",
      content: "Create a new vendor",
    },
  ],
};
