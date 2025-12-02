import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import {
  createTaxRule,
  deleteTaxRule,
  getTaxRules,
  toggleTaxRuleStatus,
  updateTaxRule,
} from "~/services/tax-api";
import type { TaxRule } from "~/types/tax";
import { authenticatedRequest } from "~/utils/api-client";
import {
  formAction$,
  reset,
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
  is_active: v.optional(v.boolean()),
});

type TaxRuleForm = v.InferOutput<typeof TaxRuleSchema>;

export const useTaxRules = routeLoader$(async (requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    return await getTaxRules(token);
  });
});

// Default form values for loader
export const useFormLoader = routeLoader$(() => ({
  id: undefined as string | undefined,
  name: "" as string,
  type: "percentage" as "percentage" | "fixed_per_person",
  rate: 0 as number,
  booking_type: "" as string | undefined,
  is_active: true as boolean | undefined,
}));

export const useFormAction = formAction$<TaxRuleForm>(
  async (values, requestEvent) => {
    const result = await authenticatedRequest(requestEvent, async (token) => {
      if (values.id) {
        return await updateTaxRule(values.id, {
          name: values.name,
          rate: values.rate,
          type: values.type,
          booking_type: values.booking_type || null,
          is_active: values.is_active,
        }, token);
      } else {
        return await createTaxRule({
          name: values.name,
          rate: values.rate,
          type: values.type,
          booking_type: values.booking_type || null,
        }, token);
      }
    });

    if (result.success) {
      return {
        status: "success",
        message: values.id ? "Tax rule updated successfully" : "Tax rule created successfully",
      };
    }

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

export const useToggleStatus = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const id = data.id as string;
    const isActive = data.is_active === "true";
    return await toggleTaxRuleStatus(id, !isActive, token);
  });
});

