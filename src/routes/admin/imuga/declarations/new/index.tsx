import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeAction$, Form, Link, useNavigate } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { CreateDeclarationInput } from '~/types/imuga';
import { ARRIVAL_PORTS } from '~/types/imuga';

export const useCreateDeclaration = routeAction$(async (data, requestEvent) => {
  const declarationData: CreateDeclarationInput = {
    group_name: data.group_name as string,
    group_reference: (data.group_reference as string) || undefined,
    accommodation_name: data.accommodation_name as string,
    accommodation_address: (data.accommodation_address as string) || undefined,
    accommodation_island: data.accommodation_island as string,
    accommodation_atoll: data.accommodation_atoll as string,
    arrival_date: data.arrival_date as string,
    departure_date: data.departure_date as string,
    arrival_flight: data.arrival_flight as string,
    departure_flight: (data.departure_flight as string) || undefined,
    arrival_port: data.arrival_port as string,
    internal_notes: (data.internal_notes as string) || undefined,
    admin_notes: (data.admin_notes as string) || undefined,
  };

  return authenticatedRequest(requestEvent, async (token) => {
    const response = await apiClient.imugaDeclarations.create(
      declarationData,
      token
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: { declaration_id: response.data.id },
        message: 'Declaration created successfully',
      };
    }

    return {
      success: false,
      error_message: response.error_message || 'Failed to create declaration',
    };
  });
});

export default component$(() => {
  const createAction = useCreateDeclaration();
  const navigate = useNavigate();

  // Redirect on success
  if (createAction.value?.success && createAction.value.data?.declaration_id) {
    navigate(`/admin/imuga/declarations/${createAction.value.data.declaration_id}`);
  }

  return (
    <div class="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/imuga/declarations"
          class="btn btn-ghost btn-sm mb-4"
        >
          <svg
            class="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Declarations
        </Link>
        <h1 class="text-2xl font-bold">Create Declaration</h1>
        <p class="text-base-content/60 mt-1">
          Create a new IMUGA declaration for travelers
        </p>
      </div>

      {/* Error Message */}
      {createAction.value?.success === false && (
        <div class="alert alert-error">
          <svg
            class="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <span>{createAction.value.error_message}</span>
        </div>
      )}

      <Form action={createAction}>
        {/* Group Information */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Group Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Group Name <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="group_name"
                class="input input-bordered w-full"
                placeholder="e.g., Smith Family Trip"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Group Reference</span>
              </label>
              <input
                type="text"
                name="group_reference"
                class="input input-bordered w-full"
                placeholder="Booking reference or ID"
              />
            </div>
          </div>
        </div>

        {/* Accommodation */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Accommodation</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">
                  Accommodation Name <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="accommodation_name"
                class="input input-bordered w-full"
                placeholder="Hotel/Resort name"
                required
              />
            </div>
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">Address</span>
              </label>
              <input
                type="text"
                name="accommodation_address"
                class="input input-bordered w-full"
                placeholder="Full address"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Island <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="accommodation_island"
                class="input input-bordered w-full"
                placeholder="e.g., Malé"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Atoll <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="accommodation_atoll"
                class="input input-bordered w-full"
                placeholder="e.g., Kaafu"
                required
              />
            </div>
          </div>
        </div>

        {/* Travel Information */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Travel Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Arrival Date <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                name="arrival_date"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Departure Date <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                name="departure_date"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Arrival Port <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="arrival_port"
                class="select select-bordered w-full"
                required
              >
                <option value="">Select port</option>
                {ARRIVAL_PORTS.map((port) => (
                  <option key={port.code} value={port.code}>
                    {port.name}
                  </option>
                ))}
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Arrival Flight <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="arrival_flight"
                class="input input-bordered w-full"
                placeholder="e.g., SQ452"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Departure Flight</span>
              </label>
              <input
                type="text"
                name="departure_flight"
                class="input input-bordered w-full"
                placeholder="e.g., SQ453"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Notes</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Internal Notes</span>
              </label>
              <textarea
                name="internal_notes"
                class="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Notes visible only to admins..."
              ></textarea>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Admin Notes</span>
              </label>
              <textarea
                name="admin_notes"
                class="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Additional admin notes..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div class="flex justify-end gap-3">
          <Link href="/admin/imuga/declarations" class="btn btn-ghost">
            Cancel
          </Link>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={createAction.isRunning}
          >
            {createAction.isRunning ? (
              <>
                <span class="loading loading-spinner loading-sm"></span>
                Creating...
              </>
            ) : (
              'Create Declaration'
            )}
          </button>
        </div>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Create Declaration | IMUGA | Admin | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Create a new IMUGA immigration declaration.',
    },
  ],
};
