import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { ImugaRequest, ImugaRequestStatus } from '~/types/imuga';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
} from '~/types/imuga';

export const useRequests = routeLoader$(async (requestEvent) => {
  const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
  const status = requestEvent.url.searchParams.get('status') || undefined;
  const search = requestEvent.url.searchParams.get('search') || undefined;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.imugaRequests.list(token, {
      page,
      page_size: 20,
      status: status as ImugaRequestStatus | undefined,
      search,
    });
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error_message || 'Failed to load requests',
      requests: [] as ImugaRequest[],
    };
  }

  return {
    success: true,
    error: null,
    requests: (response.data || []) as ImugaRequest[],
    pagination: response.pagination_data,
  };
});

export const useProcessRequest = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const requestId = data.request_id as string;
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

export default component$(() => {
  const requestsData = useRequests();
  const processAction = useProcessRequest();

  const filterStatus = useSignal<string>('all');
  const searchTerm = useSignal<string>('');
  const showRejectModal = useSignal(false);
  const selectedRequest = useSignal<ImugaRequest | null>(null);
  const rejectionReason = useSignal('');

  const requests = requestsData.value.requests;

  const filteredRequests = requests.filter((request) => {
    const matchesStatus =
      filterStatus.value === 'all' || request.status === filterStatus.value;
    const matchesSearch =
      searchTerm.value === '' ||
      request.request_number
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase()) ||
      request.requester_name
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase()) ||
      request.requester_email
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase()) ||
      request.group_name
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const processingCount = requests.filter(
    (r) => r.status === 'processing'
  ).length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">IMUGA Requests</h1>
          <p class="text-base-content/60 mt-1">
            Manage public IMUGA request submissions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Pending</p>
          <p class="text-2xl font-bold mt-1 text-info">{pendingCount}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Processing</p>
          <p class="text-2xl font-bold mt-1 text-warning">{processingCount}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Completed</p>
          <p class="text-2xl font-bold mt-1 text-success">{completedCount}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Rejected</p>
          <p class="text-2xl font-bold mt-1 text-error">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-base-200 rounded-xl p-4">
        <div class="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div class="flex-1">
            <div class="relative">
              <svg
                class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by request #, name, email, or group..."
                class="input input-sm input-bordered w-full pl-9"
                value={searchTerm.value}
                onInput$={(e) =>
                  (searchTerm.value = (e.target as HTMLInputElement).value)
                }
              />
            </div>
          </div>

          {/* Status filter */}
          <div class="flex gap-1 flex-wrap">
            {['all', 'pending', 'processing', 'completed', 'rejected'].map(
              (status) => (
                <button
                  key={status}
                  class={`btn btn-sm ${
                    filterStatus.value === status ? 'btn-primary' : 'btn-ghost'
                  }`}
                  onClick$={() => (filterStatus.value = status)}
                >
                  {status === 'all'
                    ? 'All'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {!requestsData.value.success && (
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
          <span>{requestsData.value.error}</span>
        </div>
      )}

      {/* Success/Error from actions */}
      {processAction.value?.message && (
        <div
          class={`alert ${
            processAction.value.success ? 'alert-success' : 'alert-error'
          }`}
        >
          <span>{processAction.value.message}</span>
        </div>
      )}

      {/* Table */}
      <div class="bg-base-200 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Requester</th>
                <th>Group</th>
                <th>Travelers</th>
                <th>Arrival</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} class="text-center py-8">
                    <div class="flex flex-col items-center gap-2">
                      <svg
                        class="size-12 text-base-content/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                        />
                      </svg>
                      <p class="text-base-content/50">No requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} class="hover">
                    <td>
                      <Link
                        href={`/admin/imuga/requests/${request.id}`}
                        class="font-mono text-primary hover:underline"
                      >
                        {request.request_number}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p class="font-medium">{request.requester_name}</p>
                        <p class="text-xs text-base-content/60">
                          {request.requester_email}
                        </p>
                      </div>
                    </td>
                    <td>{request.group_name}</td>
                    <td>
                      <span class="badge badge-ghost">
                        {request.total_travelers}
                      </span>
                    </td>
                    <td>{formatDate(request.arrival_date)}</td>
                    <td>
                      <span
                        class={`badge ${REQUEST_STATUS_COLORS[request.status]}`}
                      >
                        {REQUEST_STATUS_LABELS[request.status]}
                      </span>
                    </td>
                    <td class="text-base-content/60 text-sm">
                      {formatDate(request.created_at)}
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <Link
                          href={`/admin/imuga/requests/${request.id}`}
                          class="btn btn-ghost btn-xs"
                        >
                          View
                        </Link>
                        {request.status === 'pending' && (
                          <>
                            <button
                              class="btn btn-ghost btn-xs text-success"
                              onClick$={async () => {
                                await processAction.submit({
                                  request_id: request.id,
                                  action: 'approve',
                                });
                              }}
                            >
                              Approve
                            </button>
                            <button
                              class="btn btn-ghost btn-xs text-error"
                              onClick$={() => {
                                selectedRequest.value = request;
                                rejectionReason.value = '';
                                showRejectModal.value = true;
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.declaration_id && (
                          <Link
                            href={`/admin/imuga/declarations/${request.declaration_id}`}
                            class="btn btn-ghost btn-xs"
                          >
                            Declaration
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal.value && selectedRequest.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg">Reject Request</h3>
            <p class="py-4 text-base-content/70">
              Reject request{' '}
              <span class="font-mono font-bold">
                {selectedRequest.value.request_number}
              </span>
              ?
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
                  selectedRequest.value = null;
                }}
              >
                Cancel
              </button>
              <button
                class="btn btn-error"
                onClick$={async () => {
                  if (selectedRequest.value) {
                    await processAction.submit({
                      request_id: selectedRequest.value.id,
                      action: 'reject',
                      rejection_reason: rejectionReason.value,
                    });
                    showRejectModal.value = false;
                    selectedRequest.value = null;
                  }
                }}
              >
                Reject Request
              </button>
            </div>
          </div>
          <div
            class="modal-backdrop bg-base-300/50"
            onClick$={() => {
              showRejectModal.value = false;
              selectedRequest.value = null;
            }}
          ></div>
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'IMUGA Requests | Admin | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Manage public IMUGA request submissions.',
    },
  ],
};
