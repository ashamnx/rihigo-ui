import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import {
  createTaxRule,
  deleteTaxRule,
  getTaxRules,
  updateTaxRule,
} from "~/services/tax-api";
import type { TaxRule } from "~/types/tax";
import { authenticatedRequest } from "~/utils/api-client";
import {
  type InitialValues,
  formAction$,
  useForm,
  valiForm$,
} from "@modular-forms/qwik";
import * as v from "valibot";

// Form schema
const TaxRuleSchema = v.object({
  id: v.optional(v.string()),
  name: v.pipe(
    v.string(),
    v.minLength(1, "Name is required"),
    v.maxLength(100, "Name must be less than 100 characters"),
  ),
  type: v.picklist(
    ["percentage", "fixed_per_person"],
    "Type must be percentage or fixed_per_person",
  ),
  rate: v.pipe(
    v.number(),
    v.minValue(0, "Rate must be positive"),
    v.maxValue(100, "Rate cannot exceed 100"),
  ),
  booking_type: v.optional(v.string()),
});

type TaxRuleForm = v.InferOutput<typeof TaxRuleSchema>;

export const useTaxRules = routeLoader$(async (requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    return await getTaxRules(token);
  });
});

export const useFormAction = formAction$<TaxRuleForm>(
  async (values, requestEvent) => {
    const result = await authenticatedRequest(requestEvent, async (token) => {
      if (values.id) {
        // Update existing rule
        return await updateTaxRule(values.id, values, token);
      } else {
        // Create new rule
        return await createTaxRule(values, token);
      }
    });

    // Return success if the operation succeeded
    if (result.success) {
      return {
        status: "success",
        message: result.message || "Tax rule saved successfully",
      };
    }

    // Return field errors if available
    return {
      status: "error",
      message: result.error_message || "Failed to save tax rule",
    };
  },
  valiForm$(TaxRuleSchema),
);

export const useDeleteTaxRule = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    return await deleteTaxRule(data.id as string, token);
  });
});

