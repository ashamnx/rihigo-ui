import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import { getAtolls, getIslands } from "~/services/activity-api";

export const useActivity = routeLoader$(async (requestEvent) => {
    const activityId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        const response = await apiClient.vendorPortal.getActivityById(activityId, token);

        if (!response.success || !response.data) {
            return { success: false, error: 'Activity not found', data: null };
        }

        return { success: true, data: response.data };
    });
});

export const useAtolls = routeLoader$(async () => {
    try {
        return await getAtolls();
    } catch (error) {
        console.error('Failed to load atolls:', error);
        return [];
    }
});

export const useIslands = routeLoader$(async () => {
    try {
        return await getIslands();
    } catch (error) {
        console.error('Failed to load islands:', error);
        return [];
    }
});

export const useCategories = routeLoader$(async () => {
    try {
        const response = await apiClient.categories.list();
        return response.success ? (response.data || []) : [];
    } catch (error) {
        console.error('Failed to load categories:', error);
        return [];
    }
});

export const useUpdateActivity = routeAction$(async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const activityId = data.id as string;
            const updateInput = {
                slug: data.slug ? (data.slug as string).toLowerCase().replace(/\s+/g, '-') : undefined,
                category_id: data.category_id ? parseInt(data.category_id as string) : undefined,
                island_id: data.island_id ? parseInt(data.island_id as string) : undefined,
                status: data.status as 'draft' | 'published' | 'archived' | undefined,
                seo_metadata: {
                    title: data.seo_title as string,
                    description: data.seo_description as string,
                    keywords: data.seo_keywords ? (data.seo_keywords as string).split(',').map(k => k.trim()) : [],
                    og_image: data.og_image as string || undefined
                }
            };

            const response = await apiClient.vendorPortal.updateActivity(activityId, updateInput, token);

            if (response.success) {
                return {
                    success: true,
                    message: "Activity updated successfully"
                };
            }

            return {
                success: false,
                message: response.error_message || "Failed to update activity"
            };
        } catch (error) {
            console.error("Error updating activity:", error);
            return {
                success: false,
                message: "An error occurred while updating the activity"
            };
        }
    });
});

