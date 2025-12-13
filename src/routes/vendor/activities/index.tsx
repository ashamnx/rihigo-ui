import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { Activity } from "~/types/activity";

export const useVendorActivities = routeLoader$(async (requestEvent) => {
    const response = await authenticatedRequest(requestEvent, async (token) => {
        return await apiClient.vendorPortal.getActivities(token, { page: 1, page_size: 100 });
    });

    if (!response.success) {
        return {
            success: false,
            error: response.error_message || 'Failed to load activities',
            activities: [] as Activity[]
        };
    }

    return {
        success: true,
        error: null,
        activities: (response.data?.activities || response.data || []) as Activity[]
    };
});

export const useToggleStatus = routeAction$(async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        const activityId = data.id as string;
        const currentStatus = data.status as string;
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';

        const response = await apiClient.vendorPortal.updateActivity(activityId, {
            status: newStatus
        }, token);

        return {
            success: response.success,
            message: response.success
                ? `Activity ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`
                : response.error_message || "Failed to update activity status"
        };
    });
});

export const useDeleteActivity = routeAction$(async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        const activityId = data.id as string;
        const response = await apiClient.vendorPortal.deleteActivity(activityId, token);

        return {
            success: response.success,
            message: response.success
                ? "Activity deleted successfully"
                : response.error_message || "Failed to delete activity"
        };
    });
});

