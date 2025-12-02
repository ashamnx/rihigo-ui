import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { Activity } from "~/types/activity";
import { ErrorState } from "~/components/error-state/error-state";

export const useActivities = routeLoader$(async (requestEvent) => {
  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.activities.listAdmin(1, 100, token);
  });

  if (!response.success) {
    console.error('Failed to load activities:', response.error_message);
    return {
      success: false,
      error: response.error_message || 'Failed to load activities',
      activities: [] as Activity[]
    };
  }

  return {
    success: true,
    error: null,
    activities: (response.data || []) as Activity[]
  };
});

export const useDeleteActivity = routeAction$(async (_data, requestEvent) => {
  return authenticatedRequest(requestEvent, async () => {
    try {
      return {
        success: false,
        message: "Delete functionality requires admin API endpoint"
      };
    } catch {
      return {
        success: false,
        message: "Failed to delete activity"
      };
    }
  });
});

export const useToggleStatus = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const activityId = data.id as string;
      const currentStatus = data.status as string;
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';

      const response = await apiClient.activities.update(activityId, {
        status: newStatus
      }, token);

      return {
        success: response.success,
        message: response.success
          ? `Activity ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`
          : response.error_message || "Failed to update activity status"
      };
    } catch {
      return {
        success: false,
        message: "Failed to update activity status"
      };
    }
  });
});