export default component$(() => {
    const activityData = useActivity();
    const atolls = useAtolls();
    const islands = useIslands();
    const categories = useCategories();
    const updateActivityAction = useUpdateActivity();
    const selectedAtoll = useSignal<number | undefined>();

    if (!activityData.value.success || !activityData.value.data) {
        return (
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🏝️</div>
                <h1 class="text-2xl font-bold mb-4">Activity Not Found</h1>
                <p class="text-base-content/70 mb-6">The activity you are looking for does not exist or you don't have access to it.</p>
                <Link href="/vendor/activities" class="btn btn-primary">Back to Activities</Link>
            </div>
        );
    }

    const activity = activityData.value.data;

    const filteredIslands = selectedAtoll.value
        ? islands.value.filter(i => i.atoll_id === selectedAtoll.value)
        : islands.value;

    const title = activity.translations?.en?.title || activity.seo_metadata?.title || activity.slug;
    const packageCount = activity.packages?.length || 0;

    return (
        <div class="max-w-4xl mx-auto">
            {/* Header */}
            <div class="mb-8">
                <div class="breadcrumbs text-sm mb-3">
                    <ul>
                        <li>
                            <Link href="/vendor/activities" class="link link-hover">
                                Activities
                            </Link>
                        </li>
                        <li class="text-base-content/70">{title}</li>
                    </ul>
                </div>

                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-3xl font-bold mb-2">Edit Activity</h1>
                        <div class="flex items-center gap-4 mt-2">
                            <div class={`badge ${activity.status === 'published' ? 'badge-success' : activity.status === 'draft' ? 'badge-warning' : 'badge-error'}`}>
                                {activity.status}
                            </div>
                            <div class="text-sm text-base-content/70">
                                {packageCount} package{packageCount !== 1 ? 's' : ''}
                            </div>
                            {activity.review_count > 0 && (
                                <div class="text-sm text-base-content/70">
                                    <span>⭐</span> {activity.review_score.toFixed(1)} ({activity.review_count} reviews)
                                </div>
                            )}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <Link
                            href={`/vendor/activities/${activity.id}/packages`}
                            class="btn btn-outline btn-sm"
                        >
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Packages ({packageCount})
                        </Link>
                        <Link href="/vendor/activities" class="btn btn-outline btn-sm">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </Link>
                    </div>
                </div>
            </div>

            {/* Success message */}
            {updateActivityAction.value?.success && (
                <div class="alert alert-success mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{updateActivityAction.value.message}</span>
                </div>
            )}

            {/* Error message */}
            {updateActivityAction.value?.success === false && (
                <div class="alert alert-error mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{updateActivityAction.value.message}</span>
                </div>
            )}

            <Form action={updateActivityAction} class="space-y-6">
                <input type="hidden" value={activity.id} name="id" />

                {/* Basic Information */}
                <div class="card bg-base-100 shadow-xl border border-base-200">
                    <div class="card-body">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold">Basic Information</h2>
                                <p class="text-sm text-base-content/70">Core details about the activity</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="form-control md:col-span-2">
                                <label class="label">
                                    <span class="label-text font-medium">Activity Slug <span class="text-error">*</span></span>
                                    <span class="label-text-alt">Used in URL</span>
                                </label>
                                <input
                                    type="text"
                                    name="slug"
                                    class="input input-bordered"
                                    value={activity.slug}
                                    required
                                    pattern="[a-z0-9-]+"
                                    title="Only lowercase letters, numbers, and hyphens"
                                />
                                <label class="label">
                                    <span class="label-text-alt text-warning">
                                        Current URL: /en/activities/{activity.slug}
                                    </span>
                                </label>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Category</span>
                                </label>
                                <select name="category_id" class="select select-bordered" value={activity.category_id || ''}>
                                    <option value="">Select Category</option>
                                    {categories.value.map((category: any) => (
                                        <option key={category.id} value={category.id}>
                                            {`${category.icon} ${category.name}`}
                                        </option>
                                    ))}
                                </select>
                                {activity.category && (
                                    <label class="label">
                                        <span class="label-text-alt">
                                            {`Current: ${activity.category.icon} ${activity.category.name}`}
                                        </span>
                                    </label>
                                )}
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Status <span class="text-error">*</span></span>
                                </label>
                                <select name="status" class="select select-bordered" value={activity.status} required>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Atoll</span>
                                </label>
                                <select
                                    class="select select-bordered"
                                    value={activity.island?.atoll_id || ''}
                                    onChange$={(e) => {
                                        const value = (e.target as HTMLSelectElement).value;
                                        selectedAtoll.value = value ? parseInt(value) : undefined;
                                    }}
                                >
                                    <option value="">Select Atoll (optional)</option>
                                    {atolls.value.map((atoll) => (
                                        <option key={atoll.id} value={atoll.id}>
                                            {atoll.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Island</span>
                                </label>
                                <select name="island_id" class="select select-bordered" value={activity.island_id || ''}>
                                    <option value="">Select Island (optional)</option>
                                    {filteredIslands.map((island) => (
                                        <option key={island.id} value={island.id}>
                                            {`${island.name} (${island.type})`}
                                        </option>
                                    ))}
                                </select>
                                {activity.island && (
                                    <label class="label">
                                        <span class="label-text-alt">
                                            Current: {activity.island.name} ({activity.island.type})
                                        </span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEO Metadata */}
                <div class="card bg-base-100 shadow-xl border border-base-200">
                    <div class="card-body">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold">SEO & Preview</h2>
                                <p class="text-sm text-base-content/70">Search engine and social media optimization</p>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">SEO Title <span class="text-error">*</span></span>
                                    <span class="label-text-alt">50-60 characters recommended</span>
                                </label>
                                <input
                                    type="text"
                                    name="seo_title"
                                    class="input input-bordered"
                                    value={activity.seo_metadata?.title || ''}
                                    required
                                    maxLength={60}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">SEO Description <span class="text-error">*</span></span>
                                    <span class="label-text-alt">150-160 characters recommended</span>
                                </label>
                                <textarea
                                    name="seo_description"
                                    class="textarea textarea-bordered h-24"
                                    required
                                    maxLength={160}
                                >{activity.seo_metadata?.description || ''}</textarea>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Keywords</span>
                                    <span class="label-text-alt">Comma-separated</span>
                                </label>
                                <input
                                    type="text"
                                    name="seo_keywords"
                                    class="input input-bordered"
                                    value={activity.seo_metadata?.keywords?.join(', ') || ''}
                                />
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text font-medium">Open Graph Image URL</span>
                                    <span class="label-text-alt">For social media sharing</span>
                                </label>
                                <input
                                    type="url"
                                    name="og_image"
                                    class="input input-bordered"
                                    value={activity.seo_metadata?.og_image || ''}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Stats */}
                <div class="card bg-base-100 shadow-xl border border-base-200">
                    <div class="card-body">
                        <h2 class="card-title mb-4">Activity Statistics</h2>
                        <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
                            <div class="stat">
                                <div class="stat-title">Reviews</div>
                                <div class="stat-value text-primary">{activity.review_count}</div>
                                <div class="stat-desc">Average: {activity.review_score?.toFixed(1) || '0.0'} <span>⭐</span></div>
                            </div>
                            <div class="stat">
                                <div class="stat-title">Packages</div>
                                <div class="stat-value text-secondary">{packageCount}</div>
                                <div class="stat-desc">
                                    <Link href={`/vendor/activities/${activity.id}/packages`} class="link link-primary">
                                        Manage packages
                                    </Link>
                                </div>
                            </div>
                            <div class="stat">
                                <div class="stat-title">Min Price</div>
                                <div class="stat-value text-accent">${activity.min_price_usd?.toFixed(2) || '0.00'}</div>
                                <div class="stat-desc">Starting from (USD)</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div class="card bg-base-100 shadow-xl border border-base-200">
                    <div class="card-body">
                        <h2 class="card-title mb-4">Quick Actions</h2>
                        <div class="flex flex-wrap gap-3">
                            <Link
                                href={`/vendor/activities/${activity.id}/packages`}
                                class="btn btn-outline"
                            >
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Manage Packages
                            </Link>
                            <Link
                                href={`/en-US/activities/${activity.slug}`}
                                target="_blank"
                                class="btn btn-outline"
                            >
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View on Site
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Submit Actions */}
                <div class="sticky bottom-0 z-10 bg-base-100 border-t border-base-200 -mx-6 px-6 py-4 sm:rounded-lg sm:shadow-lg sm:border sm:mx-0">
                    <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div class="text-sm text-base-content/70 hidden sm:block">
                            <span class="text-error">*</span> Required fields
                        </div>
                        <div class="flex gap-3 w-full sm:w-auto">
                            <Link href="/vendor/activities" class="btn btn-ghost flex-1 sm:flex-none">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                class="btn btn-primary flex-1 sm:flex-none"
                                disabled={updateActivityAction.isRunning}
                            >
                                {updateActivityAction.isRunning ? (
                                    <>
                                        <span class="loading loading-spinner loading-sm"></span>
                                        Saving...
                                    </>
                                ) : (
                                    'Update Activity'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Form>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Edit Activity • Vendor Portal • Rihigo",
    meta: [
        {
            name: "description",
            content: "Edit activity details and settings",
        },
    ],
};
