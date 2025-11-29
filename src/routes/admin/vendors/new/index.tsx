import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { VendorCreateInput } from "~/types/vendor";

export const useIslands = routeLoader$(async () => {
  const response = await apiClient.islands.list();
  return response;
});

export const useCreateVendor = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const vendorData: VendorCreateInput = {
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
  const islandsResponse = useIslands();
  const islands = islandsResponse.value.data || [];

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

      <Form action={createAction}>
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
                  placeholder="Enter business name"
                  class="input input-bordered w-full"
                  required
                  maxLength={255}
                />
                <label class="label">
                  <span class="label-text-alt text-gray-500">Max 255 characters</span>
                </label>
              </div>

              {/* Business Registration Number */}
              <div class="form-control w-full">
                <label class="label">
                  <span class="label-text font-semibold">Business Registration Number</span>
                </label>
                <input
                  type="text"
                  name="business_registration_number"
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
                >
                  <option value="">Select an island</option>
                  {islands.map((island: any) => (
                    <option key={island.id} value={island.id}>{island.name}</option>
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
                  placeholder="e.g., Net 30"
                  class="input input-bordered w-full"
                />
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
            disabled={createAction.isRunning}
          >
            {createAction.isRunning ? (
              <>
                <span class="loading loading-spinner"></span>
                Creating...
              </>
            ) : (
              <>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Vendor
              </>
            )}
          </button>
        </div>
      </Form>
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
