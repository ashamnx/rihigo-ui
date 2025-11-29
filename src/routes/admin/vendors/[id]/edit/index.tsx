import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { ApiResponse } from "~/types/api";
import type { Vendor, VendorUpdateInput } from "~/types/vendor";

export const useVendor = routeLoader$<ApiResponse<Vendor>>(async (requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendors.getById(vendorId, token);
  });
});

export const useIslands = routeLoader$(async () => {
  const response = await apiClient.islands.list();
  return response;
});

export const useUpdateVendor = routeAction$(async (data, requestEvent) => {
  const vendorId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    const vendorData: VendorUpdateInput = {
      business_name: data.business_name as string,
      email: data.email as string,
      phone: data.phone as string || undefined,
      website: data.website as string || undefined,
      description: data.description as string || undefined,
      address_line1: data.address_line1 as string || undefined,
      address_line2: data.address_line2 as string || undefined,
      island_id: data.island_id ? parseInt(data.island_id as string) : undefined,
      business_registration_number: data.business_registration_number as string || undefined,
      contact_person_name: data.contact_person_name as string || undefined,
      contact_person_email: data.contact_person_email as string || undefined,
      contact_person_phone: data.contact_person_phone as string || undefined,
      commission_percentage: data.commission_percentage ? parseFloat(data.commission_percentage as string) : undefined,
      payment_terms: data.payment_terms as string || undefined,
      status: data.status as 'pending' | 'active' | 'suspended' | 'inactive',
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
  const islandsResponse = useIslands();

  const vendor = vendorResponse.value.data;
  const islands = islandsResponse.value.data || [];

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

  return (
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <Link href="/admin/vendors" class="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to Vendors
          </Link>
        </div>
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-bold">Edit Vendor</h1>
          {vendor.is_verified && (
            <span class="badge badge-info gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Verified
            </span>
          )}
        </div>
        <p class="text-gray-600 mt-2">Update vendor information</p>
      </div>

      {/* Navigation Tabs */}
      <div class="tabs tabs-boxed mb-6">
        <Link href={`/admin/vendors/${vendor.id}/edit`} class="tab tab-active">Details</Link>
        <Link href={`/admin/vendors/${vendor.id}/users`} class="tab">Users</Link>
      </div>

      {updateAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateAction.value.error_message || 'Failed to update vendor'}</span>
        </div>
      )}

      <Form action={updateAction}>
        {/* Business Information */}
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Business Information
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Name */}
              <div class="form-control w-full">
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
                  maxLength={255}
                />
              </div>

              {/* Business Registration Number */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Business Registration Number</span>
                </label>
                <input
                  type="text"
                  name="business_registration_number"
                  value={vendor.business_registration_number || ''}
                  placeholder="e.g., BRN-2024-001"
                  class="input input-bordered w-full"
                />
              </div>

              {/* Email */}
              <div class="form-control w-full">
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
              <div class="form-control w-full">
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

              {/* Website */}
              <div class="form-control w-full md:col-span-2">
                <label class="label">
                  <span class="label-text font-semibold">Website</span>
                </label>
                <input
                  type="url"
                  name="website"
                  value={vendor.website || ''}
                  placeholder="https://example.com"
                  class="input input-bordered w-full"
                />
              </div>

              {/* Description */}
              <div class="form-control w-full md:col-span-2">
                <label class="label">
                  <span class="label-text font-semibold">Description</span>
                </label>
                <textarea
                  name="description"
                  value={vendor.description || ''}
                  placeholder="Brief description of the business"
                  class="textarea textarea-bordered w-full"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location & Address */}
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location & Address
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Island */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Island</span>
                </label>
                <select
                  name="island_id"
                  class="select select-bordered w-full"
                  value={vendor.island_id || ''}
                >
                  <option value="">Select an island</option>
                  {islands.map((island: any) => (
                    <option key={island.id} value={island.id} selected={island.id === vendor.island_id}>{island.name}</option>
                  ))}
                </select>
              </div>

              {/* Address Line 1 */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Address Line 1</span>
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={vendor.address_line1 || ''}
                  placeholder="Street address"
                  class="input input-bordered w-full"
                />
              </div>

              {/* Address Line 2 */}
              <div class="form-control w-full md:col-span-2">
                <label class="label">
                  <span class="label-text font-semibold">Address Line 2</span>
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={vendor.address_line2 || ''}
                  placeholder="City, region, postal code"
                  class="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Person */}
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Contact Person
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contact Person Name */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Name</span>
                </label>
                <input
                  type="text"
                  name="contact_person_name"
                  value={vendor.contact_person_name || ''}
                  placeholder="John Smith"
                  class="input input-bordered w-full"
                />
              </div>

              {/* Contact Person Email */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Email</span>
                </label>
                <input
                  type="email"
                  name="contact_person_email"
                  value={vendor.contact_person_email || ''}
                  placeholder="john@example.com"
                  class="input input-bordered w-full"
                />
              </div>

              {/* Contact Person Phone */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Phone</span>
                </label>
                <input
                  type="tel"
                  name="contact_person_phone"
                  value={vendor.contact_person_phone || ''}
                  placeholder="+960 765 4321"
                  class="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Commission & Payment */}
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Commission & Payment
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Commission Percentage */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Commission Percentage</span>
                </label>
                <div class="join">
                  <input
                    type="number"
                    name="commission_percentage"
                    value={vendor.commission_percentage || 0}
                    placeholder="0"
                    class="input input-bordered w-full join-item"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span class="btn join-item no-animation">%</span>
                </div>
                <label class="label">
                  <span class="label-text-alt text-gray-500">Platform commission (0-100%)</span>
                </label>
              </div>

              {/* Payment Terms */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Payment Terms</span>
                </label>
                <input
                  type="text"
                  name="payment_terms"
                  value={vendor.payment_terms || ''}
                  placeholder="e.g., Net 30"
                  class="input input-bordered w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status
            </h2>

            <div class="form-control w-full max-w-md">
              <label class="label">
                <span class="label-text font-semibold">Vendor Status <span class="text-error">*</span></span>
              </label>
              <select
                name="status"
                class="select select-bordered w-full"
                value={vendor.status}
              >
                <option value="pending" selected={vendor.status === 'pending'}>Pending</option>
                <option value="active" selected={vendor.status === 'active'}>Active</option>
                <option value="suspended" selected={vendor.status === 'suspended'}>Suspended</option>
                <option value="inactive" selected={vendor.status === 'inactive'}>Inactive</option>
              </select>
              <label class="label">
                <span class="label-text-alt text-gray-500">Control whether this vendor can operate on the platform</span>
              </label>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div class="card bg-base-200 mb-6">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Metadata
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-600 block">Vendor ID</span>
                <span class="font-mono text-xs">{vendor.id}</span>
              </div>
              <div>
                <span class="text-gray-600 block">Verified</span>
                <span>{vendor.is_verified ? 'Yes' : 'No'}</span>
                {vendor.verified_at && (
                  <span class="text-xs text-gray-500 block">
                    on {new Date(vendor.verified_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div>
                <span class="text-gray-600 block">Created</span>
                <span>{new Date(vendor.created_at).toLocaleDateString()}</span>
                {vendor.created_by && (
                  <span class="text-xs text-gray-500 block">by {vendor.created_by}</span>
                )}
              </div>
              <div>
                <span class="text-gray-600 block">Last Updated</span>
                <span>{new Date(vendor.updated_at).toLocaleDateString()}</span>
              </div>
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
              <>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Update Vendor
              </>
            )}
          </button>
        </div>
      </Form>
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