export default component$(() => {
  const activitiesData = useActivities();
  const deleteActivity = useDeleteActivity();
  const toggleStatus = useToggleStatus();
  const showConfirmation = useSignal(false);
  const activityToDelete = useSignal<string | null>(null);
  const filterCategory = useSignal<string>("all");
  const filterStatus = useSignal<string>("all");
  const searchTerm = useSignal<string>("");
  const viewMode = useSignal<'grid' | 'table'>('table');

  if (!activitiesData.value.success) {
    return (
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold">Activities</h1>
            <p class="text-base-content/60 mt-1">Manage tourist activities and experiences</p>
          </div>
        </div>
        <div class="bg-base-200 rounded-xl p-6">
          <ErrorState
            title="Failed to load activities"
            message={activitiesData.value.error || "Unable to connect to the server."}
          />
        </div>
      </div>
    );
  }

  const activities = activitiesData.value.activities;

  const filteredActivities = activities.filter((activity: Activity) => {
    const matchesCategory = filterCategory.value === "all" || activity.category_id?.toString() === filterCategory.value;
    const matchesStatus = filterStatus.value === "all" || activity.status === filterStatus.value;
    const title = activity.translations?.en?.title || activity.seo_metadata.title || activity.slug;
    const islandName = activity.island?.name || '';

    const matchesSearch = searchTerm.value === "" ||
      title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      activity.slug.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      islandName.toLowerCase().includes(searchTerm.value.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const categoryIds = [...new Set(activities.map((a: Activity) => a.category_id).filter(Boolean))];

  // Stats
  const publishedCount = activities.filter((a: Activity) => a.status === 'published').length;
  const draftCount = activities.filter((a: Activity) => a.status === 'draft').length;

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold">Activities</h1>
          <p class="text-base-content/60 mt-1">
            {activities.length} total &middot; {publishedCount} published &middot; {draftCount} draft
          </p>
        </div>
        <Link href="/admin/activities/new" class="btn btn-primary btn-sm gap-2">
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Activity
        </Link>
      </div>

      {/* Filters */}
      <div class="bg-base-200 rounded-xl p-4">
        <div class="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div class="flex-1">
            <div class="relative">
              <svg class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search activities..."
                class="input input-sm input-bordered w-full pl-9"
                value={searchTerm.value}
                onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
              />
            </div>
          </div>

          {/* Category filter */}
          <select
            class="select select-sm select-bordered"
            value={filterCategory.value}
            onChange$={(e) => filterCategory.value = (e.target as HTMLSelectElement).value}
          >
            <option value="all">All Categories</option>
            {categoryIds.map((catId) => {
              const activity = activities.find(a => a.category_id === catId);
              const categoryName = activity?.category?.name || `Category ${catId}`;
              return (
                <option key={catId} value={catId?.toString()}>
                  {categoryName}
                </option>
              );
            })}
          </select>

          {/* Status filter */}
          <select
            class="select select-sm select-bordered"
            value={filterStatus.value}
            onChange$={(e) => filterStatus.value = (e.target as HTMLSelectElement).value}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* View toggle */}
          <div class="join">
            <button
              class={`join-item btn btn-sm ${viewMode.value === 'table' ? 'btn-active' : ''}`}
              onClick$={() => viewMode.value = 'table'}
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
              </svg>
            </button>
            <button
              class={`join-item btn btn-sm ${viewMode.value === 'grid' ? 'btn-active' : ''}`}
              onClick$={() => viewMode.value = 'grid'}
            >
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filteredActivities.length === 0 ? (
        <div class="bg-base-200 rounded-xl p-12 text-center">
          <div class="size-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
            <svg class="size-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">No activities found</h3>
          <p class="text-base-content/60 mb-4">
            {searchTerm.value || filterCategory.value !== "all" || filterStatus.value !== "all"
              ? "Try adjusting your filters."
              : "Get started by creating your first activity."}
          </p>
          {!searchTerm.value && filterCategory.value === "all" && filterStatus.value === "all" && (
            <Link href="/admin/activities/new" class="btn btn-primary btn-sm">
              Create Activity
            </Link>
          )}
        </div>
      ) : viewMode.value === 'table' ? (
        /* Table View */
        <div class="bg-base-200 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="border-base-300">
                  <th>Activity</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity: Activity) => {
                  const title = activity.translations?.en?.title || activity.seo_metadata.title || activity.slug;

                  return (
                    <tr key={activity.id} class="hover border-base-300">
                      <td>
                        <div class="flex items-center gap-3">
                          <div>
                            <div class="font-medium">{title}</div>
                            <div class="text-xs text-base-content/50">{activity.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {activity.island ? (
                          <div class="text-sm">
                            <div>{activity.island.name}</div>
                            {activity.island.atoll && (
                              <div class="text-xs text-base-content/50">{activity.island.atoll.name}</div>
                            )}
                          </div>
                        ) : (
                          <span class="text-base-content/40">-</span>
                        )}
                      </td>
                      <td>
                        {activity.category ? (
                          <span class="badge badge-sm badge-ghost">
                            {activity.category.icon} {activity.category.name}
                          </span>
                        ) : (
                          <span class="text-base-content/40">-</span>
                        )}
                      </td>
                      <td>
                        {activity.min_price_usd > 0 ? (
                          <span class="font-medium">${activity.min_price_usd.toFixed(0)}</span>
                        ) : (
                          <span class="text-base-content/40">-</span>
                        )}
                      </td>
                      <td>
                        <span class={`badge badge-sm ${
                          activity.status === 'published' ? 'badge-success' :
                          activity.status === 'draft' ? 'badge-warning' : 'badge-ghost'
                        }`}>
                          {activity.status}
                        </span>
                      </td>
                      <td>
                        <div class="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/activities/${activity.id}/builder`}
                            class="btn btn-ghost btn-xs"
                            title="Page Builder"
                          >
                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/admin/activities/${activity.id}`}
                            class="btn btn-ghost btn-xs"
                            title="Edit"
                          >
                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </Link>
                          <div class="dropdown dropdown-end">
                            <div tabIndex={0} role="button" class="btn btn-ghost btn-xs">
                              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                              </svg>
                            </div>
                            <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-lg w-40">
                              <li>
                                <Form action={toggleStatus}>
                                  <input type="hidden" name="id" value={activity.id} />
                                  <input type="hidden" name="status" value={activity.status} />
                                  <button type="submit" class="w-full text-left">
                                    {activity.status === 'published' ? 'Unpublish' : 'Publish'}
                                  </button>
                                </Form>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  class="text-error"
                                  onClick$={() => {
                                    activityToDelete.value = activity.id;
                                    showConfirmation.value = true;
                                  }}
                                >
                                  Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredActivities.map((activity: Activity) => {
            const title = activity.translations?.en?.title || activity.seo_metadata.title || activity.slug;
            const description = activity.translations?.en?.description || activity.seo_metadata.description || '';

            return (
              <div key={activity.id} class="bg-base-200 rounded-xl p-4 hover:bg-base-300/50 transition-colors">
                <div class="flex justify-between items-start mb-3">
                  <span class={`badge badge-sm ${
                    activity.status === 'published' ? 'badge-success' :
                    activity.status === 'draft' ? 'badge-warning' : 'badge-ghost'
                  }`}>
                    {activity.status}
                  </span>
                  <div class="dropdown dropdown-end">
                    <div tabIndex={0} role="button" class="btn btn-ghost btn-xs btn-circle">
                      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                      </svg>
                    </div>
                    <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-lg w-40">
                      <li>
                        <Form action={toggleStatus}>
                          <input type="hidden" name="id" value={activity.id} />
                          <input type="hidden" name="status" value={activity.status} />
                          <button type="submit" class="w-full text-left">
                            {activity.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                        </Form>
                      </li>
                      <li>
                        <button
                          type="button"
                          class="text-error"
                          onClick$={() => {
                            activityToDelete.value = activity.id;
                            showConfirmation.value = true;
                          }}
                        >
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 class="font-medium mb-1 line-clamp-1">{title}</h3>
                {description && (
                  <p class="text-sm text-base-content/60 line-clamp-2 mb-3">{description}</p>
                )}

                <div class="flex items-center gap-2 text-sm text-base-content/60 mb-3">
                  {activity.island && (
                    <span class="flex items-center gap-1">
                      <svg class="size-3" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {activity.island.name}
                    </span>
                  )}
                  {activity.category && (
                    <span class="badge badge-sm badge-ghost">
                      {activity.category.icon} {activity.category.name}
                    </span>
                  )}
                </div>

                <div class="flex items-center justify-between">
                  {activity.min_price_usd > 0 ? (
                    <span class="font-semibold text-primary">From ${activity.min_price_usd.toFixed(0)}</span>
                  ) : (
                    <span></span>
                  )}
                  <div class="flex gap-1">
                    <Link
                      href={`/admin/activities/${activity.id}/builder`}
                      class="btn btn-ghost btn-xs"
                    >
                      Builder
                    </Link>
                    <Link
                      href={`/admin/activities/${activity.id}`}
                      class="btn btn-primary btn-xs"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmation.value && (
        <div class="modal modal-open">
          <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg">Delete Activity</h3>
            <p class="py-4 text-base-content/70">
              Are you sure? This will delete all associated packages, translations, and images.
            </p>
            <div class="modal-action">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onClick$={() => {
                  showConfirmation.value = false;
                  activityToDelete.value = null;
                }}
              >
                Cancel
              </button>
              <Form action={deleteActivity}>
                <input type="hidden" name="id" value={activityToDelete.value || ''} />
                <button
                  type="submit"
                  class="btn btn-error btn-sm"
                  onClick$={() => showConfirmation.value = false}
                >
                  Delete
                </button>
              </Form>
            </div>
          </div>
          <div class="modal-backdrop bg-base-300/50" onClick$={() => {
            showConfirmation.value = false;
            activityToDelete.value = null;
          }}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Activities | Admin | Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage tourist activities and experiences",
    },
  ],
};
