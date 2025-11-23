import {component$, useSignal} from "@builder.io/qwik";
import type {DocumentHead} from "@builder.io/qwik-city";
import {Form, Link, routeAction$} from "@builder.io/qwik-city";
import {apiClient, authenticatedRequest} from "~/utils/api-client";

// Define supported languages
const SUPPORTED_LOCALES = [
  { code: "en", locale: "en-US", name: "English" },
  { code: "it", locale: "it-IT", name: "Italian" },
  // Add more languages as needed
];

// Action to create a new FAQ
export const useCreateFAQ = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    // Prepare translations for each language
    const translations: Record<string, { question: string; answer: string }> = {};

    for (const locale of SUPPORTED_LOCALES) {
      const questionKey = `question_${locale.locale}`;
      const answerKey = `answer_${locale.locale}`;

      if (data[questionKey] || data[answerKey]) {
        translations[locale.locale] = {
          question: data[questionKey] as string || "",
          answer: data[answerKey] as string || ""
        };
      }
    }

    const faqData = {
      category: data.category as string || "general",
      is_published: data.is_published === "true",
      display_order: parseInt(data.display_order as string) || 0,
      translations
    };

    return await apiClient.faqs.create(faqData, token);
  });
});

export default component$(() => {
  const createFAQ = useCreateFAQ();
  const activeTab = useSignal<string>(SUPPORTED_LOCALES[0].locale);

  return (
    <div>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">Add New FAQ</h1>
          <p class="text-sm text-base-content/70 mt-1">
            Create a new frequently asked question with translations.
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
      {createFAQ.value?.success && (
        <div class="alert alert-success mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span>FAQ created successfully</span>
            <div class="mt-2">
              <Link
                href="/admin/faqs"
                class="link link-success"
              >
                Return to FAQ list
              </Link>
              {" | "}
              <Link
                href={`/admin/faqs/${createFAQ.value.data?.id}`}
                class="link link-success"
              >
                Edit this FAQ
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {createFAQ.value?.success === false && (
        <div class="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{createFAQ.value.error_message || 'Failed to create FAQ'}</span>
        </div>
      )}

      <div class="mt-8">
        <Form action={createFAQ} class="space-y-8">
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
                {SUPPORTED_LOCALES.map((locale) => (
                  <div
                    key={locale.locale}
                    class={activeTab.value === locale.locale ? 'block' : 'hidden'}
                  >
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
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}
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
              Create FAQ
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Add FAQ • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Create a new frequently asked question",
    },
  ],
};
