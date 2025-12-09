import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { ImugaDeclaration, ImugaDeclarationStatus } from '~/types/imuga';
import {
  DECLARATION_STATUS_LABELS,
  DECLARATION_STATUS_COLORS,
} from '~/types/imuga';

export const useDeclarations = routeLoader$(async (requestEvent) => {
  const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
  const status = requestEvent.url.searchParams.get('status') || undefined;
  const search = requestEvent.url.searchParams.get('search') || undefined;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.imugaDeclarations.list(token, {
      page,
      page_size: 20,
      status: status as ImugaDeclarationStatus | undefined,
      search,
    });
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error_message || 'Failed to load declarations',
      declarations: [] as ImugaDeclaration[],
    };
  }

  return {
    success: true,
    error: null,
    declarations: (response.data || []) as ImugaDeclaration[],
    pagination: response.pagination_data,
  };
});

export const useDeleteDeclaration = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const declarationId = data.declaration_id as string;
    const response = await apiClient.imugaDeclarations.delete(declarationId, token);
    return {
      success: response.success,
      message: response.success
        ? 'Declaration deleted successfully'
        : response.error_message || 'Failed to delete declaration',
    };
  });
});

export default component$(() => {
  const declarationsData = useDeclarations();
  const deleteAction = useDeleteDeclaration();

  const filterStatus = useSignal<string>('all');
  const searchTerm = useSignal<string>('');
  const showDeleteModal = useSignal(false);
  const selectedDeclaration = useSignal<ImugaDeclaration | null>(null);

  const declarations = declarationsData.value.declarations;

  const filteredDeclarations = declarations.filter((declaration) => {
    const matchesStatus =
      filterStatus.value === 'all' || declaration.status === filterStatus.value;
    const matchesSearch =
      searchTerm.value === '' ||
      declaration.declaration_number
        .toLowerCase()
        .includes(searchTerm.value.toLowerCase()) ||
      declaration.group_name
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
  const draftCount = declarations.filter((d) => d.status === 'draft').length;
  const readyCount = declarations.filter(
    (d) => d.status === 'ready_for_submission'
  ).length;
  const submittedCount = declarations.filter(
    (d) => d.status === 'submitted'
  ).length;

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">IMUGA Declarations</h1>
          <p class="text-base-content/60 mt-1">
            Manage immigration declarations for travelers
          </p>
        </div>
        <Link href="/admin/imuga/declarations/new" class="btn btn-primary">
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Declaration
        </Link>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Total</p>
          <p class="text-2xl font-bold mt-1">{declarations.length}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Draft</p>
          <p class="text-2xl font-bold mt-1">{draftCount}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Ready</p>
          <p class="text-2xl font-bold mt-1 text-warning">{readyCount}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Submitted</p>
          <p class="text-2xl font-bold mt-1 text-success">{submittedCount}</p>
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
                placeholder="Search by declaration # or group name..."
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
            {['all', 'draft', 'ready_for_submission', 'submitted'].map(
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
                    : status === 'ready_for_submission'
                    ? 'Ready'
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {!declarationsData.value.success && (
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
          <span>{declarationsData.value.error}</span>
        </div>
      )}

      {/* Success/Error from actions */}
      {deleteAction.value?.message && (
        <div
          class={`alert ${
            deleteAction.value.success ? 'alert-success' : 'alert-error'
          }`}
        >
          <span>{deleteAction.value.message}</span>
        </div>
      )}

      {/* Table */}
      <div class="bg-base-200 rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Declaration #</th>
                <th>Group Name</th>
                <th>Travelers</th>
                <th>Arrival</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeclarations.length === 0 ? (
                <tr>
                  <td colSpan={7} class="text-center py-8">
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
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      <p class="text-base-content/50">No declarations found</p>
                      <Link
                        href="/admin/imuga/declarations/new"
                        class="btn btn-primary btn-sm"
                      >
                        Create Declaration
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeclarations.map((declaration) => (
                  <tr key={declaration.id} class="hover">
                    <td>
                      <Link
                        href={`/admin/imuga/declarations/${declaration.id}`}
                        class="font-mono text-primary hover:underline"
                      >
                        {declaration.declaration_number}
                      </Link>
                    </td>
                    <td>{declaration.group_name}</td>
                    <td>
                      <span class="badge badge-ghost">
                        {declaration.travelers_count || 0}
                      </span>
                    </td>
                    <td>{formatDate(declaration.arrival_date)}</td>
                    <td>
                      <span
                        class={`badge ${
                          DECLARATION_STATUS_COLORS[declaration.status]
                        }`}
                      >
                        {DECLARATION_STATUS_LABELS[declaration.status]}
                      </span>
                    </td>
                    <td class="text-base-content/60 text-sm">
                      {formatDate(declaration.created_at)}
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <Link
                          href={`/admin/imuga/declarations/${declaration.id}`}
                          class="btn btn-ghost btn-xs"
                        >
                          View
                        </Link>
                        <button
                          class="btn btn-ghost btn-xs text-error"
                          onClick$={() => {
                            selectedDeclaration.value = declaration;
                            showDeleteModal.value = true;
                          }}
                        >
                          Delete
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal.value && selectedDeclaration.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg">Delete Declaration</h3>
            <p class="py-4 text-base-content/70">
              Are you sure you want to delete declaration{' '}
              <span class="font-mono font-bold">
                {selectedDeclaration.value.declaration_number}
              </span>
              ? This will also delete all associated travelers.
            </p>
            <div class="modal-action">
              <button
                class="btn btn-ghost"
                onClick$={() => {
                  showDeleteModal.value = false;
                  selectedDeclaration.value = null;
                }}
              >
                Cancel
              </button>
              <button
                class="btn btn-error"
                onClick$={async () => {
                  if (selectedDeclaration.value) {
                    await deleteAction.submit({
                      declaration_id: selectedDeclaration.value.id,
                    });
                    showDeleteModal.value = false;
                    selectedDeclaration.value = null;
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
              selectedDeclaration.value = null;
            }}
          ></div>
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'IMUGA Declarations | Admin | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Manage IMUGA immigration declarations for travelers.',
    },
  ],
};
