import { component$, useSignal, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { ImugaDeclaration, ImugaDeclarationStatus } from '~/types/imuga';
import {
  DECLARATION_STATUS_LABELS,
  DECLARATION_STATUS_COLORS,
  ARRIVAL_PORTS,
} from '~/types/imuga';
import { TravelerCard } from '~/components/imuga/TravelerCard';

export const useDeclaration = routeLoader$(async (requestEvent) => {
  const declarationId = requestEvent.params.id;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.imugaDeclarations.getById(declarationId, token);
  });

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error_message || 'Declaration not found',
      declaration: null,
    };
  }

  return {
    success: true,
    error: null,
    declaration: response.data as ImugaDeclaration,
  };
});

export const useUpdateStatus = routeAction$(async (data, requestEvent) => {
  const declarationId = requestEvent.params.id;
  const status = data.status as ImugaDeclarationStatus;

  return authenticatedRequest(requestEvent, async (token) => {
    const response = await apiClient.imugaDeclarations.updateStatus(
      declarationId,
      status,
      token
    );
    return {
      success: response.success,
      message: response.success
        ? 'Status updated successfully'
        : response.error_message || 'Failed to update status',
    };
  });
});

export const useValidate = routeAction$(async (_data, requestEvent) => {
  const declarationId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const response = await apiClient.imugaDeclarations.validate(
      declarationId,
      token
    );
    const isValid = response.data?.valid || false;
    const validationErrors = response.data?.errors || [];
    return {
      success: response.success,
      data: {
        valid: isValid,
        errors: validationErrors as string[],
      },
      message: response.success
        ? isValid
          ? 'Declaration is valid and ready for export'
          : 'Declaration has validation errors'
        : response.error_message || 'Failed to validate',
    };
  });
});

export const useExport = routeAction$(async (_data, requestEvent) => {
  const declarationId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const response = await apiClient.imugaDeclarations.export(
      declarationId,
      token
    );
    return {
      success: response.success,
      data: response.data,
      message: response.success
        ? 'Export data generated'
        : response.error_message || 'Failed to export',
    };
  });
});

export const useDeleteTraveler = routeAction$(async (data, requestEvent) => {
  const travelerId = data.traveler_id as string;

  return authenticatedRequest(requestEvent, async (token) => {
    const response = await apiClient.imugaTravelers.delete(travelerId, token);
    return {
      success: response.success,
      message: response.success
        ? 'Traveler deleted successfully'
        : response.error_message || 'Failed to delete traveler',
    };
  });
});