export default component$(() => {
  const taxRulesData = useTaxRules();
  const deleteAction = useDeleteTaxRule();
  const toggleAction = useToggleStatus();

  const showModal = useSignal(false);
  const isEditing = useSignal(false);
  const editingRuleId = useSignal<string | undefined>(undefined);
  const showDeleteConfirm = useSignal(false);
  const ruleToDelete = useSignal<TaxRule | null>(null);

  const [taxFormStore, { Form: TaxForm, Field }] = useForm<TaxRuleForm>({
    loader: useFormLoader(),
    action: useFormAction(),
    validate: valiForm$(TaxRuleSchema),
  });

  const taxRules = taxRulesData.value.data || [];

  const openCreateModal = $(() => {
    isEditing.value = false;
    editingRuleId.value = undefined;
    reset(taxFormStore, {
      initialValues: {
        id: undefined,
        name: "",
        type: "percentage",
        rate: 0,
        booking_type: "",
        is_active: true,
      },
    });
    showModal.value = true;
  });

  const openEditModal = $((rule: TaxRule) => {
    isEditing.value = true;
    editingRuleId.value = rule.id;
    reset(taxFormStore, {
      initialValues: {
        id: rule.id,
        name: rule.name,
        type: rule.type,
        rate: rule.rate,
        booking_type: rule.booking_type || "",
        is_active: rule.is_active,
      },
    });
    showModal.value = true;
  });

  const closeModal = $(() => {
    showModal.value = false;
  });

  const openDeleteConfirm = $((rule: TaxRule) => {
    ruleToDelete.value = rule;
    showDeleteConfirm.value = true;
  });

  const closeDeleteConfirm = $(() => {
    ruleToDelete.value = null;
    showDeleteConfirm.value = false;
  });

  // Close modal on successful form submission
  useTask$(({ track }) => {
    track(() => taxFormStore.response.status);
    if (taxFormStore.response.status === "success" && showModal.value) {
      showModal.value = false;
    }
  });

  // Close delete confirm on success
  useTask$(({ track }) => {
    track(() => deleteAction.value?.success);
    if (deleteAction.value?.success && showDeleteConfirm.value) {
      showDeleteConfirm.value = false;
      ruleToDelete.value = null;
    }
  });

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Tax Rules</h1>
          <p class="text-base-content/60 mt-1">
            Configure tax rates applied to bookings
          </p>
        </div>
        <button class="btn btn-primary btn-sm" onClick$={openCreateModal}>
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Tax Rule
        </button>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Total Rules</p>
          <p class="text-2xl font-bold mt-1">{taxRules.length}</p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Active</p>
          <p class="text-2xl font-bold mt-1 text-success">
            {taxRules.filter((r: TaxRule) => r.is_active).length}
          </p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Percentage-based</p>
          <p class="text-2xl font-bold mt-1 text-info">
            {taxRules.filter((r: TaxRule) => r.type === "percentage").length}
          </p>
        </div>
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-base-content/60 text-sm">Fixed Amount</p>
          <p class="text-2xl font-bold mt-1 text-warning">
            {taxRules.filter((r: TaxRule) => r.type === "fixed_per_person").length}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {(taxFormStore.response.status === "success" || deleteAction.value?.success || toggleAction.value?.success) && (
        <div class="alert alert-success py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {taxFormStore.response.message || deleteAction.value?.message || "Status updated successfully"}
          </span>
        </div>
      )}

      {(taxFormStore.response.status === "error" || deleteAction.value?.success === false) && (
        <div class="alert alert-error py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{taxFormStore.response.message || deleteAction.value?.error_message}</span>
        </div>
      )}

      {/* Tax Rules Table */}
      {taxRules.length === 0 ? (
        <div class="bg-base-200 rounded-xl p-12 text-center">
          <div class="size-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
            <svg class="size-8 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">No tax rules configured</h3>
          <p class="text-base-content/60 mb-4">
            Create your first tax rule to apply taxes to bookings
          </p>
          <button class="btn btn-primary btn-sm" onClick$={openCreateModal}>
            Add Tax Rule
          </button>
        </div>
      ) : (
        <div class="bg-base-200 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="border-base-300">
                  <th>Name</th>
                  <th>Type</th>
                  <th>Rate</th>
                  <th>Applies To</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxRules.map((rule: TaxRule) => (
                  <tr key={rule.id} class="hover border-base-300">
                    <td>
                      <div class="font-medium">{rule.name}</div>
                    </td>
                    <td>
                      <span class={`badge badge-sm ${rule.type === "percentage" ? "badge-info" : "badge-warning"}`}>
                        {rule.type === "percentage" ? "Percentage" : "Fixed/Person"}
                      </span>
                    </td>
                    <td>
                      <span class="font-mono">
                        {rule.type === "percentage" ? `${rule.rate}%` : `$${rule.rate}`}
                      </span>
                    </td>
                    <td>
                      {rule.booking_type ? (
                        <span class="badge badge-sm badge-outline">{rule.booking_type}</span>
                      ) : (
                        <span class="text-base-content/50 text-xs">All bookings</span>
                      )}
                    </td>
                    <td>
                      <Form action={toggleAction}>
                        <input type="hidden" name="id" value={rule.id} />
                        <input type="hidden" name="is_active" value={String(rule.is_active)} />
                        <button
                          type="submit"
                          class={`badge badge-sm cursor-pointer ${rule.is_active ? "badge-success" : "badge-ghost"}`}
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </button>
                      </Form>
                    </td>
                    <td>
                      <span class="text-base-content/60 text-xs">
                        {new Date(rule.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div class="flex items-center justify-end gap-1">
                        <button
                          class="btn btn-ghost btn-xs"
                          onClick$={() => openEditModal(rule)}
                        >
                          Edit
                        </button>
                        <button
                          class="btn btn-ghost btn-xs text-error"
                          onClick$={() => openDeleteConfirm(rule)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal.value && (
        <div class="modal modal-open">
          <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4">
              {isEditing.value ? "Edit Tax Rule" : "New Tax Rule"}
            </h3>
            <TaxForm>
              {/* Hidden field for rule ID - use editingRuleId signal for reliable value */}
              <input type="hidden" name="id" value={editingRuleId.value || ''} />

              <Field name="name" type="string">
                {(field, props) => (
                  <div class="form-control mb-3">
                    <label class="label py-1">
                      <span class="label-text text-sm">Name</span>
                    </label>
                    <input
                      {...props}
                      type="text"
                      placeholder="e.g., GST, Service Tax"
                      class="input input-sm input-bordered"
                      value={field.value}
                    />
                    {field.error && (
                      <label class="label py-1">
                        <span class="label-text-alt text-error text-xs">{field.error}</span>
                      </label>
                    )}
                  </div>
                )}
              </Field>

              <div class="grid grid-cols-2 gap-3 mb-3">
                <Field name="type">
                  {(field, props) => (
                    <div class="form-control">
                      <label class="label py-1">
                        <span class="label-text text-sm">Type</span>
                      </label>
                      <select
                        {...props}
                        class="select select-sm select-bordered"
                        value={field.value}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed_per_person">Fixed per Person</option>
                      </select>
                      {field.error && (
                        <label class="label py-1">
                          <span class="label-text-alt text-error text-xs">{field.error}</span>
                        </label>
                      )}
                    </div>
                  )}
                </Field>

                <Field name="rate" type="number">
                  {(field, props) => (
                    <div class="form-control">
                      <label class="label py-1">
                        <span class="label-text text-sm">Rate</span>
                      </label>
                      <input
                        {...props}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0.00"
                        class="input input-sm input-bordered"
                        value={field.value}
                      />
                      {field.error && (
                        <label class="label py-1">
                          <span class="label-text-alt text-error text-xs">{field.error}</span>
                        </label>
                      )}
                    </div>
                  )}
                </Field>
              </div>

              <Field name="booking_type" type="string">
                {(field, props) => (
                  <div class="form-control mb-4">
                    <label class="label py-1">
                      <span class="label-text text-sm">Booking Type</span>
                      <span class="label-text-alt text-xs text-base-content/50">Optional</span>
                    </label>
                    <input
                      {...props}
                      type="text"
                      placeholder="Leave empty to apply to all bookings"
                      class="input input-sm input-bordered"
                      value={field.value}
                    />
                    {field.error && (
                      <label class="label py-1">
                        <span class="label-text-alt text-error text-xs">{field.error}</span>
                      </label>
                    )}
                  </div>
                )}
              </Field>

              {isEditing.value && (
                <Field name="is_active" type="boolean">
                  {(field, props) => (
                    <div class="form-control mb-4">
                      <label class="label cursor-pointer justify-start gap-3">
                        <input
                          {...props}
                          type="checkbox"
                          class="toggle toggle-sm toggle-success"
                          checked={field.value}
                        />
                        <span class="label-text text-sm">Active</span>
                      </label>
                    </div>
                  )}
                </Field>
              )}

              <div class="modal-action">
                <button type="button" class="btn btn-ghost btn-sm" onClick$={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary btn-sm"
                  disabled={taxFormStore.submitting}
                >
                  {taxFormStore.submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </TaxForm>
          </div>
          <div class="modal-backdrop bg-base-300/50" onClick$={closeModal}></div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.value && ruleToDelete.value && (
        <div class="modal modal-open">
          <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-2">Delete Tax Rule</h3>
            <p class="text-base-content/70 mb-4">
              Are you sure you want to delete <strong>{ruleToDelete.value.name}</strong>? This action cannot be undone.
            </p>
            <div class="modal-action">
              <button type="button" class="btn btn-ghost btn-sm" onClick$={closeDeleteConfirm}>
                Cancel
              </button>
              <Form action={deleteAction} onSubmitCompleted$={closeDeleteConfirm}>
                <input type="hidden" name="id" value={ruleToDelete.value.id} />
                <button type="submit" class="btn btn-error btn-sm">
                  Delete
                </button>
              </Form>
            </div>
          </div>
          <div class="modal-backdrop bg-base-300/50" onClick$={closeDeleteConfirm}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Tax Rules | Admin | Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage tax configurations for bookings",
    },
  ],
};
