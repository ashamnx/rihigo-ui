import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { authenticatedRequest } from "~/utils/api-client";
import {createActivity, getAtolls, getIslands} from "~/services/activity-api";
import type {CreateActivityInput} from '~/types/activity';

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

export const useCreateActivity = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
      try {
        // When admin API is ready, use this:
        const activityInput: CreateActivityInput = {
          slug: (data.slug as string).toLowerCase().replace(/\s+/g, '-'),
          category_id: data.category_id ? parseInt(data.category_id as string) : undefined,
          island_id: data.island_id ? parseInt(data.island_id as string) : undefined,
          status: (data.status as 'draft' | 'published' | 'archived') || 'draft',
          page_layout: [], // Start with empty page layout, will be built in page builder
          seo_metadata: {
            title: data.seo_title as string,
            description: data.seo_description as string,
            keywords: data.seo_keywords ? (data.seo_keywords as string).split(',').map(k => k.trim()) : [],
            og_image: data.og_image as string || undefined
          }
        };

        const activity = await createActivity(activityInput, token);

        return {
          success: true,
          data: activity
        };
      } catch (error) {
        return {
          success: false,
          error_message: error instanceof Error ? error.message : 'Failed to create activity'
        };
      }
  });
});

export default component$(() => {
  const atolls = useAtolls();
  const islands = useIslands();
  const createActivityAction = useCreateActivity();
  const selectedAtoll = useSignal<number | undefined>();
  const seoTitleLength = useSignal(0);
  const seoDescLength = useSignal(0);

  // Filter islands by selected atoll
  const filteredIslands = selectedAtoll.value
    ? islands.value.filter(i => i.atoll_id === selectedAtoll.value)
    : islands.value;

  return (
    <div class="max-w-5xl mx-auto">
      {/* Header Section */}
      <div class="mb-8">
        <div class="breadcrumbs text-sm mb-3">
          <ul>
            <li>
              <Link href="/admin/activities" class="link link-hover">
                Activities
              </Link>
            </li>
            <li class="text-base-content/70">New Activity</li>
          </ul>
        </div>

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-3xl font-bold mb-2">Create New Activity</h1>
            <p class="text-base-content/70">
              Create a new activity with basic information. Use the page builder to design the activity page.
            </p>
          </div>
          <Link href="/admin/activities" class="btn btn-outline btn-sm sm:btn-md gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>
      </div>

      {/* Success message */}
      {createActivityAction.value?.success && (
        <div class="alert alert-success mb-6 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="font-bold">Activity created successfully!</h3>
            <div class="text-sm mt-2 flex flex-wrap gap-3">
              <Link href="/admin/activities" class="link link-hover font-medium">
                Return to activities list
              </Link>
              {createActivityAction.value.data?.id && (
                <>
                  <span class="opacity-50">|</span>
                  <Link href={`/admin/activities/${createActivityAction.value.data.id}/builder`} class="link link-hover font-medium">
                    Build activity page
                  </Link>
                  <span class="opacity-50">|</span>
                  <Link href={`/admin/activities/${createActivityAction.value.data.id}/packages`} class="link link-hover font-medium">
                    Add packages
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {createActivityAction.value?.success === false && (
        <div class="alert alert-error mb-6 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{createActivityAction.value.message}</span>
        </div>
      )}

      <Form action={createActivityAction} class="space-y-6">
        {/* Basic Information Card */}
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

            <div class="space-y-6">
              {/* Activity Slug - Full Width */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Activity Slug <span class="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="slug"
                  class="input input-bordered focus:input-primary transition-all"
                  placeholder="sunset-fishing-tour"
                  required
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers, and hyphens"
                />
                <label class="label">
                  <span class="label-text-alt flex items-center gap-1 text-info">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                    URL preview: /en/activities/your-slug
                  </span>
                  <span class="label-text-alt">Lowercase letters, numbers, and hyphens only</span>
                </label>
              </div>

              <div class="divider my-4"></div>

              {/* Two Column Grid */}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category ID */}
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Category ID</span>
                    <span class="badge badge-ghost badge-sm">Optional</span>
                  </label>
                  <input
                    type="number"
                    name="category_id"
                    class="input input-bordered focus:input-primary transition-all"
                    placeholder="e.g., 5 for fishing"
                    min="1"
                  />
                  <label class="label">
                    <span class="label-text-alt">Reference activity_categories table</span>
                  </label>
                </div>

                {/* Status */}
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Status <span class="text-error">*</span></span>
                  </label>
                  <select name="status" class="select select-bordered focus:select-primary transition-all" required>
                    <option value="draft">Draft - Not visible to users</option>
                    <option value="published">Published - Live on website</option>
                    <option value="archived">Archived - Hidden from website</option>
                  </select>
                </div>

                {/* Atoll */}
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Atoll</span>
                    <span class="badge badge-ghost badge-sm">Optional</span>
                  </label>
                  <select
                    class="select select-bordered focus:select-primary transition-all"
                    onChange$={(e) => {
                      const value = (e.target as HTMLSelectElement).value;
                      selectedAtoll.value = value ? parseInt(value) : undefined;
                    }}
                  >
                    <option value="">Select Atoll</option>
                    {atolls.value.map((atoll) => (
                      <option key={atoll.id} value={atoll.id}>
                        {atoll.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Island */}
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Island</span>
                    <span class="badge badge-ghost badge-sm">Optional</span>
                  </label>
                  <select
                    name="island_id"
                    class="select select-bordered focus:select-primary transition-all"
                    disabled={!selectedAtoll.value}
                  >
                    <option value="">
                      {selectedAtoll.value ? "Select Island" : "Select an atoll first"}
                    </option>
                    {filteredIslands.map((island) => (
                      <option key={island.id} value={island.id}>
                        {`${island.name} (${island.type})`}
                      </option>
                    ))}
                  </select>
                  {!selectedAtoll.value && (
                    <label class="label">
                      <span class="label-text-alt text-warning">Select an atoll to filter islands</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Metadata Card */}
        <div class="card bg-base-100 shadow-xl border border-base-200">
          <div class="card-body">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold">SEO & Social Media</h2>
                <p class="text-sm text-base-content/70">Optimize for search engines and social sharing</p>
              </div>
            </div>

            <div class="space-y-6">
              {/* SEO Title with Character Counter */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">SEO Title <span class="text-error">*</span></span>
                  <span class={`badge badge-sm ${seoTitleLength.value > 60 ? 'badge-error' : seoTitleLength.value >= 50 ? 'badge-success' : 'badge-ghost'}`}>
                    {seoTitleLength.value}/60
                  </span>
                </label>
                <input
                  type="text"
                  name="seo_title"
                  class="input input-bordered focus:input-primary transition-all"
                  placeholder="Sunset Fishing Tour in Maldives | Best Rates"
                  required
                  maxLength={60}
                  onInput$={(e) => seoTitleLength.value = (e.target as HTMLInputElement).value.length}
                />
                <label class="label">
                  <span class="label-text-alt">Aim for 50-60 characters for optimal display</span>
                </label>
              </div>

              {/* SEO Description with Character Counter */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">SEO Description <span class="text-error">*</span></span>
                  <span class={`badge badge-sm ${seoDescLength.value > 160 ? 'badge-error' : seoDescLength.value >= 150 ? 'badge-success' : 'badge-ghost'}`}>
                    {seoDescLength.value}/160
                  </span>
                </label>
                <textarea
                  name="seo_description"
                  class="textarea textarea-bordered focus:textarea-primary transition-all h-28 resize-none"
                  placeholder="Experience the magic of sunset fishing in the Maldives. Join us for an unforgettable evening on the water..."
                  required
                  maxLength={160}
                  onInput$={(e) => seoDescLength.value = (e.target as HTMLTextAreaElement).value.length}
                ></textarea>
                <label class="label">
                  <span class="label-text-alt">Aim for 150-160 characters for optimal display</span>
                </label>
              </div>

              <div class="divider my-4"></div>

              {/* Advanced SEO */}
              <div class="collapse collapse-arrow bg-base-200/50 rounded-lg">
                <input type="checkbox" />
                <div class="collapse-title text-sm font-medium">
                  Advanced SEO Options
                </div>
                <div class="collapse-content space-y-6">
                  {/* Keywords */}
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium">Keywords</span>
                      <span class="badge badge-ghost badge-sm">Optional</span>
                    </label>
                    <input
                      type="text"
                      name="seo_keywords"
                      class="input input-bordered focus:input-primary transition-all"
                      placeholder="fishing, sunset, maldives, tour, marine"
                    />
                    <label class="label">
                      <span class="label-text-alt">Separate keywords with commas</span>
                    </label>
                  </div>

                  {/* Open Graph Image */}
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-medium">Open Graph Image URL</span>
                      <span class="badge badge-ghost badge-sm">Optional</span>
                    </label>
                    <input
                      type="url"
                      name="og_image"
                      class="input input-bordered focus:input-primary transition-all"
                      placeholder="https://example.com/image.jpg"
                    />
                    <label class="label">
                      <span class="label-text-alt">Recommended size: 1200x630px for social media previews</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div class="sticky bottom-0 z-10 bg-base-100 border-t border-base-200 -mx-6 px-6 py-4 sm:rounded-lg sm:shadow-lg sm:border sm:mx-0">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="text-sm text-base-content/70 hidden sm:block">
              <span class="text-error">*</span> Required fields
            </div>
            <div class="flex gap-3 w-full sm:w-auto">
              <Link href="/admin/activities" class="btn btn-ghost flex-1 sm:flex-none">
                Cancel
              </Link>
              <button
                type="submit"
                class="btn btn-primary flex-1 sm:flex-none gap-2"
                disabled={createActivityAction.isRunning}
              >
                {createActivityAction.isRunning ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Activity
                  </>
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
  title: "New Activity • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Create a new activity with the new headless CMS system",
    },
  ],
};
