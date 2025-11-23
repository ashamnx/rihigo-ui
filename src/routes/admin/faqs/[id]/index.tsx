import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, routeAction$, Form, Link } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";

// Define supported languages
const SUPPORTED_LOCALES = [
  { code: "en", locale: "en-US", name: "English" },
  { code: "it", locale: "it-IT", name: "Italian" },
  // Add more languages as needed
];

// Loader to fetch the FAQ
export const useFAQ = routeLoader$(async (requestEvent) => {
  const id = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async () => {
    return await apiClient.faqs.getById(id);
  });
});

// Action to update an existing FAQ
export const useUpdateFAQ = routeAction$(async (data, requestEvent) => {
  const id = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    // For now, the API only supports en-US, so we'll use that data
    const questionKey = `question_en-US`;
    const answerKey = `answer_en-US`;

    const faqData = {
      category: data.category || "general",
      is_published: data.is_published === "true",
      display_order: parseInt(data.display_order as string) || 0,
      question: data[questionKey] || "",
      answer: data[answerKey] || ""
    };

    return await apiClient.faqs.update(id, faqData, token);
  });
});

export default component$(() => {
  const faqResponse = useFAQ();
  const updateFAQ = useUpdateFAQ();
  const activeTab = useSignal<string>(SUPPORTED_LOCALES[0].locale);

  // Handle not found or error
  if (!faqResponse.value?.success || !faqResponse.value.data) {
    return (
      <div>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold">FAQ Not Found</h1>
            <p class="text-sm text-base-content/70 mt-1">
              The FAQ you are looking for does not exist.
            </p>
          </div>
          <div class="mt-4 sm:mt-0">
            <Link
              href="/admin/faqs"
              class="btn btn-outline"
            >
              Back to FAQs
            </Link>
          </div>
        </div>

        <div class="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>The FAQ you are looking for does not exist.</span>
        </div>
      </div>
    );
  }

  const faq = faqResponse.value.data;
  // The faq object should have translations, but if not, default to empty object
  const translations = faq?.translations || {};

  return (
    <div>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">Edit FAQ</h1>
          <p class="text-sm text-base-content/70 mt-1">
            Update this frequently asked question and its translations.
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <Link
            href="/admin/faqs"
            class="btn btn-outline"
          >
            Back to FAQs
          </Link>
        </div>
      </div>

      {/* Success message */}
      {updateFAQ.value?.success && (
        <div class="alert alert-success mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>FAQ updated successfully</span>
        </div>
      )}

      {/* Error message */}
      {updateFAQ.value?.success === false && (
        <div class="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{updateFAQ.value.error_message || 'Failed to update FAQ'}</span>
        </div>
      )}

      <div class="mt-8">
        <Form action={updateFAQ} class="space-y-8">
          {/* Core FAQ information */}
          <div class="card bg-base-100 shadow-md">
            <div class="card-body">
              <h2 class="card-title">FAQ Information</h2>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="category" class="label">
                    <span class="label-text">Category</span>
                  </label>
                  <input
                    type="text"
                    name="category"
                    id="category"
                    class="input input-bordered w-full"
                    placeholder="general"
                    value={faq.category}
                  />
                </div>

                <div>
                  <label for="display_order" class="label">
                    <span class="label-text">Display Order</span>
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    id="display_order"
                    class="input input-bordered w-full"
                    placeholder="0"
                    min="0"
                    value={faq.display_order}
                  />
                </div>

                <div class="sm:col-span-2">
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-2">
                      <input
                        id="is_published"
                        name="is_published"
                        type="checkbox"
                        value="true"
                        checked={faq.published}
                        class="checkbox checkbox-primary"
                      />
                      <div>
                        <span class="label-text font-medium">Published</span>
                        <p class="text-sm text-base-content/70">Make this FAQ visible to users.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Translations */}
          <div class="card bg-base-100 shadow-md">
            <div class="card-body">
              <h2 class="card-title">Translations</h2>

              {/* Language tabs */}
              <div class="tabs tabs-bordered">
                {SUPPORTED_LOCALES.map((locale) => (
                  <button
                    key={locale.locale}
                    type="button"
                    onClick$={() => activeTab.value = locale.locale}
                    class={`tab ${activeTab.value === locale.locale ? 'tab-active' : ''}`}
                  >
                    {locale.name}
                  </button>
                ))}
              </div>

              {/* Translation forms */}
              <div class="mt-6">
                {SUPPORTED_LOCALES.map((locale) => {
                  const translation = translations[locale.locale] || {};

                  return (
                    <div
                      key={locale.locale}
                      class={activeTab.value === locale.locale ? 'block' : 'hidden'}
                    >
                      {/* Hidden field to store translation ID if it exists */}
                      {translation.id && (
                        <input 
                          type="hidden" 
                          name={`translation_id_${locale.locale}`} 
                          value={translation.id} 
                        />
                      )}

                      <div class="space-y-6">
                        <div class="form-control">
                          <label for={`question_${locale.locale}`} class="label">
                            <span class="label-text">Question ({locale.name})</span>
                          </label>
                          <input
                            type="text"
                            name={`question_${locale.locale}`}
                            id={`question_${locale.locale}`}
                            class="input input-bordered w-full"
                            placeholder={`Enter question in ${locale.name}`}
                            value={translation.question || ""}
                          />
                        </div>

                        <div class="form-control">
                          <label for={`answer_${locale.locale}`} class="label">
                            <span class="label-text">Answer ({locale.name})</span>
                          </label>
                          <textarea
                            name={`answer_${locale.locale}`}
                            id={`answer_${locale.locale}`}
                            rows={4}
                            class="textarea textarea-bordered w-full"
                            placeholder={`Enter answer in ${locale.name}`}
                          >{translation.answer || ""}</textarea>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <Link
              href="/admin/faqs"
              class="btn btn-ghost"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="btn btn-primary"
            >
              Update FAQ
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Edit FAQ • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Edit a frequently asked question",
    },
  ],
};
