import { component$, useSignal, useStore, $, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, routeAction$, Form, Link } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";

// Updated interface to match the new API schema
interface PricingTier {
  name: string; // e.g., 'Adult', 'Child', 'Senior'
  price: number; // Always in USD (base currency)
}

// Options config matches the new API schema
interface OptionsConfig {
  // Tour/Activity options
  duration?: number; // Duration in minutes
  min_pax?: number; // Minimum participants
  max_pax?: number; // Maximum participants
  meeting_point?: string; // Meeting point location
  pickup_included?: boolean; // Whether pickup is included
  start_time?: string; // Default start time (e.g., '09:00')

  // eSIM specific
  data_limit?: string; // For eSIM: data limit (e.g., '5GB')
  validity_days?: number; // For eSIM: number of valid days

  // Pricing
  pricingTiers?: PricingTier[];

  // Custom fields
  custom?: Record<string, unknown>;
}

type BookingType = 'fixed_date' | 'open_date' | 'instant_confirmation';

interface ActivityPackage {
  id?: string;
  activity_id: string;
  name_internal: string; // Internal package name for admin identification
  booking_type: BookingType;
  options_config: OptionsConfig;
  sort_order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Helper function to transform backend package format to frontend format
const transformPackageFromBackend = (backendPkg: any): ActivityPackage => {
  return {
    id: backendPkg.id,
    activity_id: backendPkg.activity_id,
    name_internal: backendPkg.name_internal || '',
    booking_type: backendPkg.booking_type || 'open_date',
    options_config: backendPkg.options_config || {},
    sort_order: backendPkg.sort_order || 0,
    is_active: backendPkg.is_active,
    created_at: backendPkg.created_at,
    updated_at: backendPkg.updated_at
  };
};

export const useActivityPackages = routeLoader$(async (requestEvent) => {
  const activityId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const activityResponse = await apiClient.vendorPortal.getActivityById(activityId, token);

    if (!activityResponse.success || !activityResponse.data) {
      return { success: false, error: 'Activity not found', data: null };
    }

    const activity = activityResponse.data;

    const packagesResponse = await apiClient.vendorPortal.getActivityPackages(activityId, token);
    const backendPackages = packagesResponse.success ? (packagesResponse.data || []) : [];

    const packages = Array.isArray(backendPackages) ? backendPackages.map(transformPackageFromBackend) : [];

    return {
      success: true,
      data: {
        activity,
        packages
      }
    };
  });
});

export const useSavePackage = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const activityId = requestEvent.params.id;
      const packageId = data.package_id as string | undefined;

      // Parse pricing tiers from JSON string
      const pricingTiers = data.pricingTiers ? JSON.parse(data.pricingTiers as string) : [];

      // Build options_config matching the new API schema
      const optionsConfig: OptionsConfig = {
        // Tour/Activity options
        duration: data.duration ? parseInt(data.duration as string) : undefined,
        min_pax: data.min_pax ? parseInt(data.min_pax as string) : undefined,
        max_pax: data.max_pax ? parseInt(data.max_pax as string) : undefined,
        meeting_point: (data.meeting_point as string) || undefined,
        pickup_included: data.pickup_included === "true",
        start_time: (data.start_time as string) || undefined,

        // eSIM specific
        data_limit: (data.data_limit as string) || undefined,
        validity_days: data.validity_days ? parseInt(data.validity_days as string) : undefined,

        // Pricing
        pricingTiers: pricingTiers,
      };

      // Remove undefined values
      Object.keys(optionsConfig).forEach(key => {
        if (optionsConfig[key as keyof OptionsConfig] === undefined) {
          delete optionsConfig[key as keyof OptionsConfig];
        }
      });

      const packageData = {
        name_internal: data.name_internal as string,
        booking_type: (data.booking_type as string) || "open_date",
        options_config: optionsConfig,
        sort_order: data.sort_order ? parseInt(data.sort_order as string) : 0
      };

      let response;
      if (packageId) {
        response = await apiClient.vendorPortal.updateActivityPackage(activityId, packageId, packageData, token);
      } else {
        response = await apiClient.vendorPortal.createActivityPackage(activityId, packageData, token);
      }

      return {
        success: response.success,
        message: response.success
          ? (packageId ? "Package updated successfully" : "Package created successfully")
          : response.error_message || "Failed to save package"
      };
    } catch (error) {
      console.error("Error saving package:", error);
      return {
        success: false,
        message: "Failed to save package"
      };
    }
  });
});

