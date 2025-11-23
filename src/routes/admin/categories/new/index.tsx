import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, useNavigate } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";

export const useCreateCategory = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const categoryData = {
      id: data.id as string,
      name: data.name as string,
      icon: data.icon as string,
      description: data.description as string || '',
      display_order: parseInt(data.display_order as string) || 0,
      is_active: data.is_active === 'on',
    };

    return await apiClient.categories.create(categoryData, token);
  });
});

export default component$(() => {
  const createAction = useCreateCategory();
  const nav = useNavigate();
  const iconPreview = useSignal('🏛️');

  return (
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <Link href="/admin/categories" class="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to Categories
          </Link>
        </div>
        <h1 class="text-3xl font-bold">Create New Category</h1>
        <p class="text-gray-600 mt-2">Add a new activity category to your platform</p>
      </div>

      {createAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Category created successfully</span>
        </div>
      )}

      {createAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{createAction.value.error_message || 'Failed to create category'}</span>
        </div>
      )}

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <Form action={createAction} onSubmitCompleted$={async () => {
            if (createAction.value?.success) {
              await nav('/admin/categories');
            }
          }}>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Category ID *</span>
                <span class="label-text-alt text-xs text-gray-500">Lowercase, hyphenated (e.g., water-sports)</span>
              </label>
              <input
                type="text"
                name="id"
                class="input input-bordered"
                placeholder="e.g., water-sports"
                pattern="[a-z0-9-]+"
                required
              />
            </div>

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text">Name *</span>
              </label>
              <input
                type="text"
                name="name"
                class="input input-bordered"
                placeholder="e.g., Water Sports & Activities"
                required
              />
            </div>

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text">Icon *</span>
                <span class="label-text-alt text-xs text-gray-500">Single emoji character</span>
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  name="icon"
                  class="input input-bordered flex-1"
                  placeholder="e.g., 🏄"
                  maxLength={2}
                  value={iconPreview.value}
                  onInput$={(e) => iconPreview.value = (e.target as HTMLInputElement).value}
                  required
                />
                <div class="flex items-center justify-center w-16 h-12 bg-base-200 rounded-lg">
                  <span class="text-3xl">{iconPreview.value}</span>
                </div>
              </div>
              <label class="label">
                <span class="label-text-alt text-xs text-gray-500">
                  Common emojis: 🏛️ 🚌 🏄 🤿 🎣 🏝️ 🌅 💆 🎭 🪂 🍽️ ✈️
                </span>
              </label>
            </div>

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text">Description</span>
              </label>
              <textarea
                name="description"
                class="textarea textarea-bordered"
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text">Display Order</span>
                <span class="label-text-alt text-xs text-gray-500">Lower numbers appear first</span>
              </label>
              <input
                type="number"
                name="display_order"
                class="input input-bordered"
                placeholder="0"
                min="0"
                value="0"
              />
            </div>

            <div class="form-control mt-4">
              <label class="label cursor-pointer justify-start gap-2">
                <input type="checkbox" name="is_active" class="checkbox" checked />
                <span class="label-text">Active</span>
              </label>
              <label class="label">
                <span class="label-text-alt text-xs text-gray-500">
                  Only active categories are shown to users
                </span>
              </label>
            </div>

            <div class="card-actions justify-end mt-6 pt-4 border-t">
              <Link href="/admin/categories" class="btn btn-ghost">
                Cancel
              </Link>
              <button type="submit" class="btn btn-primary" disabled={createAction.isRunning}>
                {createAction.isRunning ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  'Create Category'
                )}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "New Category - Admin",
  meta: [
    {
      name: "description",
      content: "Create a new activity category",
    },
  ],
};