export default component$(() => {
  const taxRulesData = useTaxRules();
  const deleteAction = useDeleteTaxRule();

  const showModal = useSignal(false);
  const isEditing = useSignal(false);

  const formLoader = useSignal<InitialValues<TaxRuleForm>>({
    id: undefined,
    name: "",
    type: "percentage",
    rate: 0,
    booking_type: "",
  });

  const [taxFormStore, { Form: TaxForm, Field }] = useForm<TaxRuleForm>({
    loader: formLoader,
    action: useFormAction(),
    validate: valiForm$(TaxRuleSchema),
  });

  const openCreateModal = $(() => {
    isEditing.value = false;
    formLoader.value = {
      id: undefined,
      name: "",
      type: "percentage",
      rate: 0,
      booking_type: "",
    };
    showModal.value = true;
  });

  const openEditModal = $((rule: TaxRule) => {
    isEditing.value = true;
    formLoader.value = {
      id: rule.id,
      name: rule.name,
      type: rule.type,
      rate: rule.rate,
      booking_type: rule.booking_type || "",
    };
    showModal.value = true;
  });

  const closeModal = $(() => {
    showModal.value = false;
  });

  // Close modal on successful form submission
  useTask$(({ track }) => {
    track(() => taxFormStore.response.status);
    if (taxFormStore.response.status === "success" && showModal.value) {
      showModal.value = false;
    }
  });

  return (
    <div>
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Tax Rules</h1>
          <p class="text-base-content/70 mt-1 text-sm">
            Manage tax configurations
          </p>
        </div>
        <button class="btn btn-primary" onClick$={openCreateModal}>
          Add Tax Rule
        </button>
      </div>

      {(taxFormStore.response.status === "success" ||
        deleteAction.value?.success) && (
        <div class="alert alert-success mb-4">
          <span>
            {taxFormStore.response.message || deleteAction.value?.message}
          </span>
        </div>
      )}

      {taxFormStore.response.status === "error" && (
        <div class="alert alert-error mb-4">
          <span>{taxFormStore.response.message}</span>
        </div>
      )}

      <div class="bg-base-100 overflow-x-auto rounded-lg shadow">
        <table class="table-zebra table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Rate</th>
              <th>Booking Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxRulesData.value.data?.map((rule: TaxRule) => (
              <tr key={rule.id}>
                <td>
                  <div class="font-bold">{rule.name}</div>
                </td>
                <td>
                  <span class="capitalize">{rule.type.replace("_", " ")}</span>
                </td>
                <td>
                  {rule.type === "percentage"
                    ? `${rule.rate}%`
                    : `$${rule.rate}`}
                </td>
                <td>
                  {rule.booking_type ? (
                    <span class="badge badge-outline">{rule.booking_type}</span>
                  ) : (
                    <span class="text-xs opacity-50">All types</span>
                  )}
                </td>
                <td>
                  <span
                    class={`badge ${rule.is_active ? "badge-success" : "badge-ghost"}`}
                  >
                    {rule.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(rule.created_at).toLocaleDateString()}</td>
                <td>
                  <div class="flex gap-2">
                    <button
                      class="btn btn-xs btn-outline"
                      onClick$={() => openEditModal(rule)}
                    >
                      Edit
                    </button>
                    <Form action={deleteAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <button class="btn btn-xs btn-error btn-outline">
                        Delete
                      </button>
                    </Form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal.value && (
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="mb-4 text-lg font-bold">
              {isEditing.value ? "Edit Tax Rule" : "New Tax Rule"}
            </h3>
            <TaxForm>
              <Field name="id" type="string">
                {(field, props) => (
                  <input {...props} type="hidden" value={field.value} />
                )}
              </Field>

              <Field name="name" type="string">
                {(field, props) => (
                  <div class="form-control mb-4 w-full">
                    <label class="label">
                      <span class="label-text">Name</span>
                    </label>
                    <input
                      {...props}
                      type="text"
                      class="input input-bordered w-full"
                      value={field.value}
                    />
                    {field.error && (
                      <label class="label">
                        <span class="label-text-alt text-error">
                          {field.error}
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </Field>

              <div class="mb-4 flex gap-4">
                <Field name="type">
                  {(field, props) => (
                    <div class="form-control w-1/2">
                      <label class="label">
                        <span class="label-text">Type</span>
                      </label>
                      <select
                        {...props}
                        class="select select-bordered w-full"
                        value={field.value}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed_per_person">Fixed per Person</option>
                      </select>
                      {field.error && (
                        <label class="label">
                          <span class="label-text-alt text-error">
                            {field.error}
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </Field>

                <Field name="rate" type="number">
                  {(field, props) => (
                    <div class="form-control w-1/2">
                      <label class="label">
                        <span class="label-text">Rate</span>
                      </label>
                      <input
                        {...props}
                        type="number"
                        step="0.01"
                        class="input input-bordered w-full"
                        value={field.value}
                      />
                      {field.error && (
                        <label class="label">
                          <span class="label-text-alt text-error">
                            {field.error}
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                </Field>
              </div>

              <Field name="booking_type" type="string">
                {(field, props) => (
                  <div class="form-control mb-4 w-full">
                    <label class="label">
                      <span class="label-text">Booking Type</span>
                      <span class="label-text-alt text-xs opacity-50">
                        Optional - leave empty for all types
                      </span>
                    </label>
                    <input
                      {...props}
                      type="text"
                      class="input input-bordered w-full"
                      placeholder="e.g., diving, surfing"
                      value={field.value}
                    />
                    {field.error && (
                      <label class="label">
                        <span class="label-text-alt text-error">
                          {field.error}
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </Field>

              <div class="modal-action">
                <button type="button" class="btn" onClick$={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={taxFormStore.submitting}
                >
                  {taxFormStore.submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </TaxForm>
          </div>
          <div class="modal-backdrop" onClick$={closeModal}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Tax Rules | Admin",
};
