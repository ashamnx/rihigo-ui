import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Link, useNavigate } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { ImugaRequest } from '~/types/imuga';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  TRAVELER_TITLES,
  GENDERS,
  VISIT_PURPOSES,
  getCountryName,
} from '~/types/imuga';

export const useRequest = routeLoader$(async (requestEvent) => {
  const requestId = requestEvent.params.id;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.imugaRequests.getById(requestId, token);
  });

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error_message || 'Request not found',
      request: null as ImugaRequest | null,
    };
  }

  return {
    success: true,
    error: null,
    request: response.data as ImugaRequest,
  };
});

export const useProcessRequest = routeAction$(async (data, requestEvent) => {
  const requestId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const action = data.action as 'approve' | 'reject';
    const rejectionReason = data.rejection_reason as string | undefined;

    const response = await apiClient.imugaRequests.process(
      requestId,
      {
        action,
        rejection_reason: rejectionReason,
      },
      token
    );

    return {
      success: response.success,
      message: response.success
        ? action === 'approve'
          ? 'Request approved successfully'
          : 'Request rejected'
        : response.error_message || 'Failed to process request',
    };
  });
});

export const useConvertToDeclaration = routeAction$(async (_data, requestEvent) => {
  const requestId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const response = await apiClient.imugaRequests.convert(requestId, token);

    if (response.success && response.data) {
      return {
        success: true,
        data: { declaration_id: response.data.id },
        message: 'Declaration created successfully',
      };
    }

    return {
      success: false,
      error_message: response.error_message || 'Failed to convert to declaration',
    };
  });
});