export const useDeletePackage = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const activityId = requestEvent.params.id;
    const packageId = data.id as string;

    const response = await apiClient.vendorPortal.deleteActivityPackage(activityId, packageId, token);

    return {
      success: response.success,
      message: response.success
        ? "Package deleted successfully"
        : response.error_message || "Failed to delete package"
    };
  });
});

export default component$(() => {
  const data = useActivityPackages();
  const savePackage = useSavePackage();
  const deletePackage = useDeletePackage();
  const showForm = useSignal(false);
  const editingPackage = useSignal<ActivityPackage | null>(null);
  const showDeleteModal = useSignal(false);
  const packageToDelete = useSignal<string | null>(null);

  // Form state matching new API schema
  const formData = useStore<{
    name_internal: string;
    booking_type: BookingType;
    sort_order: number;
    options_config: OptionsConfig;
  }>({
    name_internal: '',
    booking_type: 'open_date',
    sort_order: 0,
    options_config: {
      duration: undefined,
      min_pax: undefined,
      max_pax: undefined,
      meeting_point: '',
      pickup_included: false,
      start_time: '',
      data_limit: '',
      validity_days: undefined,
      pricingTiers: []
    }
  });

  const resetForm = $(() => {
    formData.name_internal = '';
    formData.booking_type = 'open_date';
    formData.sort_order = 0;
    formData.options_config = {
      duration: undefined,
      min_pax: undefined,
      max_pax: undefined,
      meeting_point: '',
      pickup_included: false,
      start_time: '',
      data_limit: '',
      validity_days: undefined,
      pricingTiers: []
    };
  });

  const editPackage = $((pkg: ActivityPackage) => {
    formData.name_internal = pkg.name_internal;
    formData.booking_type = pkg.booking_type;
    formData.sort_order = pkg.sort_order;
    formData.options_config = {
      ...pkg.options_config,
      pricingTiers: pkg.options_config.pricingTiers || []
    };
    editingPackage.value = pkg;
    showForm.value = true;
  });

  const addPricingTier = $(() => {
    formData.options_config.pricingTiers!.push({
      name: '',
      price: 0
    });
  });

  const removePricingTier = $((index: number) => {
    formData.options_config.pricingTiers!.splice(index, 1);
  });

  // Close modal on successful save
  useTask$(({ track }) => {
    track(() => savePackage.value);
    if (savePackage.value?.success) {
      showForm.value = false;
      editingPackage.value = null;
    }
  });

  if (!data.value.success || !data.value.data) {
    return (
      <div class="text-center py-12">
        <div class="text-6xl mb-4">🏝️</div>
        <h1 class="text-2xl font-bold mb-4">Activity Not Found</h1>
        <p class="text-base-content/70 mb-6">The activity you are looking for does not exist.</p>
        <Link href="/vendor/activities" class="btn btn-primary">Back to Activities</Link>
      </div>
    );
  }

  const { activity, packages } = data.value.data;
  const activityTitle = activity.translations?.en?.title || activity.seo_metadata?.title || activity.slug;

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="breadcrumbs text-sm">
            <ul>
              <li><Link href="/vendor/activities">Activities</Link></li>
              <li><Link href={`/vendor/activities/${activity.id}`}>{activityTitle}</Link></li>
              <li>Packages</li>
            </ul>
          </div>
          <h1 class="text-2xl font-bold">Activity Packages</h1>
          <p class="text-sm text-base-content/70 mt-1">
            Create different package options with various inclusions and pricing
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-primary"
            onClick$={() => {
              resetForm();
              editingPackage.value = null;
              showForm.value = true;
            }}
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Package
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {savePackage.value?.message && (
        <div class={`alert ${savePackage.value.success ? 'alert-success' : 'alert-error'}`}>
          <span>{savePackage.value.message}</span>
        </div>
      )}
      {deletePackage.value?.message && (
        <div class={`alert ${deletePackage.value.success ? 'alert-success' : 'alert-error'}`}>
          <span>{deletePackage.value.message}</span>
        </div>
      )}

      {/* Packages Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg: ActivityPackage) => (
          <div key={pkg.id} class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div class="card-body">
              <div class="flex justify-between items-start mb-2">
                <h3 class="card-title text-lg">{pkg.name_internal}</h3>
                <div class="dropdown dropdown-end">
                  <div tabIndex={0} role="button" class="btn btn-ghost btn-sm">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </div>
                  <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32">
                    <li><button type="button" onClick$={() => editPackage(pkg)}>Edit</button></li>
                    <li>
                      <button
                        type="button"
                        class="text-error"
                        onClick$={() => {
                          packageToDelete.value = pkg.id!;
                          showDeleteModal.value = true;
                        }}
                      >
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="flex items-center justify-between mb-4">
                <div>
                  {pkg.options_config.pricingTiers && pkg.options_config.pricingTiers.length > 0 && (
                    <div class="text-2xl font-bold text-primary">
                      ${pkg.options_config.pricingTiers[0].price.toFixed(2)}
                      <span class="text-sm font-normal text-base-content/70"> USD</span>
                      {pkg.options_config.pricingTiers.length > 1 && <span class="text-sm text-base-content/70"> +{pkg.options_config.pricingTiers.length - 1} more</span>}
                    </div>
                  )}
                </div>
                <div class="flex gap-2">
                  <div class={`badge ${pkg.is_active !== false ? 'badge-success' : 'badge-error'}`}>
                    {pkg.is_active !== false ? 'Active' : 'Inactive'}
                  </div>
                  <div class="badge badge-outline">
                    {pkg.booking_type.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div class="space-y-2 text-sm">
                {pkg.options_config.duration && (
                  <div class="flex justify-between">
                    <span>Duration:</span>
                    <span>{pkg.options_config.duration} min</span>
                  </div>
                )}
                {(pkg.options_config.min_pax || pkg.options_config.max_pax) && (
                  <div class="flex justify-between">
                    <span>Participants:</span>
                    <span>
                      {pkg.options_config.min_pax || 1} - {pkg.options_config.max_pax || 'unlimited'}
                    </span>
                  </div>
                )}
                {pkg.options_config.start_time && (
                  <div class="flex justify-between">
                    <span>Start Time:</span>
                    <span>{pkg.options_config.start_time}</span>
                  </div>
                )}
                {pkg.options_config.pickup_included && (
                  <div class="flex justify-between">
                    <span>Pickup:</span>
                    <span>Included</span>
                  </div>
                )}
                {pkg.options_config.meeting_point && (
                  <div class="flex justify-between">
                    <span>Meeting Point:</span>
                    <span class="truncate max-w-[150px]">{pkg.options_config.meeting_point}</span>
                  </div>
                )}
              </div>

              {pkg.options_config.pricingTiers && pkg.options_config.pricingTiers.length > 0 && (
                <div class="mt-3">
                  <div class="text-sm font-medium mb-1">Pricing Tiers:</div>
                  <ul class="text-xs text-base-content/70">
                    {pkg.options_config.pricingTiers.slice(0, 3).map((tier, idx) => (
                      <li key={idx} class="flex justify-between">
                        <span>{tier.name}</span>
                        <span>${tier.price.toFixed(2)}</span>
                      </li>
                    ))}
                    {pkg.options_config.pricingTiers.length > 3 && (
                      <li>+{pkg.options_config.pricingTiers.length - 3} more...</li>
                    )}
                  </ul>
                </div>
              )}

              <div class="card-actions justify-end mt-4 pt-4 border-t border-base-200">
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  onClick$={() => editPackage(pkg)}
                >
                  Edit Package
                </button>
              </div>
            </div>
          </div>
        ))}

        {packages.length === 0 && (
          <div class="col-span-full text-center py-12 border-2 border-dashed border-base-300 rounded-lg">
            <div class="text-6xl mb-4">📦</div>
            <h3 class="text-lg font-semibold mb-2">No packages created</h3>
            <p class="text-base-content/70 mb-4">Start by creating your first activity package.</p>
            <button
              type="button"
              class="btn btn-primary"
              onClick$={() => {
                resetForm();
                editingPackage.value = null;
                showForm.value = true;
              }}
            >
              Create Package
            </button>
          </div>
        )}
      </div>

      {/* Package Form Modal */}
      {showForm.value && (
        <div class="modal modal-open">
          <div class="modal-box w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 class="font-bold text-lg mb-4">
              {editingPackage.value ? 'Edit Package' : 'Create New Package'}
            </h3>

            <Form action={savePackage} class="space-y-6">
              {editingPackage.value?.id && (
                <input type="hidden" name="package_id" value={editingPackage.value.id} />
              )}

              {/* Basic Information */}
              <div class="space-y-4">
                <h4 class="font-semibold">Basic Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Package Name *</span>
                    </label>
                    <input
                      type="text"
                      name="name_internal"
                      class="input input-bordered"
                      value={formData.name_internal}
                      onInput$={(e) => formData.name_internal = (e.target as HTMLInputElement).value}
                      placeholder="e.g., Premium Snorkeling Package"
                      required
                    />
                    <label class="label">
                      <span class="label-text-alt text-base-content/50">Internal name for identification</span>
                    </label>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Booking Type *</span>
                    </label>
                    <select
                      name="booking_type"
                      class="select select-bordered"
                      value={formData.booking_type}
                      onChange$={(e) => formData.booking_type = (e.target as HTMLSelectElement).value as BookingType}
                    >
                      <option value="open_date">Open Date (Flexible dates)</option>
                      <option value="fixed_date">Fixed Date (Specific date required)</option>
                      <option value="instant_confirmation">Instant Confirmation</option>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Sort Order</span>
                    </label>
                    <input
                      type="number"
                      name="sort_order"
                      class="input input-bordered"
                      value={formData.sort_order}
                      onInput$={(e) => formData.sort_order = parseInt((e.target as HTMLInputElement).value) || 0}
                      min="0"
                    />
                    <label class="label">
                      <span class="label-text-alt text-base-content/50">Lower numbers appear first</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tour/Activity Options */}
              <div class="space-y-4">
                <h4 class="font-semibold">Tour/Activity Options</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Duration (minutes)</span>
                    </label>
                    <input
                      type="number"
                      name="duration"
                      class="input input-bordered"
                      value={formData.options_config.duration || ''}
                      onInput$={(e) => formData.options_config.duration = (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined}
                      min="0"
                      placeholder="e.g., 180"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Min Participants</span>
                    </label>
                    <input
                      type="number"
                      name="min_pax"
                      class="input input-bordered"
                      value={formData.options_config.min_pax || ''}
                      onInput$={(e) => formData.options_config.min_pax = (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined}
                      min="1"
                      placeholder="e.g., 2"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Max Participants</span>
                    </label>
                    <input
                      type="number"
                      name="max_pax"
                      class="input input-bordered"
                      value={formData.options_config.max_pax || ''}
                      onInput$={(e) => formData.options_config.max_pax = (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined}
                      min="1"
                      placeholder="e.g., 10"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Start Time</span>
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      class="input input-bordered"
                      value={formData.options_config.start_time || ''}
                      onInput$={(e) => formData.options_config.start_time = (e.target as HTMLInputElement).value}
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Meeting Point</span>
                    </label>
                    <input
                      type="text"
                      name="meeting_point"
                      class="input input-bordered"
                      value={formData.options_config.meeting_point || ''}
                      onInput$={(e) => formData.options_config.meeting_point = (e.target as HTMLInputElement).value}
                      placeholder="e.g., Hotel lobby"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        name="pickup_included"
                        class="checkbox"
                        checked={formData.options_config.pickup_included || false}
                        onChange$={(e) => formData.options_config.pickup_included = (e.target as HTMLInputElement).checked}
                      />
                      <span class="label-text">Pickup Included</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* eSIM Options (conditional) */}
              <div class="space-y-4">
                <h4 class="font-semibold">eSIM Options (if applicable)</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Data Limit</span>
                    </label>
                    <input
                      type="text"
                      name="data_limit"
                      class="input input-bordered"
                      value={formData.options_config.data_limit || ''}
                      onInput$={(e) => formData.options_config.data_limit = (e.target as HTMLInputElement).value}
                      placeholder="e.g., 5GB"
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Validity (days)</span>
                    </label>
                    <input
                      type="number"
                      name="validity_days"
                      class="input input-bordered"
                      value={formData.options_config.validity_days || ''}
                      onInput$={(e) => formData.options_config.validity_days = (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined}
                      min="1"
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Tiers */}
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <h4 class="font-semibold">Pricing Tiers</h4>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline"
                    onClick$={addPricingTier}
                  >
                    Add Tier
                  </button>
                </div>

                <div class="space-y-4">
                  {formData.options_config.pricingTiers!.map((tier, index) => (
                    <div key={index} class="card bg-base-200">
                      <div class="card-body py-4">
                        <div class="flex justify-between items-center mb-2">
                          <h5 class="font-medium">Tier {index + 1}</h5>
                          <button
                            type="button"
                            class="btn btn-sm btn-error btn-outline"
                            onClick$={() => removePricingTier(index)}
                          >
                            Remove
                          </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Name *</span>
                            </label>
                            <input
                              type="text"
                              class="input input-bordered input-sm"
                              value={tier.name}
                              onInput$={(e) => formData.options_config.pricingTiers![index].name = (e.target as HTMLInputElement).value}
                              placeholder="e.g., Adult, Child, Senior"
                            />
                          </div>
                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Price (USD) *</span>
                            </label>
                            <div class="join">
                              <span class="join-item bg-base-300 px-3 flex items-center text-sm">$</span>
                              <input
                                type="number"
                                class="input input-bordered input-sm join-item flex-1"
                                value={tier.price}
                                onInput$={(e) => formData.options_config.pricingTiers![index].price = parseFloat((e.target as HTMLInputElement).value) || 0}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                              />
                            </div>
                            <label class="label">
                              <span class="label-text-alt text-base-content/50">All prices stored in USD</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.options_config.pricingTiers!.length === 0 && (
                  <div class="text-center py-4 border-2 border-dashed border-base-300 rounded">
                    <p class="text-base-content/70">No pricing tiers added yet.</p>
                    <button
                      type="button"
                      class="btn btn-sm btn-primary mt-2"
                      onClick$={addPricingTier}
                    >
                      Add First Tier
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden fields for complex data */}
              <input type="hidden" name="pricingTiers" value={JSON.stringify(formData.options_config.pricingTiers)} />

              <div class="modal-action">
                <button type="button" class="btn" onClick$={() => showForm.value = false}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" disabled={savePackage.isRunning}>
                  {savePackage.isRunning ? (
                    <>
                      <span class="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    editingPackage.value ? 'Update Package' : 'Create Package'
                  )}
                </button>
              </div>
            </Form>
          </div>
          <div class="modal-backdrop" onClick$={() => showForm.value = false}></div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.value && (
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Delete Package</h3>
            <p class="py-4">Are you sure you want to delete this package? This action cannot be undone.</p>
            <div class="modal-action">
              <Form action={deletePackage}>
                <input type="hidden" name="id" value={packageToDelete.value || ''} />
                <button
                  type="submit"
                  class="btn btn-error"
                  onClick$={() => showDeleteModal.value = false}
                >
                  Delete
                </button>
              </Form>
              <button
                type="button"
                class="btn"
                onClick$={() => {
                  showDeleteModal.value = false;
                  packageToDelete.value = null;
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          <div class="modal-backdrop" onClick$={() => {
            showDeleteModal.value = false;
            packageToDelete.value = null;
          }}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Activity Packages • Vendor Portal • Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage activity packages and pricing options",
    },
  ],
};
