import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$, routeAction$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import type { ApiResponse } from "~/types/api";
import { ErrorState } from "~/components/error-state/error-state";

interface ActivityCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCategories = routeLoader$<ApiResponse<ActivityCategory[]>>(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        return await apiClient.categories.listAll(token);
    });
});

export const useDeleteCategory = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const categoryId = data.categoryId as string;
    return await apiClient.categories.delete(categoryId, token);
  });
});

export default component$(() => {
  const categoriesResponse = useCategories();
  const deleteAction = useDeleteCategory();
  const deleteModalId = useSignal<string | null>(null);

  const categories = categoriesResponse.value.data || [];

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-3xl font-bold">Activity Categories</h1>
          <p class="text-gray-600 mt-2">Manage activity categories for your platform</p>
        </div>
        <Link href="/admin/categories/new" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Category
        </Link>
      </div>

      {deleteAction.value?.success && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{deleteAction.value.message || 'Category deleted successfully'}</span>
        </div>
      )}

      {deleteAction.value?.success === false && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{deleteAction.value.error_message || 'Failed to delete category'}</span>
        </div>
      )}

      {categoriesResponse.value.error_message ? (
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <ErrorState
              title="Failed to load categories"
              message={categoriesResponse.value.error_message}
            />
          </div>
        </div>
      ) : (
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={7} class="text-center py-8 text-gray-500">
                        No categories found. Create your first category to get started.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                    <tr key={category.id}>
                      <td class="font-mono text-sm">{category.display_order}</td>
                      <td>
                        <span class="text-2xl">{category.icon}</span>
                      </td>
                      <td class="font-medium">{category.name}</td>
                      <td class="font-mono text-sm text-gray-600">{category.id}</td>
                      <td class="text-sm text-gray-600">
                        {category.description || <span class="italic text-gray-400">No description</span>}
                      </td>
                      <td>
                        {category.is_active ? (
                          <span class="badge badge-success">Active</span>
                        ) : (
                          <span class="badge badge-ghost">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div class="flex gap-2">
                          <Link
                            href={`/admin/categories/${category.id}/edit`}
                            class="btn btn-sm btn-ghost"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <button
                            class="btn btn-sm btn-ghost text-error"
                            onClick$={() => deleteModalId.value = category.id}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
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
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId.value && (
        <dialog class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Delete Category</h3>
            <p class="py-4">Are you sure you want to delete this category? This action cannot be undone.</p>
            <div class="modal-action">
              <button
                class="btn btn-ghost"
                onClick$={() => deleteModalId.value = null}
              >
                Cancel
              </button>
              <form method="post" onSubmit$={() => deleteAction.submit({ categoryId: deleteModalId.value})}>
                <input type="hidden" name="categoryId" value={deleteModalId.value} />
                <button
                  type="submit"
                  class="btn btn-error"
                  onClick$={() => deleteModalId.value = null}
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop">
            <button onClick$={() => deleteModalId.value = null}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Categories - Admin",
  meta: [
    {
      name: "description",
      content: "Manage activity categories",
    },
  ],
};
