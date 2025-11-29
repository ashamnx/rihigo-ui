import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$, useNavigate } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";

interface ActivityCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export const useCategory = routeLoader$(async (requestEvent) => {
  return authenticatedRequest(requestEvent, async () => {
    const categoryId = requestEvent.params.id;
    return await apiClient.categories.getById(categoryId);
  });
});

export const useUpdateCategory = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const categoryId = requestEvent.params.id;
    const categoryData = {
      id: categoryId,
      name: data.name as string,
      icon: data.icon as string,
      description: data.description as string || '',
      display_order: parseInt(data.display_order as string) || 0,
      is_active: data.is_active === 'on',
    };

    return await apiClient.categories.update(categoryId, categoryData, token);
  });
});

export default component$(() => {
  const categoryResponse = useCategory();
  const updateAction = useUpdateCategory();
  const nav = useNavigate();
  const category = categoryResponse.value.success ? categoryResponse.value.data as ActivityCategory : null;
  const iconPreview = useSignal(category?.icon || '🏛️');

  if (!category) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="alert alert-error">
          <span>{categoryResponse.value.error_message || 'Category not found'}</span>
        </div>
        <Link href="/admin/categories" class="btn btn-ghost mt-4">
          Back to Categories
        </Link>
      </div>
    );
  }

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
        <h1 class="text-3xl font-bold">Edit Category</h1>
        <p class="text-gray-600 mt-2">Update category: {category.name}</p>
      </div>

      {updateAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Category updated successfully</span>
        </div>
      )}

      {updateAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateAction.value.error_message || 'Failed to update category'}</span>
        </div>
      )}

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <Form action={updateAction} onSubmitCompleted$={async () => {
            if (updateAction.value?.success) {
              await nav('/admin/categories');
            }
          }}>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Category ID</span>
              </label>
              <input
                type="text"
                value={category.id}
                class="input input-bordered"
                disabled
              />
              <label class="label">
                <span class="label-text-alt text-xs text-gray-500">Category ID cannot be changed</span>
              </label>
            </div>

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text">Name *</span>
              </label>
              <input
                type="text"
                name="name"
                class="input input-bordered"
                value={category.name}
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
                value={category.description || ''}
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
                min="0"
                value={category.display_order}
              />
            </div>

            <div class="form-control mt-4">
              <label class="label cursor-pointer justify-start gap-2">
                <input type="checkbox" name="is_active" class="checkbox" checked={category.is_active} />
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
              <button type="submit" class="btn btn-primary" disabled={updateAction.isRunning}>
                {updateAction.isRunning ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  'Update Category'
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
  title: "Edit Category - Admin",
  meta: [
    {
      name: "description",
      content: "Edit activity category",
    },
  ],
};