export default component$(() => {
    const activitiesData = useVendorActivities();
    const toggleStatus = useToggleStatus();
    const deleteActivity = useDeleteActivity();
    const showConfirmation = useSignal(false);
    const activityToDelete = useSignal<string | null>(null);
    const filterStatus = useSignal<string>("all");
    const searchTerm = useSignal<string>("");

    if (!activitiesData.value.success) {
        return (
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h1 class="text-2xl font-bold">My Activities</h1>
                        <p class="text-sm text-base-content/70 mt-1">
                            Manage your activities and experiences
                        </p>
                    </div>
                </div>

                <div class="card bg-base-100 shadow-md">
                    <div class="card-body text-center py-12">
                        <div class="text-6xl mb-4">⚠️</div>
                        <h3 class="text-lg font-semibold mb-2">Failed to load activities</h3>
                        <p class="text-base-content/70">
                            {activitiesData.value.error || "Unable to connect to the server."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const activities = activitiesData.value.activities;

    const filteredActivities = activities.filter((activity: Activity) => {
        const matchesStatus = filterStatus.value === "all" || activity.status === filterStatus.value;
        const title = activity.translations?.en?.title || activity.seo_metadata?.title || activity.slug;
        const matchesSearch = searchTerm.value === "" ||
            title.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            activity.slug.toLowerCase().includes(searchTerm.value.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    const statusCounts = {
        all: activities.length,
        draft: activities.filter((a: Activity) => a.status === 'draft').length,
        published: activities.filter((a: Activity) => a.status === 'published').length,
        archived: activities.filter((a: Activity) => a.status === 'archived').length,
    };

    return (
        <div class="space-y-6">
            {/* Page Header */}
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 class="text-2xl font-bold">My Activities</h1>
                    <p class="text-sm text-base-content/70 mt-1">
                        Manage your activities and experiences
                    </p>
                </div>
                <div class="mt-4 sm:mt-0">
                    <Link href="/vendor/activities/new" class="btn btn-primary">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Activity
                    </Link>
                </div>
            </div>

            {/* Status Messages */}
            {toggleStatus.value?.message && (
                <div class={`alert ${toggleStatus.value.success ? 'alert-success' : 'alert-error'}`}>
                    <span>{toggleStatus.value.message}</span>
                </div>
            )}
            {deleteActivity.value?.message && (
                <div class={`alert ${deleteActivity.value.success ? 'alert-success' : 'alert-error'}`}>
                    <span>{deleteActivity.value.message}</span>
                </div>
            )}

            {/* Stats */}
            <div class="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
                <div class="stat cursor-pointer hover:bg-base-200" onClick$={() => filterStatus.value = 'all'}>
                    <div class="stat-title">Total</div>
                    <div class="stat-value text-primary">{statusCounts.all}</div>
                </div>
                <div class="stat cursor-pointer hover:bg-base-200" onClick$={() => filterStatus.value = 'published'}>
                    <div class="stat-title">Published</div>
                    <div class="stat-value text-success">{statusCounts.published}</div>
                </div>
                <div class="stat cursor-pointer hover:bg-base-200" onClick$={() => filterStatus.value = 'draft'}>
                    <div class="stat-title">Drafts</div>
                    <div class="stat-value text-warning">{statusCounts.draft}</div>
                </div>
                <div class="stat cursor-pointer hover:bg-base-200" onClick$={() => filterStatus.value = 'archived'}>
                    <div class="stat-title">Archived</div>
                    <div class="stat-value text-base-content/50">{statusCounts.archived}</div>
                </div>
            </div>

            {/* Filters */}
            <div class="card bg-base-100 shadow-md">
                <div class="card-body py-4">
                    <div class="flex flex-col sm:flex-row gap-4">
                        <div class="form-control flex-1">
                            <input
                                type="text"
                                placeholder="Search activities..."
                                class="input input-bordered"
                                value={searchTerm.value}
                                onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
                            />
                        </div>
                        <div class="form-control">
                            <select
                                class="select select-bordered"
                                value={filterStatus.value}
                                onChange$={(e) => filterStatus.value = (e.target as HTMLSelectElement).value}
                            >
                                <option value="all">{`All Status (${statusCounts.all})`}</option>
                                <option value="published">{`Published (${statusCounts.published})`}</option>
                                <option value="draft">{`Draft (${statusCounts.draft})`}</option>
                                <option value="archived">{`Archived (${statusCounts.archived})`}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activities Grid */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.length === 0 ? (
                    <div class="col-span-full text-center py-12">
                        <div class="text-6xl mb-4">🏝️</div>
                        <h3 class="text-lg font-semibold mb-2">No activities found</h3>
                        <p class="text-base-content/70 mb-4">
                            {searchTerm.value || filterStatus.value !== "all"
                                ? "Try adjusting your search or filters."
                                : "Get started by creating your first activity."}
                        </p>
                        {!searchTerm.value && filterStatus.value === "all" && (
                            <Link href="/vendor/activities/new" class="btn btn-primary">
                                Create Activity
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredActivities.map((activity: Activity) => {
                        const title = activity.translations?.en?.title || activity.seo_metadata?.title || activity.slug;
                        const description = activity.translations?.en?.description || activity.seo_metadata?.description || '';

                        return (
                            <div key={activity.id} class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                                <div class="card-body">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class={`badge ${activity.status === 'published' ? 'badge-success' : activity.status === 'draft' ? 'badge-warning' : 'badge-ghost'}`}>
                                            {activity.status}
                                        </div>
                                        <div class="dropdown dropdown-end">
                                            <div tabIndex={0} role="button" class="btn btn-ghost btn-sm">
                                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </div>
                                            <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                                <li>
                                                    <Link href={`/vendor/activities/${activity.id}`}>
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href={`/vendor/activities/${activity.id}/packages`}>
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                        Packages
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Form action={toggleStatus}>
                                                        <input type="hidden" name="id" value={activity.id} />
                                                        <input type="hidden" name="status" value={activity.status} />
                                                        <button type="submit" class="w-full text-left">
                                                            {activity.status === 'published' ? 'Unpublish' : 'Publish'}
                                                        </button>
                                                    </Form>
                                                </li>
                                                <div class="divider my-1"></div>
                                                <li>
                                                    <button
                                                        type="button"
                                                        class="text-error"
                                                        onClick$={() => {
                                                            activityToDelete.value = activity.id;
                                                            showConfirmation.value = true;
                                                        }}
                                                    >
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <h2 class="card-title text-lg">
                                        {title}
                                    </h2>

                                    {description && (
                                        <p class="text-sm text-base-content/70 line-clamp-2">
                                            {description}
                                        </p>
                                    )}

                                    <div class="text-sm text-base-content/70 space-y-1 mt-2">
                                        {activity.island && (
                                            <div class="flex items-center gap-1">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {activity.island.name}
                                            </div>
                                        )}
                                        <div class="flex items-center gap-1">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            {activity.slug}
                                        </div>
                                        {activity.review_count > 0 && (
                                            <div class="flex items-center gap-1">
                                                <span>⭐</span> {activity.review_score.toFixed(1)} ({activity.review_count} reviews)
                                            </div>
                                        )}
                                    </div>

                                    <div class="flex justify-between items-center mt-4 pt-4 border-t border-base-200">
                                        <div>
                                            {activity.min_price_usd > 0 && (
                                                <div class="text-lg font-bold text-primary">
                                                    From ${activity.min_price_usd.toFixed(2)}
                                                </div>
                                            )}
                                            <div class="text-xs text-base-content/70">
                                                {activity.packages?.length || 0} packages
                                            </div>
                                        </div>
                                        {activity.category && (
                                            <div class="badge badge-outline">
                                                {activity.category.icon} {activity.category.name}
                                            </div>
                                        )}
                                    </div>

                                    <div class="card-actions justify-end mt-4">
                                        <Link
                                            href={`/vendor/activities/${activity.id}/packages`}
                                            class="btn btn-sm btn-outline"
                                        >
                                            Packages
                                        </Link>
                                        <Link
                                            href={`/vendor/activities/${activity.id}`}
                                            class="btn btn-sm btn-primary"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showConfirmation.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg">Delete Activity</h3>
                        <p class="py-4">
                            Are you sure you want to delete this activity? This will also delete all associated packages. This action cannot be undone.
                        </p>
                        <div class="modal-action">
                            <Form action={deleteActivity}>
                                <input type="hidden" name="id" value={activityToDelete.value || ''} />
                                <button
                                    type="submit"
                                    class="btn btn-error"
                                    onClick$={() => {
                                        showConfirmation.value = false;
                                    }}
                                >
                                    Delete
                                </button>
                            </Form>
                            <button
                                type="button"
                                class="btn"
                                onClick$={() => {
                                    showConfirmation.value = false;
                                    activityToDelete.value = null;
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    <div class="modal-backdrop" onClick$={() => {
                        showConfirmation.value = false;
                        activityToDelete.value = null;
                    }}></div>
                </div>
            )}
        </div>
    );
});

export const head: DocumentHead = {
    title: "My Activities • Vendor Portal • Rihigo",
    meta: [
        {
            name: "description",
            content: "Manage your activities and experiences",
        },
    ],
};
