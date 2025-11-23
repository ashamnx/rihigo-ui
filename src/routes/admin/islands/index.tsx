import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { getAtolls, getIslands } from "~/services/activity-api";
import type { Island } from "~/types/activity";

export const useIslands = routeLoader$(async () => {
  try {
    return await getIslands();
  } catch (error) {
    console.error('Failed to load islands:', error);
    return [];
  }
});

export const useAtolls = routeLoader$(async () => {
  try {
    return await getAtolls();
  } catch (error) {
    console.error('Failed to load atolls:', error);
    return [];
  }
});

export const useCreateIsland = routeAction$(async () => {
  // TODO: Implement admin API endpoint for creating islands
  return {
    success: false,
    message: "Island creation via admin API is not yet implemented"
  };
});

export const useUpdateIsland = routeAction$(async () => {
  // TODO: Implement admin API endpoint for updating islands
  return {
    success: false,
    message: "Island update via admin API is not yet implemented"
  };
});

export const useDeleteIsland = routeAction$(async () => {
  // TODO: Implement admin API endpoint for deleting islands
  return {
    success: false,
    message: "Island deletion via admin API is not yet implemented"
  };
});

export default component$(() => {
  const islands = useIslands();
  const atolls = useAtolls();
  const createAction = useCreateIsland();
  const updateAction = useUpdateIsland();
  const deleteAction = useDeleteIsland();

  const showCreateModal = useSignal(false);
  const showEditModal = useSignal(false);
  const showDeleteModal = useSignal(false);
  const selectedIsland = useSignal<Island | null>(null);
  const filterAtoll = useSignal<number | null>(null);
  const filterType = useSignal<string>("all");

  const filteredIslands = islands.value.filter((island) => {
    const matchesAtoll = filterAtoll.value === null || island.atoll_id === filterAtoll.value;
    const matchesType = filterType.value === "all" || island.type === filterType.value;
    return matchesAtoll && matchesType;
  });

  const islandTypes = [
    { value: "resort", label: "Resort", icon: "🏝️" },
    { value: "local", label: "Local", icon: "🏘️" },
    { value: "uninhabited", label: "Uninhabited", icon: "🌴" },
    { value: "airport", label: "Airport", icon: "✈️" },
  ];

  return (
    <div>
      {/* Header */}
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Islands Management</h1>
          <p class="text-base-content/70 mt-1">
            Manage islands in the Maldives
          </p>
        </div>
        <button
          class="btn btn-primary"
          onClick$={() => showCreateModal.value = true}
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add New Island
        </button>
      </div>

      {/* Info Alert */}
      <div class="alert alert-info mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h3 class="font-bold">Island Types</h3>
          <div class="text-sm">
            <strong>Resort:</strong> Privately operated resort islands  •
            <strong>Local:</strong> Inhabited local islands  •
            <strong>Uninhabited:</strong> Empty islands  •
            <strong>Airport:</strong> Islands with airports
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

      {/* Filters */}
      <div class="card bg-base-100 shadow-md mb-6">
        <div class="card-body">
          <div class="flex flex-wrap gap-4">
            <div class="form-control flex-1 min-w-[200px]">
              <label class="label">
                <span class="label-text">Filter by Atoll</span>
              </label>
              <select
                class="select select-bordered"
                value={filterAtoll.value || ""}
                onChange$={(e) => {
                  const value = (e.target as HTMLSelectElement).value;
                  filterAtoll.value = value ? parseInt(value) : null;
                }}
              >
                <option value="">All Atolls</option>
                {atolls.value.map((atoll) => (
                  <option key={atoll.id} value={atoll.id}>
                    {`${atoll.name} (${atoll.code})`}
                  </option>
                ))}
              </select>
            </div>

            <div class="form-control flex-1 min-w-[200px]">
              <label class="label">
                <span class="label-text">Filter by Type</span>
              </label>
              <select
                class="select select-bordered"
                value={filterType.value}
                onChange$={(e) => {
                  filterType.value = (e.target as HTMLSelectElement).value;
                }}
              >
                <option value="all">All Types</option>
                {islandTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {`${type.icon} ${type.label}`}
                  </option>
                ))}
              </select>
            </div>

            <div class="flex items-end">
              <div class="stats shadow">
                <div class="stat py-3 px-4">
                  <div class="stat-title text-xs">Total</div>
                  <div class="stat-value text-2xl">{filteredIslands.length}</div>
                  <div class="stat-desc">island{filteredIslands.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Islands Table */}
      <div class="card bg-base-100 shadow-md">
        <div class="card-body">
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Atoll</th>
                  <th>Type</th>
                  <th>Coordinates</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIslands.length === 0 ? (
                  <tr>
                    <td colSpan={6} class="text-center py-8 text-base-content/70">
                      <div class="flex flex-col items-center gap-2">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p class="text-lg">No islands found</p>
                        <p class="text-sm">
                          {filterAtoll.value || filterType.value !== "all"
                            ? "Try adjusting your filters"
                            : "Click \"Add New Island\" to create one"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIslands.map((island) => {
                    const typeInfo = islandTypes.find(t => t.value === island.type);
                    return (
                      <tr key={island.id}>
                        <td>{island.id}</td>
                        <td class="font-semibold">{island.name}</td>
                        <td>
                          {island.atoll ? (
                            <div class="badge badge-outline">
                              {island.atoll.code} - {island.atoll.name}
                            </div>
                          ) : (
                            <span class="text-base-content/50">No atoll</span>
                          )}
                        </td>
                        <td>
                          <div class="badge badge-primary">
                            {typeInfo?.icon} {typeInfo?.label || island.type}
                          </div>
                        </td>
                        <td>
                          {island.latitude && island.longitude ? (
                            <div class="text-xs font-mono">
                              {island.latitude.toFixed(4)}, {island.longitude.toFixed(4)}
                            </div>
                          ) : (
                            <span class="text-base-content/50 text-xs">Not set</span>
                          )}
                        </td>
                        <td class="text-right">
                          <div class="flex gap-2 justify-end">
                            <button
                              class="btn btn-ghost btn-sm"
                              onClick$={() => {
                                selectedIsland.value = island;
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
                                selectedIsland.value = island;
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">Add New Island</h3>
            <Form action={createAction} onSubmitCompleted$={() => showCreateModal.value = false}>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control md:col-span-2">
                  <label class="label">
                    <span class="label-text">Island Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    class="input input-bordered"
                    placeholder="e.g., Hulhumale, Maafushi"
                    required
                    maxLength={100}
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Atoll *</span>
                  </label>
                  <select name="atoll_id" class="select select-bordered" required>
                    <option value="">Select Atoll</option>
                    {atolls.value.map((atoll) => (
                      <option key={atoll.id} value={atoll.id}>
                        {`${atoll.name} (${atoll.code})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Type *</span>
                  </label>
                  <select name="type" class="select select-bordered" required>
                    <option value="">Select Type</option>
                    {islandTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {`${type.icon} ${type.label}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Latitude</span>
                    <span class="label-text-alt">Optional</span>
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    class="input input-bordered"
                    placeholder="4.1755"
                    step="0.000001"
                    min="-90"
                    max="90"
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Longitude</span>
                    <span class="label-text-alt">Optional</span>
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    class="input input-bordered"
                    placeholder="73.5093"
                    step="0.000001"
                    min="-180"
                    max="180"
                  />
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
                  Create Island
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
      {showEditModal.value && selectedIsland.value && (
        <dialog class="modal modal-open">
          <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">Edit Island</h3>
            <Form action={updateAction} onSubmitCompleted$={() => showEditModal.value = false}>
              <input type="hidden" name="id" value={selectedIsland.value.id} />
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control md:col-span-2">
                  <label class="label">
                    <span class="label-text">Island Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    class="input input-bordered"
                    value={selectedIsland.value.name}
                    required
                    maxLength={100}
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Atoll *</span>
                  </label>
                  <select
                    name="atoll_id"
                    class="select select-bordered"
                    value={selectedIsland.value.atoll_id || ""}
                    required
                  >
                    <option value="">Select Atoll</option>
                    {atolls.value.map((atoll) => (
                      <option key={atoll.id} value={atoll.id}>
                        {`${atoll.name} (${atoll.code})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Type *</span>
                  </label>
                  <select
                    name="type"
                    class="select select-bordered"
                    value={selectedIsland.value.type}
                    required
                  >
                    {islandTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {`${type.icon} ${type.label}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Latitude</span>
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    class="input input-bordered"
                    value={selectedIsland.value.latitude || ""}
                    step="0.000001"
                    min="-90"
                    max="90"
                  />
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Longitude</span>
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    class="input input-bordered"
                    value={selectedIsland.value.longitude || ""}
                    step="0.000001"
                    min="-180"
                    max="180"
                  />
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
                  Update Island
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
      {showDeleteModal.value && selectedIsland.value && (
        <dialog class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg text-error mb-4">Delete Island</h3>
            <p class="py-4">
              Are you sure you want to delete <strong>{selectedIsland.value.name}</strong>?
            </p>
            <div class="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                Activities associated with this island may be affected. Make sure to update or remove them first.
              </span>
            </div>
            <Form action={deleteAction} onSubmitCompleted$={() => showDeleteModal.value = false}>
              <input type="hidden" name="id" value={selectedIsland.value.id} />
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
  title: "Islands Management • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage islands in the Maldives",
    },
  ],
};
