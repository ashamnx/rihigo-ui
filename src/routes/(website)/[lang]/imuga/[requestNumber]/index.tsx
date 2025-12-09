import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, Link, useLocation } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import type { ImugaRequest } from '~/types/imuga';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  DECLARATION_STATUS_LABELS,
  DECLARATION_STATUS_COLORS,
  getCountryName,
  TRAVELER_TITLES,
  GENDERS,
  VISIT_PURPOSES,
} from '~/types/imuga';

export const useRequestStatus = routeLoader$(async (requestEvent) => {
  const requestNumber = requestEvent.params.requestNumber;

  const response = await apiClient.imugaPublic.getRequestStatus(requestNumber);

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error_message || 'Request not found',
      request: null,
    };
  }

  return {
    success: true,
    error: null,
    request: response.data as ImugaRequest,
  };
});

export default component$(() => {
  const location = useLocation();
  const lang = location.params.lang || 'en-US';
  const requestNumber = location.params.requestNumber;
  const requestData = useRequestStatus();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  // Error state
  if (!requestData.value.success || !requestData.value.request) {
    return (
      <div class="min-h-screen bg-base-100">
        <div class="container mx-auto px-4 py-12 max-w-2xl">
          <div class="bg-base-200 rounded-xl p-8 text-center">
            <div class="size-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
              <svg
                class="size-8 text-error"
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
            </div>
            <h1 class="text-2xl font-bold mb-2">Request Not Found</h1>
            <p class="text-base-content/60 mb-6">
              We couldn't find a request with the number{' '}
              <span class="font-mono font-bold">{requestNumber}</span>. Please
              check the number and try again.
            </p>
            <div class="flex gap-3 justify-center">
              <Link href={`/${lang}/imuga`} class="btn btn-primary">
                Submit New Request
              </Link>
              <Link href={`/${lang}`} class="btn btn-ghost">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const request = requestData.value.request;
  const statusLabel = REQUEST_STATUS_LABELS[request.status];
  const statusColor = REQUEST_STATUS_COLORS[request.status];

  return (
    <div class="min-h-screen bg-base-100">
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div class="mb-8">
          <Link href={`/${lang}/imuga`} class="btn btn-ghost btn-sm mb-4">
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
            Back
          </Link>
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 class="text-2xl font-bold">Request Status</h1>
              <p class="text-base-content/60 mt-1 font-mono">
                {request.request_number}
              </p>
            </div>
            <span class={`badge ${statusColor} badge-lg`}>{statusLabel}</span>
          </div>
        </div>

        {/* Status Banner */}
        {request.status === 'pending' && (
          <div class="bg-info/10 border border-info/20 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-3">
              <svg
                class="size-5 text-info flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="text-sm">
                <p class="font-medium text-info mb-1">Pending Review</p>
                <p class="text-base-content/70">
                  Your request is in the queue and will be reviewed shortly. We'll
                  notify you by email when there's an update.
                </p>
              </div>
            </div>
          </div>
        )}

        {request.status === 'processing' && (
          <div class="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-3">
              <span class="loading loading-spinner loading-sm text-warning mt-0.5"></span>
              <div class="text-sm">
                <p class="font-medium text-warning mb-1">Processing</p>
                <p class="text-base-content/70">
                  Your request is currently being processed. You will receive an
                  email once it's completed.
                </p>
              </div>
            </div>
          </div>
        )}

        {request.status === 'completed' && request.declaration && (
          <div class="bg-success/10 border border-success/20 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-3">
              <svg
                class="size-5 text-success flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="text-sm">
                <p class="font-medium text-success mb-1">
                  Declaration Created
                </p>
                <p class="text-base-content/70">
                  Your IMUGA declaration has been created with number{' '}
                  <span class="font-mono font-bold">
                    {request.declaration.declaration_number}
                  </span>
                  .
                  {request.declaration.status === 'submitted' && (
                    <span class="ml-1">
                      It has been submitted to the IMUGA portal.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {request.status === 'rejected' && (
          <div class="bg-error/10 border border-error/20 rounded-xl p-4 mb-6">
            <div class="flex items-start gap-3">
              <svg
                class="size-5 text-error flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="text-sm">
                <p class="font-medium text-error mb-1">Request Rejected</p>
                <p class="text-base-content/70">
                  {request.rejection_reason ||
                    'Your request could not be processed. Please contact support for more information.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Request Details */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Request Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-base-content/60">Requester</p>
              <p class="font-medium">{request.requester_name}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Email</p>
              <p class="font-medium">{request.requester_email}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Group Name</p>
              <p class="font-medium">{request.group_name}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Submitted On</p>
              <p class="font-medium">{formatDate(request.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Accommodation */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Accommodation</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-sm text-base-content/60">Name</p>
              <p class="font-medium">{request.accommodation_name}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Island</p>
              <p class="font-medium">{request.accommodation_island}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Atoll</p>
              <p class="font-medium">{request.accommodation_atoll}</p>
            </div>
          </div>
        </div>

        {/* Travel Information */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Travel Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p class="text-sm text-base-content/60">Arrival Date</p>
              <p class="font-medium">{formatDate(request.arrival_date)}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Departure Date</p>
              <p class="font-medium">{formatDate(request.departure_date)}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Arrival Flight</p>
              <p class="font-medium">{request.arrival_flight}</p>
            </div>
            <div>
              <p class="text-sm text-base-content/60">Departure Flight</p>
              <p class="font-medium">{request.departure_flight || '-'}</p>
            </div>
          </div>
        </div>

        {/* Travelers */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">
            Travelers ({request.travelers_data.length})
          </h2>
          <div class="space-y-4">
            {request.travelers_data.map((traveler, index) => (
              <div
                key={index}
                class="collapse collapse-arrow bg-base-100 rounded-lg"
              >
                <input type="checkbox" />
                <div class="collapse-title font-medium">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-primary badge-sm">{index + 1}</span>
                    <span>
                      {getTitleLabel(traveler.title)} {traveler.first_name}{' '}
                      {traveler.last_name}
                    </span>
                  </div>
                </div>
                <div class="collapse-content">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <div>
                      <p class="text-xs text-base-content/60">Gender</p>
                      <p class="text-sm">{getGenderLabel(traveler.gender)}</p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Date of Birth</p>
                      <p class="text-sm">{formatDate(traveler.date_of_birth)}</p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Nationality</p>
                      <p class="text-sm">
                        {getCountryName(traveler.nationality)}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Passport Number</p>
                      <p class="text-sm font-mono">{traveler.passport_number}</p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Passport Expiry</p>
                      <p class="text-sm">
                        {formatDate(traveler.passport_expiry_date)}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-base-content/60">Purpose of Visit</p>
                      <p class="text-sm">
                        {getPurposeLabel(traveler.visit_purpose)}
                      </p>
                    </div>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Declaration Status (if linked) */}
        {request.declaration && (
          <div class="bg-base-200 rounded-xl p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">Declaration Status</h2>
            <div class="flex items-center gap-4">
              <div>
                <p class="text-sm text-base-content/60">Declaration Number</p>
                <p class="font-mono font-bold">
                  {request.declaration.declaration_number}
                </p>
              </div>
              <span
                class={`badge ${
                  DECLARATION_STATUS_COLORS[request.declaration.status]
                } badge-lg ml-auto`}
              >
                {DECLARATION_STATUS_LABELS[request.declaration.status]}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div class="flex gap-3 justify-center">
          <Link href={`/${lang}/imuga`} class="btn btn-ghost">
            Submit Another Request
          </Link>
          <Link href={`/${lang}`} class="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ params }) => ({
  title: `Request ${params.requestNumber} | IMUGA Declaration | Rihigo`,
  meta: [
    {
      name: 'description',
      content: 'Check the status of your IMUGA declaration request.',
    },
  ],
});
