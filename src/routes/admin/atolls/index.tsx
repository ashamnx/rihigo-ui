import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { getAtolls } from "~/services/activity-api";
import type { Atoll } from "~/types/activity";

export const useAtolls = routeLoader$(async () => {
  try {
    return await getAtolls();
  } catch (error) {
    console.error('Failed to load atolls:', error);
    return [];
  }
});

export const useCreateAtoll = routeAction$(async () => {
  // TODO: Implement admin API endpoint for creating atolls
  return {
    success: false,
    message: "Atoll creation via admin API is not yet implemented"
  };
});

export const useUpdateAtoll = routeAction$(async () => {
  // TODO: Implement admin API endpoint for updating atolls
  return {
    success: false,
    message: "Atoll update via admin API is not yet implemented"
  };
});

export const useDeleteAtoll = routeAction$(async () => {
  // TODO: Implement admin API endpoint for deleting atolls
  return {
    success: false,
    message: "Atoll deletion via admin API is not yet implemented"
  };
});

export default component$(() => {
  const atolls = useAtolls();
  const createAction = useCreateAtoll();
  const updateAction = useUpdateAtoll();
  const deleteAction = useDeleteAtoll();

  const showCreateModal = useSignal(false);
  const showEditModal = useSignal(false);
  const showDeleteModal = useSignal(false);
  const selectedAtoll = useSignal<Atoll | null>(null);

  return (
    <div>
      {/* Header */}
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Atolls Management</h1>
          <p class="text-base-content/70 mt-1">
            Manage administrative atolls in the Maldives
          </p>
        </div>
        <button
          class="btn btn-primary"
          onClick$={() => showCreateModal.value = true}
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add New Atoll
        </button>
      </div>

      {/* Info Alert */}
      <div class="alert alert-info mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h3 class="font-bold">Administrative Atolls</h3>
          <div class="text-sm">
            Atolls are the top-level geographic divisions in the Maldives. Each atoll contains multiple islands.
            The code should be the official administrative code (e.g., 'MLE' for Male Atoll, 'BAA' for Baa Atoll).
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {createAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{createAction.value.message}</span>
        </div>
      )}
      {createAction.value?.success === false && (
        <div class="alert alert-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{createAction.value.message}</span>
        </div>
      )}

      {/* Atolls Table */}
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Islands</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {atolls.value.length === 0 ? (
                  <tr>
                    <td colSpan={6} class="text-center py-8 text-base-content/70">
                      <div class="flex flex-col items-center gap-2">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                        </svg>
                        <p class="text-lg">No atolls found</p>
                        <p class="text-sm">Click "Add New Atoll" to create one</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  atolls.value.map((atoll) => (
                    <tr key={atoll.id}>
                      <td>{atoll.id}</td>
                      <td>
                        <div class="badge badge-outline font-mono">{atoll.code}</div>
                      </td>
                      <td class="font-semibold">{atoll.name}</td>
                      <td>
                        {atoll.is_active ? (
                          <div class="badge badge-success">Active</div>
                        ) : (
                          <div class="badge badge-error">Inactive</div>
                        )}
                      </td>
                      <td>
                        <div class="text-sm text-base-content/70">
                          - islands
                        </div>
                      </td>
                      <td class="text-right">
                        <div class="flex gap-2 justify-end">
                          <button
                            class="btn btn-ghost btn-sm"
                            onClick$={() => {
                              selectedAtoll.value = atoll;
                              showEditModal.value = true;
                            }}
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Edit
                          </button>
                          <button
                            class="btn btn-ghost btn-sm text-error"
                            onClick$={() => {
                              selectedAtoll.value = atoll;
                              showDeleteModal.value = true;
                            }}
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
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
      </div>

      {/* Create Modal */}
      {showCreateModal.value && (
        <dialog class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Add New Atoll</h3>
            <Form action={createAction} onSubmitCompleted$={() => showCreateModal.value = false}>
              <div class="space-y-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Atoll Code *</span>
                    <span class="label-text-alt">e.g., MLE, BAA, ADU</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    class="input input-bordered"
                    placeholder="MLE"
                    required
                    maxLength={10}
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Atoll Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    class="input input-bordered"
                    placeholder="Male Atoll"
                    required
                    maxLength={100}
                  />
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text">Active</span>
                    <input type="checkbox" name="is_active" class="toggle toggle-primary" checked />
                  </label>
                </div>
              </div>
              <div class="modal-action">
                <button
                  type="button"
                  class="btn"
                  onClick$={() => showCreateModal.value = false}
                >
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Create Atoll
                </button>
              </div>
            </Form>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button onClick$={() => showCreateModal.value = false}>close</button>
          </form>
        </dialog>
      )}

      {/* Edit Modal */}
      {showEditModal.value && selectedAtoll.value && (
        <dialog class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">Edit Atoll</h3>
            <Form action={updateAction} onSubmitCompleted$={() => showEditModal.value = false}>
              <input type="hidden" name="id" value={selectedAtoll.value.id} />
              <div class="space-y-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Atoll Code *</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    class="input input-bordered"
                    value={selectedAtoll.value.code}
                    required
                    maxLength={10}
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Atoll Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    class="input input-bordered"
                    value={selectedAtoll.value.name}
                    required
                    maxLength={100}
                  />
                </div>
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text">Active</span>
                    <input
                      type="checkbox"
                      name="is_active"
                      class="toggle toggle-primary"
                      checked={selectedAtoll.value.is_active}
                    />
                  </label>
                </div>
              </div>
              <div class="modal-action">
                <button
                  type="button"
                  class="btn"
                  onClick$={() => showEditModal.value = false}
                >
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Update Atoll
                </button>
              </div>
            </Form>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button onClick$={() => showEditModal.value = false}>close</button>
          </form>
        </dialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.value && selectedAtoll.value && (
        <dialog class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg text-error mb-4">Delete Atoll</h3>
            <p class="py-4">
              Are you sure you want to delete <strong>{selectedAtoll.value.name}</strong>?
            </p>
            <div class="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                This atoll may have islands associated with it. Deleting may affect related data.
              </span>
            </div>
            <Form action={deleteAction} onSubmitCompleted$={() => showDeleteModal.value = false}>
              <input type="hidden" name="id" value={selectedAtoll.value.id} />
              <div class="modal-action">
                <button
                  type="button"
                  class="btn"
                  onClick$={() => showDeleteModal.value = false}
                >
                  Cancel
                </button>
                <button type="submit" class="btn btn-error">
                  Delete
                </button>
              </div>
            </Form>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button onClick$={() => showDeleteModal.value = false}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Atolls Management • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage administrative atolls in the Maldives",
    },
  ],
};
