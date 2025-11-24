import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import {getActivityById, getAtolls, getIslands, updateActivity} from "~/services/activity-api";
import type {UpdateActivityInput} from '~/types/activity';

export const useActivity = routeLoader$(async (requestEvent) => {
  const activityId = requestEvent.params.id;

  try {
    const activity = await getActivityById(activityId, 'en');
    return { success: true, data: activity };
  } catch (error) {
    console.error('Failed to load activity:', error);
    return { success: false, error: 'Activity not found' };
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

export const useIslands = routeLoader$(async () => {
  try {
    return await getIslands();
  } catch (error) {
    console.error('Failed to load islands:', error);
    return [];
  }
});

export const useVendors = routeLoader$(async (requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      return await apiClient.vendors.list(1, 100, token);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      return { success: false, data: [], error_message: 'Failed to load vendors' };
    }
  });
});

export const useUpdateActivity = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const activityId = data.id as string;
      const updateInput: UpdateActivityInput = {
        slug: data.slug ? (data.slug as string).toLowerCase().replace(/\s+/g, '-') : undefined,
        category_id: data.category_id ? parseInt(data.category_id as string) : undefined,
        island_id: data.island_id ? parseInt(data.island_id as string) : undefined,
        vendor_id: data.vendor_id ? (data.vendor_id as string) : undefined,
        status: data.status as 'draft' | 'published' | 'archived' | undefined,
        seo_metadata: {
          title: data.seo_title as string,
          description: data.seo_description as string,
          keywords: data.seo_keywords ? (data.seo_keywords as string).split(',').map(k => k.trim()) : [],
          og_image: data.og_image as string || undefined
        }
      };

      const result = await updateActivity(activityId, updateInput, token);

      if (result) {
        return {
          success: true,
          data: result,
          message: "Activity updated successfully"
        };
      }

      return {
        success: false,
        message: "Failed to update activity"
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
  const vendorsResponse = useVendors();
  const updateActivityAction = useUpdateActivity();
  const selectedAtoll = useSignal<number | undefined>();

  // Handle not found
  if (!activityData.value?.success || !activityData.value.data) {
    return (
      <div class="text-center py-12">
        <div class="text-6xl mb-4">🏝️</div>
        <h1 class="text-2xl font-bold mb-4">Activity Not Found</h1>
        <p class="text-base-content/70 mb-6">The activity you are looking for does not exist.</p>
        <Link href="/admin/activities" class="btn btn-primary">Back to Activities</Link>
      </div>
    );
  }

  const activity = activityData.value.data;

  // Filter islands by selected atoll
  const filteredIslands = selectedAtoll.value
    ? islands.value.filter(i => i.atoll_id === selectedAtoll.value)
    : islands.value;

  const vendors = vendorsResponse.value.data || [];

  const title = activity.translations?.en?.title || activity.seo_metadata?.title || activity.slug;
  const packageCount = activity.packages?.length || 0;

  return (
    <div>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <div class="breadcrumbs text-sm">
            <ul>
              <li><Link href="/admin/activities">Activities</Link></li>
              <li>{title}</li>
            </ul>
          </div>
          <h1 class="text-2xl font-bold">Edit Activity</h1>
          <div class="flex items-center gap-4 mt-2">
            <div class={`badge ${activity.status === 'published' ? 'badge-success' : activity.status === 'draft' ? 'badge-warning' : 'badge-error'}`}>
              {activity.status}
            </div>
            <div class="text-sm text-base-content/70">
              {packageCount} package{packageCount !== 1 ? 's' : ''}
            </div>
            {activity.review_count > 0 && (
              <div class="text-sm text-base-content/70">
                ⭐ {activity.review_score.toFixed(1)} ({activity.review_count} reviews)
              </div>
            )}
          </div>
        </div>
        <div class="mt-4 sm:mt-0 flex gap-2">
          <Link
            href={`/admin/activities/${activity.id}/builder`}
            class="btn btn-outline btn-sm"
          >
            🎨 Page Builder
          </Link>
          <Link
            href={`/admin/activities/${activity.id}/packages`}
            class="btn btn-outline btn-sm"
          >
            📦 Packages ({packageCount})
          </Link>
          <Link href="/admin/activities" class="btn btn-outline">
            Back to Activities
          </Link>
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

      <Form action={updateActivityAction} class="space-y-8">
          <input type="hidden" value={activity.id} name="id"/>
        {/* Basic Information */}
        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <h2 class="card-title">Basic Information</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-control md:col-span-2">
                <label class="label">
                  <span class="label-text">Activity Slug *</span>
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
                  <span class="label-text">Category ID</span>
                </label>
                <input
                  type="number"
                  name="category_id"
                  class="input input-bordered"
                  value={activity.category_id || ''}
                  placeholder="e.g., 5 for fishing"
                  min="1"
                />
                {activity.category && (
                  <label class="label">
                    <span class="label-text-alt">
                      Current: {activity.category.icon} {activity.category.name}
                    </span>
                  </label>
                )}
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Status *</span>
                </label>
                <select name="status" class="select select-bordered" value={activity.status} required>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Vendor</span>
                </label>
                <select
                  name="vendor_id"
                  class="select select-bordered"
                  value={activity.vendor_id || ''}
                >
                  <option value="">Select Vendor (optional)</option>
                  {vendors.map((vendor: any) => {
                    const label = vendor.status !== 'verified'
                      ? `${vendor.business_name} (${vendor.status})`
                      : vendor.business_name;
                    return (
                      <option key={vendor.id} value={vendor.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Atoll</span>
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
                  <span class="label-text">Island</span>
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
        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <h2 class="card-title">SEO & Preview</h2>
            <p class="text-sm text-base-content/70">
              This information is used for search engines and social media previews.
            </p>

            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">SEO Title *</span>
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
                  <span class="label-text">SEO Description *</span>
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
                  <span class="label-text">Keywords</span>
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
                  <span class="label-text">Open Graph Image URL</span>
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
        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <h2 class="card-title">Activity Statistics</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="stat">
                <div class="stat-title">Reviews</div>
                <div class="stat-value text-primary">{activity.review_count}</div>
                <div class="stat-desc">Average: {activity.review_score.toFixed(1)} ⭐</div>
              </div>
              <div class="stat">
                <div class="stat-title">Packages</div>
                <div class="stat-value text-primary">{packageCount}</div>
                <div class="stat-desc">
                  <Link href={`/admin/activities/${activity.id}/packages`} class="link">
                    Manage packages
                  </Link>
                </div>
              </div>
              <div class="stat">
                <div class="stat-title">Min Price</div>
                <div class="stat-value text-accent">${activity.min_price_usd.toFixed(2)}</div>
                <div class="stat-desc">Starting from (USD)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Layout Info */}
        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <h2 class="card-title">Page Layout</h2>
            <p class="text-sm text-base-content/70">
              The page layout is managed via the Page Builder. Current layout has {activity.page_layout?.length || 0} components.
            </p>
            <div class="mt-4">
              <Link
                href={`/admin/activities/${activity.id}/builder`}
                class="btn btn-primary"
              >
                Open Page Builder
              </Link>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div class="flex justify-end gap-2">
          <Link href="/admin/activities" class="btn btn-ghost">
            Cancel
          </Link>
          <button type="submit" class="btn btn-primary">
            Update Activity
          </button>
        </div>
      </Form>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Edit Activity • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Edit activity details and settings",
    },
  ],
};
