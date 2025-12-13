import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { ApiResponse } from "~/types/api";
import type { Vendor } from "~/types/vendor";
import { ErrorState } from "~/components/error-state/error-state";

export const useVendors = routeLoader$<ApiResponse<Vendor[]>>(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        const response = await apiClient.vendors.list(token, undefined, 1, 100);
        return response;
    });
});

export const useDeleteVendor = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const vendorId = data.vendorId as string;
    return await apiClient.vendors.delete(vendorId, token);
  });
});

export default component$(() => {
  const vendorsResponse = useVendors();
  const deleteAction = useDeleteVendor();
  const deleteModalId = useSignal<string | null>(null);

  const vendors = vendorsResponse.value.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span class="badge badge-success gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Active
        </span>;
      case 'pending':
        return <span class="badge badge-warning gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
          </svg>
          Pending
        </span>;
      case 'suspended':
        return <span class="badge badge-error gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          Suspended
        </span>;
      case 'inactive':
        return <span class="badge badge-ghost gap-1">Inactive</span>;
      default:
        return <span class="badge badge-ghost">{status}</span>;
    }
  };

  const getVerifiedBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <span class="badge badge-info badge-sm gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Verified
        </span>
      );
    }
    return null;
  };

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Vendors</h1>
          <p class="text-gray-600 mt-2">Manage vendors and service providers</p>
        </div>
        <Link href="/admin/vendors/new" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Vendor
        </Link>
      </div>

      {deleteAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{deleteAction.value.message || 'Vendor deleted successfully'}</span>
        </div>
      )}

      {deleteAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{deleteAction.value.error_message || 'Failed to delete vendor'}</span>
        </div>
      )}

      {vendorsResponse.value.error_message ? (
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <ErrorState
              title="Failed to load vendors"
              message={vendorsResponse.value.error_message}
            />
          </div>
        </div>
      ) : (
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="overflow-x-auto">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Contact</th>
                    <th>Contact Person</th>
                    <th>Commission</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} class="text-center py-8 text-gray-500">
                        <div class="flex flex-col items-center gap-2">
                          <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p>No vendors found. Create your first vendor to get started.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vendors.map((vendor) => (
                    <tr key={vendor.id} class="hover">
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="avatar placeholder">
                            <div class="bg-primary text-primary-content rounded-lg w-12">
                              <span class="text-lg">{vendor.business_name.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <div class="font-bold flex items-center gap-2">
                              {vendor.business_name}
                              {getVerifiedBadge(vendor.is_verified)}
                            </div>
                            {vendor.business_registration_number && (
                              <div class="text-xs text-gray-500">
                                Reg: {vendor.business_registration_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="text-sm">
                          <div class="flex items-center gap-1">
                            <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href={`mailto:${vendor.email}`} class="link link-hover">{vendor.email}</a>
                          </div>
                          {vendor.phone && (
                            <div class="flex items-center gap-1 mt-1">
                              <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                          {vendor.website && (
                            <div class="flex items-center gap-1 mt-1">
                              <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              <a href={vendor.website} target="_blank" class="link link-hover truncate max-w-[150px]">{vendor.website.replace(/^https?:\/\//, '')}</a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {vendor.contact_person_name ? (
                          <div class="text-sm">
                            <div class="font-medium">{vendor.contact_person_name}</div>
                            {vendor.contact_person_email && (
                              <div class="text-xs text-gray-500">{vendor.contact_person_email}</div>
                            )}
                            {vendor.contact_person_phone && (
                              <div class="text-xs text-gray-500">{vendor.contact_person_phone}</div>
                            )}
                          </div>
                        ) : (
                          <span class="text-gray-400 italic text-sm">Not set</span>
                        )}
                      </td>
                      <td>
                        <div class="badge badge-outline">{vendor.commission_percentage || 0}%</div>
                      </td>
                      <td>
                        {getStatusBadge(vendor.status)}
                      </td>
                      <td class="text-sm text-gray-600">
                        <div>{new Date(vendor.created_at).toLocaleDateString()}</div>
                        {vendor.created_by && (
                          <div class="text-xs text-gray-400">by {vendor.created_by}</div>
                        )}
                      </td>
                      <td>
                        <div class="flex gap-1">
                          <Link
                            href={`/admin/vendors/${vendor.id}/edit`}
                            class="btn btn-sm btn-ghost"
                            title="Edit vendor"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <button
                            class="btn btn-sm btn-ghost text-error"
                            onClick$={() => deleteModalId.value = vendor.id}
                            title="Delete vendor"
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
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId.value && (
        <dialog class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Delete Vendor</h3>
            <p class="py-4">Are you sure you want to delete this vendor? This action cannot be undone and will remove all associated data.</p>
            <div class="modal-action">
              <button
                class="btn btn-ghost"
                onClick$={() => deleteModalId.value = null}
              >
                Cancel
              </button>
              <form method="post" onSubmit$={() => deleteAction.submit({ vendorId: deleteModalId.value})}>
                <input type="hidden" name="vendorId" value={deleteModalId.value} />
                <button
                  type="submit"
                  class="btn btn-error"
                  onClick$={() => deleteModalId.value = null}
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button onClick$={() => deleteModalId.value = null}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Vendors - Admin",
  meta: [
    {
      name: "description",
      content: "Manage vendors and service providers",
    },
  ],
};