export default component$(() => {
  const requestData = useRequest();
  const processAction = useProcessRequest();
  const convertAction = useConvertToDeclaration();
  const navigate = useNavigate();

  const showRejectModal = useSignal(false);
  const rejectionReason = useSignal('');

  // Redirect on successful conversion
  if (convertAction.value?.success && convertAction.value.data?.declaration_id) {
    navigate(`/admin/imuga/declarations/${convertAction.value.data.declaration_id}`);
  }

  const request = requestData.value.request;

  if (!requestData.value.success || !request) {
    return (
      <div class="space-y-6">
        <Link href="/admin/imuga/requests" class="btn btn-ghost btn-sm">
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
          Back to Requests
        </Link>
        <div class="alert alert-error">
          <span>{requestData.value.error}</span>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTitleLabel = (value: string) => {
    return TRAVELER_TITLES.find((t) => t.value === value)?.label || value;
  };

  const getGenderLabel = (value: string) => {
    return GENDERS.find((g) => g.value === value)?.label || value;
  };

  const getPurposeLabel = (value: string) => {
    return VISIT_PURPOSES.find((p) => p.value === value)?.label || value;
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/imuga/requests" class="btn btn-ghost btn-sm mb-4">
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
          Back to Requests
        </Link>
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold font-mono">
                {request.request_number}
              </h1>
              <span class={`badge ${REQUEST_STATUS_COLORS[request.status]}`}>
                {REQUEST_STATUS_LABELS[request.status]}
              </span>
            </div>
            <p class="text-base-content/60 mt-1">
              Submitted {formatDate(request.created_at)}
            </p>
          </div>

          {/* Actions */}
          <div class="flex gap-2">
            {request.status === 'pending' && (
              <>
                <button
                  class="btn btn-success btn-sm"
                  onClick$={async () => {
                    await processAction.submit({ action: 'approve' });
                  }}
                  disabled={processAction.isRunning}
                >
                  {processAction.isRunning ? (
                    <span class="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Approve'
                  )}
                </button>
                <button
                  class="btn btn-error btn-sm"
                  onClick$={() => {
                    rejectionReason.value = '';
                    showRejectModal.value = true;
                  }}
                >
                  Reject
                </button>
              </>
            )}
            {request.status === 'completed' && !request.declaration_id && (
              <button
                class="btn btn-primary btn-sm"
                onClick$={async () => {
                  await convertAction.submit({});
                }}
                disabled={convertAction.isRunning}
              >
                {convertAction.isRunning ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Converting...
                  </>
                ) : (
                  'Convert to Declaration'
                )}
              </button>
            )}
            {request.declaration_id && (
              <Link
                href={`/admin/imuga/declarations/${request.declaration_id}`}
                class="btn btn-primary btn-sm"
              >
                View Declaration
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Action Messages */}
      {processAction.value?.message && (
        <div
          class={`alert ${
            processAction.value.success ? 'alert-success' : 'alert-error'
          }`}
        >
          <span>{processAction.value.message}</span>
        </div>
      )}
      {convertAction.value?.error_message && !convertAction.value.success && (
        <div class="alert alert-error">
          <span>{convertAction.value.error_message}</span>
        </div>
      )}

      {/* Rejection Reason */}
      {request.status === 'rejected' && request.rejection_reason && (
        <div class="alert alert-error">
          <div>
            <p class="font-semibold">Rejection Reason</p>
            <p>{request.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Requester Info */}
      <div class="bg-base-200 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Requester Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-base-content/60">Name</p>
            <p class="font-medium">{request.requester_name}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/60">Email</p>
            <p class="font-medium">{request.requester_email}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/60">Phone</p>
            <p class="font-medium">{request.requester_phone || '-'}</p>
          </div>
        </div>
      </div>

      {/* Group & Accommodation */}
      <div class="bg-base-200 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Group & Accommodation</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p class="text-xs text-base-content/60">Group Name</p>
            <p class="font-medium">{request.group_name}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/60">Accommodation</p>
            <p class="font-medium">{request.accommodation_name}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/60">Island</p>
            <p class="font-medium">{request.accommodation_island}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/60">Atoll</p>
            <p class="font-medium">{request.accommodation_atoll}</p>
          </div>
        </div>
      </div>

      {/* Travel Info */}
      <div class="bg-base-200 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">Travel Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p class="text-xs text-base-content/60">Arrival Date</p>
            <p class="font-medium">{formatDate(request.arrival_date)}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/60">Departure Date</p>
            <p class="font-medium">{formatDate(request.departure_date)}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/60">Arrival Flight</p>
            <p class="font-medium font-mono">{request.arrival_flight}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/60">Departure Flight</p>
            <p class="font-medium font-mono">
              {request.departure_flight || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {request.notes && (
        <div class="bg-base-200 rounded-xl p-6">
          <h2 class="text-lg font-semibold mb-4">Notes</h2>
          <p class="text-base-content/80 whitespace-pre-wrap">{request.notes}</p>
        </div>
      )}

      {/* Travelers */}
      <div class="bg-base-200 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">
            Travelers ({request.total_travelers})
          </h2>
        </div>

        {request.travelers_data && request.travelers_data.length > 0 ? (
          <div class="space-y-3">
            {request.travelers_data.map((traveler, index) => (
              <div
                key={index}
                class="collapse collapse-arrow bg-base-100 rounded-lg"
              >
                <input type="checkbox" />
                <div class="collapse-title font-medium flex items-center gap-3">
                  <span class="badge badge-primary badge-sm">{index + 1}</span>
                  <div class="flex items-center gap-2 flex-1">
                    {traveler.photo_url && (
                      <div class="avatar">
                        <div class="w-8 rounded-full">
                          <img
                            src={traveler.photo_url}
                            alt={`${traveler.first_name} ${traveler.last_name}`}
                            width={32}
                            height={32}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <span class="font-medium">
                        {getTitleLabel(traveler.title)} {traveler.first_name}{' '}
                        {traveler.middle_name} {traveler.last_name}
                      </span>
                      <span class="text-xs text-base-content/60 ml-2">
                        {getCountryName(traveler.nationality)}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="collapse-content">
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                    {/* Personal Info */}
                    <div>
                      <p class="text-xs text-base-content/60">Gender</p>
                      <p class="text-sm">{getGenderLabel(traveler.gender)}</p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Date of Birth</p>
                      <p class="text-sm">{formatDate(traveler.date_of_birth)}</p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Place of Birth</p>
                      <p class="text-sm">{traveler.place_of_birth}</p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">
                        Country of Residence
                      </p>
                      <p class="text-sm">
                        {getCountryName(traveler.country_of_residence)}
                      </p>
                    </div>

                    {/* Passport */}
                    <div>
                      <p class="text-xs text-base-content/60">Passport Number</p>
                      <p class="text-sm font-mono">{traveler.passport_number}</p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Passport Issue</p>
                      <p class="text-sm">
                        {formatDate(traveler.passport_issue_date)}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Passport Expiry</p>
                      <p class="text-sm">
                        {formatDate(traveler.passport_expiry_date)}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Issuing Country</p>
                      <p class="text-sm">
                        {getCountryName(traveler.passport_issuing_country)}
                      </p>
                    </div>

                    {/* Contact */}
                    <div>
                      <p class="text-xs text-base-content/60">Email</p>
                      <p class="text-sm">{traveler.email}</p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Phone</p>
                      <p class="text-sm">
                        {traveler.phone_country_code} {traveler.phone}
                      </p>
                    </div>

                    {/* Visit */}
                    <div>
                      <p class="text-xs text-base-content/60">Purpose of Visit</p>
                      <p class="text-sm">
                        {getPurposeLabel(traveler.visit_purpose)}
                        {traveler.visit_purpose === 'other' &&
                          traveler.visit_purpose_other &&
                          ` (${traveler.visit_purpose_other})`}
                      </p>
                    </div>

                    {/* Address */}
                    <div class="col-span-2">
                      <p class="text-xs text-base-content/60">Address</p>
                      <p class="text-sm">
                        {traveler.permanent_address.line1}
                        {traveler.permanent_address.line2 &&
                          `, ${traveler.permanent_address.line2}`}
                        , {traveler.permanent_address.city}
                        {traveler.permanent_address.state &&
                          `, ${traveler.permanent_address.state}`}
                        {traveler.permanent_address.postal_code &&
                          ` ${traveler.permanent_address.postal_code}`}
                        , {getCountryName(traveler.permanent_address.country)}
                      </p>
                    </div>

                    {/* Health */}
                    <div>
                      <p class="text-xs text-base-content/60">
                        Yellow Fever Travel
                      </p>
                      <p class="text-sm">
                        {traveler.yellow_fever_endemic_travel ? (
                          <span class="badge badge-warning badge-sm">Yes</span>
                        ) : (
                          <span class="badge badge-ghost badge-sm">No</span>
                        )}
                      </p>
                    </div>

                    {/* Customs */}
                    <div>
                      <p class="text-xs text-base-content/60">Items to Declare</p>
                      <p class="text-sm">
                        {traveler.customs_items_to_declare ? (
                          <span class="badge badge-warning badge-sm">Yes</span>
                        ) : (
                          <span class="badge badge-ghost badge-sm">No</span>
                        )}
                      </p>
                    </div>

                    {/* Emergency Contact */}
                    <div class="col-span-2">
                      <p class="text-xs text-base-content/60">Emergency Contact</p>
                      <p class="text-sm">
                        {traveler.emergency_contact.contact_name} (
                        {traveler.emergency_contact.contact_relationship}) -{' '}
                        {traveler.emergency_contact.contact_phone}
                      </p>
                    </div>
                  </div>

                  {/* Documents */}
                  {(traveler.passport_image_url || traveler.photo_url) && (
                    <div class="mt-4 pt-4 border-t border-base-300">
                      <p class="text-xs text-base-content/60 mb-2">Documents</p>
                      <div class="flex gap-4">
                        {traveler.photo_url && (
                          <div>
                            <p class="text-xs mb-1">Photo</p>
                            <img
                              src={traveler.photo_url}
                              alt="Traveler photo"
                              class="w-20 h-24 object-cover rounded"
                              width={80}
                              height={96}
                            />
                          </div>
                        )}
                        {traveler.passport_image_url && (
                          <div>
                            <p class="text-xs mb-1">Passport</p>
                            <img
                              src={traveler.passport_image_url}
                              alt="Passport"
                              class="w-32 h-24 object-cover rounded"
                              width={128}
                              height={96}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div class="text-center py-8">
            <p class="text-base-content/50">No travelers in this request</p>
          </div>
        )}
      </div>

      {/* Processing Info */}
      {(request.processed_at || request.processed_by) && (
        <div class="bg-base-200 rounded-xl p-6">
          <h2 class="text-lg font-semibold mb-4">Processing Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {request.processed_at && (
              <div>
                <p class="text-xs text-base-content/60">Processed At</p>
                <p class="font-medium">{formatDate(request.processed_at)}</p>
              </div>
            )}
            {request.processed_by && (
              <div>
                <p class="text-xs text-base-content/60">Processed By</p>
                <p class="font-medium">{request.processed_by}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg">Reject Request</h3>
            <p class="py-4 text-base-content/70">
              Reject request{' '}
              <span class="font-mono font-bold">{request.request_number}</span>?
            </p>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Rejection Reason</span>
              </label>
              <textarea
                class="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Provide a reason for rejection..."
                value={rejectionReason.value}
                onInput$={(e) =>
                  (rejectionReason.value = (e.target as HTMLTextAreaElement).value)
                }
              ></textarea>
            </div>
            <div class="modal-action">
              <button
                class="btn btn-ghost"
                onClick$={() => {
                  showRejectModal.value = false;
                }}
              >
                Cancel
              </button>
              <button
                class="btn btn-error"
                onClick$={async () => {
                  await processAction.submit({
                    action: 'reject',
                    rejection_reason: rejectionReason.value,
                  });
                  showRejectModal.value = false;
                }}
                disabled={processAction.isRunning}
              >
                {processAction.isRunning ? (
                  <span class="loading loading-spinner loading-sm"></span>
                ) : (
                  'Reject Request'
                )}
              </button>
            </div>
          </div>
          <div
            class="modal-backdrop bg-base-300/50"
            onClick$={() => {
              showRejectModal.value = false;
            }}
          ></div>
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Request Details | IMUGA | Admin | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'View and manage IMUGA request details.',
    },
  ],
};