export default component$(() => {
  const declarationData = useDeclaration();
  const updateStatusAction = useUpdateStatus();
  const validateAction = useValidate();
  const exportAction = useExport();
  const deleteTravelerAction = useDeleteTraveler();

  const activeTab = useSignal<'overview' | 'travelers' | 'export'>('overview');
  const showDeleteModal = useSignal(false);
  const selectedTravelerId = useSignal<string | null>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPortName = (code: string) => {
    return ARRIVAL_PORTS.find((p) => p.code === code)?.name || code;
  };

  const handleCopyExport = $(async () => {
    const result = await exportAction.submit({});
    if (result.value?.success && result.value?.data) {
      await navigator.clipboard.writeText(
        JSON.stringify(result.value.data, null, 2)
      );
    }
  });

  const handleDownloadExport = $(async () => {
    const result = await exportAction.submit({});
    if (result.value?.success && result.value?.data) {
      const blob = new Blob([JSON.stringify(result.value.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.value.data.declaration_number}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  // Error state
  if (!declarationData.value.success || !declarationData.value.declaration) {
    return (
      <div class="space-y-6">
        <Link
          href="/admin/imuga/declarations"
          class="btn btn-ghost btn-sm"
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
          <span>{declarationData.value.error}</span>
        </div>
      </div>
    );
  }

  const declaration = declarationData.value.declaration;
  const travelers = declaration.travelers || [];

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
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-bold font-mono">
              {declaration.declaration_number}
            </h1>
            <p class="text-base-content/60 mt-1">{declaration.group_name}</p>
          </div>
          <span
            class={`badge ${
              DECLARATION_STATUS_COLORS[declaration.status]
            } badge-lg`}
          >
            {DECLARATION_STATUS_LABELS[declaration.status]}
          </span>
        </div>
      </div>

      {/* Action Messages */}
      {updateStatusAction.value?.message && (
        <div
          class={`alert ${
            updateStatusAction.value.success ? 'alert-success' : 'alert-error'
          }`}
        >
          <span>{updateStatusAction.value.message}</span>
        </div>
      )}

      {deleteTravelerAction.value?.message && (
        <div
          class={`alert ${
            deleteTravelerAction.value.success ? 'alert-success' : 'alert-error'
          }`}
        >
          <span>{deleteTravelerAction.value.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" class="tabs tabs-boxed bg-base-200 p-1">
        <button
          role="tab"
          class={`tab ${activeTab.value === 'overview' ? 'tab-active' : ''}`}
          onClick$={() => (activeTab.value = 'overview')}
        >
          Overview
        </button>
        <button
          role="tab"
          class={`tab ${activeTab.value === 'travelers' ? 'tab-active' : ''}`}
          onClick$={() => (activeTab.value = 'travelers')}
        >
          Travelers ({travelers.length})
        </button>
        <button
          role="tab"
          class={`tab ${activeTab.value === 'export' ? 'tab-active' : ''}`}
          onClick$={() => (activeTab.value = 'export')}
        >
          Export
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab.value === 'overview' && (
        <div class="space-y-6">
          {/* Group Info */}
          <div class="bg-base-200 rounded-xl p-6">
            <h2 class="text-lg font-semibold mb-4">Group Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-base-content/60">Group Name</p>
                <p class="font-medium">{declaration.group_name}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Group Reference</p>
                <p class="font-medium">{declaration.group_reference || '-'}</p>
              </div>
            </div>
          </div>

          {/* Accommodation */}
          <div class="bg-base-200 rounded-xl p-6">
            <h2 class="text-lg font-semibold mb-4">Accommodation</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="col-span-2">
                <p class="text-sm text-base-content/60">Name</p>
                <p class="font-medium">{declaration.accommodation_name}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Island</p>
                <p class="font-medium">{declaration.accommodation_island}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Atoll</p>
                <p class="font-medium">{declaration.accommodation_atoll}</p>
              </div>
              {declaration.accommodation_address && (
                <div class="col-span-4">
                  <p class="text-sm text-base-content/60">Address</p>
                  <p class="font-medium">{declaration.accommodation_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Travel Info */}
          <div class="bg-base-200 rounded-xl p-6">
            <h2 class="text-lg font-semibold mb-4">Travel Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p class="text-sm text-base-content/60">Arrival Date</p>
                <p class="font-medium">{formatDate(declaration.arrival_date)}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Departure Date</p>
                <p class="font-medium">
                  {formatDate(declaration.departure_date)}
                </p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Arrival Port</p>
                <p class="font-medium">{getPortName(declaration.arrival_port)}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Arrival Flight</p>
                <p class="font-medium">{declaration.arrival_flight}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Departure Flight</p>
                <p class="font-medium">{declaration.departure_flight || '-'}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(declaration.internal_notes || declaration.admin_notes) && (
            <div class="bg-base-200 rounded-xl p-6">
              <h2 class="text-lg font-semibold mb-4">Notes</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {declaration.internal_notes && (
                  <div>
                    <p class="text-sm text-base-content/60">Internal Notes</p>
                    <p class="font-medium whitespace-pre-wrap">
                      {declaration.internal_notes}
                    </p>
                  </div>
                )}
                {declaration.admin_notes && (
                  <div>
                    <p class="text-sm text-base-content/60">Admin Notes</p>
                    <p class="font-medium whitespace-pre-wrap">
                      {declaration.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Workflow */}
          <div class="bg-base-200 rounded-xl p-6">
            <h2 class="text-lg font-semibold mb-4">Status Actions</h2>
            <div class="flex gap-3 flex-wrap">
              {declaration.status === 'draft' && (
                <button
                  class="btn btn-warning"
                  onClick$={() =>
                    updateStatusAction.submit({ status: 'ready_for_submission' })
                  }
                  disabled={updateStatusAction.isRunning}
                >
                  {updateStatusAction.isRunning ? (
                    <span class="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Mark Ready for Submission'
                  )}
                </button>
              )}
              {declaration.status === 'ready_for_submission' && (
                <>
                  <button
                    class="btn btn-success"
                    onClick$={() =>
                      updateStatusAction.submit({ status: 'submitted' })
                    }
                    disabled={updateStatusAction.isRunning}
                  >
                    {updateStatusAction.isRunning ? (
                      <span class="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Mark as Submitted'
                    )}
                  </button>
                  <button
                    class="btn btn-ghost"
                    onClick$={() =>
                      updateStatusAction.submit({ status: 'draft' })
                    }
                    disabled={updateStatusAction.isRunning}
                  >
                    Revert to Draft
                  </button>
                </>
              )}
              {declaration.status === 'submitted' && (
                <button
                  class="btn btn-ghost"
                  onClick$={() =>
                    updateStatusAction.submit({ status: 'draft' })
                  }
                  disabled={updateStatusAction.isRunning}
                >
                  Revert to Draft
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Travelers Tab */}
      {activeTab.value === 'travelers' && (
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold">
              Travelers ({travelers.length})
            </h2>
            <Link
              href={`/admin/imuga/declarations/${declaration.id}/add-traveler`}
              class="btn btn-primary btn-sm"
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Traveler
            </Link>
          </div>

          {travelers.length === 0 ? (
            <div class="bg-base-200 rounded-xl p-8 text-center">
              <svg
                class="size-12 text-base-content/30 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              <p class="text-base-content/50 mb-4">No travelers added yet</p>
              <Link
                href={`/admin/imuga/declarations/${declaration.id}/add-traveler`}
                class="btn btn-primary btn-sm"
              >
                Add First Traveler
              </Link>
            </div>
          ) : (
            <div class="bg-base-200 rounded-xl p-4">
              {travelers.map((traveler, index) => (
                <TravelerCard
                  key={traveler.id}
                  traveler={traveler}
                  index={index}
                  onDelete$={(t) => {
                    selectedTravelerId.value = t.id;
                    showDeleteModal.value = true;
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab.value === 'export' && (
        <div class="space-y-6">
          {/* Validation */}
          <div class="bg-base-200 rounded-xl p-6">
            <h2 class="text-lg font-semibold mb-4">Validation</h2>
            <p class="text-base-content/60 mb-4">
              Validate the declaration before exporting to ensure all required
              fields are filled correctly.
            </p>
            <button
              class="btn btn-primary"
              onClick$={() => validateAction.submit({})}
              disabled={validateAction.isRunning}
            >
              {validateAction.isRunning ? (
                <>
                  <span class="loading loading-spinner loading-sm"></span>
                  Validating...
                </>
              ) : (
                'Validate Declaration'
              )}
            </button>

            {validateAction.value && (
              <div
                class={`mt-4 alert ${
                  validateAction.value.data?.valid ? 'alert-success' : 'alert-warning'
                }`}
              >
                <span>{validateAction.value.message}</span>
              </div>
            )}

            {validateAction.value?.data?.errors &&
              validateAction.value.data.errors.length > 0 && (
                <div class="mt-4">
                  <p class="font-medium text-error mb-2">Validation Errors:</p>
                  <ul class="list-disc list-inside text-sm text-error">
                    {validateAction.value.data.errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          {/* Export */}
          <div class="bg-base-200 rounded-xl p-6">
            <h2 class="text-lg font-semibold mb-4">Export for Chrome Plugin</h2>
            <p class="text-base-content/60 mb-4">
              Export the declaration data in the format required by the IMUGA
              Chrome plugin.
            </p>
            <div class="flex gap-3">
              <button
                class="btn btn-primary"
                onClick$={handleDownloadExport}
                disabled={exportAction.isRunning}
              >
                {exportAction.isRunning ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Exporting...
                  </>
                ) : (
                  <>
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
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Download JSON
                  </>
                )}
              </button>
              <button
                class="btn btn-ghost"
                onClick$={handleCopyExport}
                disabled={exportAction.isRunning}
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
                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                  />
                </svg>
                Copy to Clipboard
              </button>
            </div>

            {exportAction.value?.success && (
              <div class="alert alert-success mt-4">
                <span>Export data ready!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Traveler Modal */}
      {showDeleteModal.value && selectedTravelerId.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg">Delete Traveler</h3>
            <p class="py-4 text-base-content/70">
              Are you sure you want to delete this traveler? This action cannot
              be undone.
            </p>
            <div class="modal-action">
              <button
                class="btn btn-ghost"
                onClick$={() => {
                  showDeleteModal.value = false;
                  selectedTravelerId.value = null;
                }}
              >
                Cancel
              </button>
              <button
                class="btn btn-error"
                onClick$={async () => {
                  if (selectedTravelerId.value) {
                    await deleteTravelerAction.submit({
                      traveler_id: selectedTravelerId.value,
                    });
                    showDeleteModal.value = false;
                    selectedTravelerId.value = null;
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
          <div
            class="modal-backdrop bg-base-300/50"
            onClick$={() => {
              showDeleteModal.value = false;
              selectedTravelerId.value = null;
            }}
          ></div>
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useDeclaration);
  const declaration = data.declaration;
  return {
    title: declaration
      ? `${declaration.declaration_number} | IMUGA | Admin | Rihigo`
      : 'Declaration | IMUGA | Admin | Rihigo',
    meta: [
      {
        name: 'description',
        content: 'View and manage IMUGA declaration details.',
      },
    ],
  };
};
