import {component$, useSignal} from "@builder.io/qwik";
import type {DocumentHead} from "@builder.io/qwik-city";
import {Form, Link, routeAction$, routeLoader$} from "@builder.io/qwik-city";
import {apiClient, authenticatedRequest} from "~/utils/api-client";
import { ErrorState } from "~/components/error-state/error-state";

// Define the FAQ type based on the API response
interface FAQ {
  id: string;
  category: string;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  // API returns flat structure with question/answer
  question?: string;
  answer?: string;
}

// Loader to fetch all FAQs (authenticated)
export const useFAQs = routeLoader$(async (requestEvent) => {
  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.faqs.listAdmin(token, 1, 100); // Fetch up to 100 FAQs
  });

  // Return both success status and data/error
  if (!response.success) {
    console.error('Failed to load FAQs:', response.error_message);
    return {
      success: false,
      error: response.error_message || 'Failed to load FAQs',
      data: []
    };
  }

  return {
    success: true,
    error: null,
    data: response.data || []
  };
});

// Action to delete a FAQ
export const useDeleteFAQ = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.faqs.delete(data.id as string, token);
  });
});

// Action to toggle FAQ published status
export const useTogglePublished = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    // Fetch the current FAQ to get its data
    const getFaqResponse = await apiClient.faqs.getById(data.id as string);

    if (!getFaqResponse.success || !getFaqResponse.data) {
      return getFaqResponse;
    }

    const currentFaq = getFaqResponse.data;
    const updatedData = {
      ...currentFaq,
      published: data.published !== "true"
    };

    return await apiClient.faqs.update(
      data.id as string,
      updatedData,
      token
    );
  });
});

export default component$(() => {
  const faqsResponse = useFAQs();
  const deleteFAQ = useDeleteFAQ();
  const togglePublished = useTogglePublished();
  const showConfirmation = useSignal(false);
  const faqToDelete = useSignal<string | null>(null);
  const successMessage = useSignal<string | null>(null);

  // Show error state if API request failed
  if (!faqsResponse.value.success) {
    return (
      <div>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold">FAQs</h1>
            <p class="text-sm text-base-content/70 mt-1">
              A list of all frequently asked questions in the system.
            </p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-md">
          <div class="card-body">
            <ErrorState
              title="Failed to load FAQs"
              message={faqsResponse.value.error || "Unable to connect to the server. Please check your connection and try again."}
            />
          </div>
        </div>
      </div>
    );
  }

  const faqs = faqsResponse.value.data || [];

  // Clear success message after 3 seconds
  // useTask$(({ track }) => {
  //   track(() => deleteFAQ.value.success || togglePublished.value.success);
  //
  //   if (deleteFAQ.value.success) {
  //     successMessage.value = deleteFAQ.value.message;
  //   } else if (togglePublished.value.success) {
  //     successMessage.value = togglePublished.value.message;
  //   }
  //
  //   if (successMessage.value) {
  //     const timeout = setTimeout(() => {
  //       successMessage.value = null;
  //     }, 3000);
  //
  //     return () => clearTimeout(timeout);
  //   }
  // });

  return (
    <div>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">FAQs</h1>
          <p class="text-sm text-base-content/70 mt-1">
            A list of all frequently asked questions in the system.
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <Link
            href="/admin/faqs/new"
            class="btn btn-primary"
          >
            Add FAQ
          </Link>
        </div>
      </div>

      {/* Success message */}
      {successMessage.value && (
        <div class="alert alert-success mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMessage.value}</span>
        </div>
      )}

      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Question</th>
              <th>Category</th>
              <th>Status</th>
              <th>Languages</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs.length === 0 ? (
              <tr>
                <td colSpan={5} class="text-center">
                  No FAQs found. Click "Add FAQ" to create one.
                </td>
              </tr>
            ) : (
              faqs.map((faq: FAQ) => (
                <tr key={faq.id}>
                  <td>
                    {faq.question || 'No question available'}
                  </td>
                  <td>{faq.category}</td>
                  <td>
                    <Form action={togglePublished}>
                      <input type="hidden" name="id" value={faq.id} />
                      <input type="hidden" name="published" value={faq.published.toString()} />
                      <button
                        type="submit"
                        class={`badge ${
                          faq.published
                            ? 'badge-success'
                            : 'badge-error'
                        }`}
                      >
                        {faq.published ? 'Published' : 'Draft'}
                      </button>
                    </Form>
                  </td>
                  <td>
                    {/* API returns flat structure, no separate translations */}
                    en-US
                  </td>
                  <td class="text-right">
                    <div class="flex justify-end gap-2">
                      <Link
                        href={`/admin/faqs/${faq.id}`}
                        class="btn btn-sm btn-ghost text-primary"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        class="btn btn-sm btn-ghost text-error"
                        onClick$={() => {
                          faqToDelete.value = faq.id;
                          showConfirmation.value = true;
                        }}
                      >
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

      {/* Confirmation dialog */}
      {showConfirmation.value && (
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Delete FAQ</h3>
            <p class="py-4">Are you sure you want to delete this FAQ? This action cannot be undone.</p>
            <div class="modal-action">
              <Form action={deleteFAQ}>
                <input type="hidden" name="id" value={faqToDelete.value || ''} />
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
                  faqToDelete.value = null;
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick$={() => {
            showConfirmation.value = false;
            faqToDelete.value = null;
          }}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "FAQs • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage frequently asked questions",
    },
  ],
};
