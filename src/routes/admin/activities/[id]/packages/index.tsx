import { component$, useSignal, useStore, $, type QRL } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, routeAction$, Form, Link } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";

// Updated interface to match the specified structure
interface PricingTier {
  tierName: string;
  description: string;
  price: number;
  currency: string;
  originalPrice?: number;
}

interface BookingOptions {
  requiresTimeSlot: boolean;
  advanceBookingDays: number;
  maxBookingsPerDay?: number;
  allowSameDayBooking: boolean;
  timeSlots?: string[];
}

interface ActivityPackage {
  id?: string;
  packageId: string;
  activity_id: string;
  title: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  cancellationPolicy: string;
  status: 'AVAILABLE' | 'SOLD_OUT' | 'UNAVAILABLE';
  pricingTiers: PricingTier[];
  bookingOptions: BookingOptions;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to transform backend package format to frontend format
const transformPackageFromBackend = (backendPkg: any): ActivityPackage => {
  const optionsConfig = backendPkg.options_config || {};

  return {
    id: backendPkg.id,
    packageId: backendPkg.name_internal || backendPkg.id,
    activity_id: backendPkg.activity_id,
    title: optionsConfig.title || '',
    description: optionsConfig.description || '',
    inclusions: optionsConfig.inclusions || [],
    exclusions: optionsConfig.exclusions || [],
    cancellationPolicy: optionsConfig.cancellationPolicy || '',
    status: optionsConfig.status || 'AVAILABLE',
    pricingTiers: optionsConfig.pricingTiers || [],
    bookingOptions: optionsConfig.bookingOptions || {
      requiresTimeSlot: false,
      advanceBookingDays: 1,
      maxBookingsPerDay: undefined,
      allowSameDayBooking: true,
      timeSlots: []
    },
    createdAt: backendPkg.created_at,
    updatedAt: backendPkg.updated_at
  };
};

export const useActivityPackages = routeLoader$(async (requestEvent) => {
  const activityId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    // Fetch activity details
    const activityResponse = await apiClient.activities.getById(activityId);

    if (!activityResponse.success || !activityResponse.data) {
      return activityResponse;
    }

    const activity = activityResponse.data;

    // Fetch packages
    const packagesResponse = await apiClient.activities.packages.list(activityId, token);
    const backendPackages = packagesResponse.success ? packagesResponse.data : [];

    // Transform backend packages to frontend format
    const packages = backendPackages.map(transformPackageFromBackend);

    return {
      success: true,
      data: {
        activity,
        packages: packages || []
      }
    };
  });
});

export const useSavePackage = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const activityId = requestEvent.params.id;
      const packageId = data.package_id as string | undefined;

      // Prepare the options config with all the package details
      const optionsConfig = {
        title: data.title as string,
        description: data.description as string,
        inclusions: data.inclusions ? JSON.parse(data.inclusions as string) : [],
        exclusions: data.exclusions ? JSON.parse(data.exclusions as string) : [],
        cancellationPolicy: data.cancellationPolicy as string,
        status: (data.status as any) || 'AVAILABLE',
        pricingTiers: data.pricingTiers ? JSON.parse(data.pricingTiers as string) : [],
        bookingOptions: {
          requiresTimeSlot: data.requiresTimeSlot === "true",
          advanceBookingDays: parseInt(data.advanceBookingDays as string) || 1,
          maxBookingsPerDay: data.maxBookingsPerDay ? parseInt(data.maxBookingsPerDay as string) : undefined,
          allowSameDayBooking: data.allowSameDayBooking === "true",
          timeSlots: data.timeSlots ? JSON.parse(data.timeSlots as string) : []
        }
      };

      const packageData = {
        activity_id: activityId,
        name_internal: data.packageId as string || crypto.randomUUID(),
        booking_type: data.bookingType as string || "open_date",
        options_config: optionsConfig,
        sort_order: 0
      };

      let response;
      if (packageId) {
        // Update existing package
        response = await apiClient.activities.packages.update(activityId, packageId, packageData, token);
      } else {
        // Create new package
        response = await apiClient.activities.packages.create(activityId, packageData, token);
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

    const response = await apiClient.activities.packages.delete(activityId, packageId, token);

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

  // Form state
  const formData = useStore<Partial<ActivityPackage> & { bookingType?: string }>({
    packageId: '',
    title: '',
    description: '',
    inclusions: [],
    exclusions: [],
    cancellationPolicy: '',
    status: 'AVAILABLE',
    bookingType: 'open_date',
    pricingTiers: [],
    bookingOptions: {
      requiresTimeSlot: false,
      advanceBookingDays: 1,
      maxBookingsPerDay: undefined,
      allowSameDayBooking: true,
      timeSlots: []
    }
  });

  const resetForm = $(() => {
    formData.packageId = '';
    formData.title = '';
    formData.description = '';
    formData.inclusions = [];
    formData.exclusions = [];
    formData.cancellationPolicy = '';
    formData.status = 'AVAILABLE';
    formData.bookingType = 'open_date';
    formData.pricingTiers = [];
    formData.bookingOptions = {
      requiresTimeSlot: false,
      advanceBookingDays: 1,
      maxBookingsPerDay: undefined,
      allowSameDayBooking: true,
      timeSlots: []
    };
  });

  const editPackage = $((pkg: ActivityPackage) => {
    Object.assign(formData, pkg);
    editingPackage.value = pkg;
    showForm.value = true;
  });

  const addListItem = $((field: 'inclusions' | 'exclusions', value: string) => {
    if (value.trim()) {
      const list = formData[field] as string[];
      list.push(value.trim());
    }
  });

  const removeListItem = $((field: 'inclusions' | 'exclusions', index: number) => {
    const list = formData[field] as string[];
    list.splice(index, 1);
  });

  const addPricingTier = $(() => {
    formData.pricingTiers!.push({
      tierName: '',
      description: '',
      price: 0,
      currency: 'USD',
      originalPrice: undefined
    });
  });

  const removePricingTier = $((index: number) => {
    formData.pricingTiers!.splice(index, 1);
  });

  const addTimeSlot = $((value: string) => {
    if (value.trim() && !formData.bookingOptions!.timeSlots!.includes(value.trim())) {
      formData.bookingOptions!.timeSlots!.push(value.trim());
    }
  });

  const removeTimeSlot = $((index: number) => {
    formData.bookingOptions!.timeSlots!.splice(index, 1);
  });

  if (!data.value.success || !data.value.data) {
    return (
      <div class="text-center py-12">
        <h1 class="text-2xl font-bold mb-4">Activity Not Found</h1>
        <Link href="/admin/activities" class="btn btn-primary">Back to Activities</Link>
      </div>
    );
  }

  const { activity, packages } = data.value.data;
  const activityTitle = activity.translations?.en?.title || activity.seo_metadata?.title || activity.slug;

  return (
    <div>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <div class="breadcrumbs text-sm">
            <ul>
              <li><Link href="/admin/activities">Activities</Link></li>
              <li><Link href={`/admin/activities/${activity.id}`}>{activityTitle}</Link></li>
              <li>Packages</li>
            </ul>
          </div>
          <h1 class="text-2xl font-bold">Activity Packages</h1>
          <p class="text-sm text-base-content/70 mt-1">
            Create different package options with various inclusions and pricing.
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
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

      {/* Packages List */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {packages.map((pkg: ActivityPackage) => (
          <div key={pkg.id} class="card bg-base-100 shadow-md">
            <div class="card-body">
              <div class="flex justify-between items-start mb-2">
                <h3 class="card-title text-lg">{pkg.title}</h3>
                <div class="dropdown dropdown-end">
                  <div tabIndex={0} role="button" class="btn btn-ghost btn-sm">⋮</div>
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

              <p class="text-sm text-base-content/70 mb-3">{pkg.description}</p>

              <div class="flex items-center justify-between mb-4">
                <div>
                  {pkg.pricingTiers && pkg.pricingTiers.length > 0 && (
                    <div class="text-2xl font-bold text-primary">
                      ${pkg.pricingTiers[0].price} {pkg.pricingTiers[0].currency}
                      {pkg.pricingTiers.length > 1 && <span class="text-sm text-base-content/70"> +{pkg.pricingTiers.length - 1} more</span>}
                    </div>
                  )}
                  <div class="text-xs text-base-content/60">Package ID: {pkg.packageId}</div>
                </div>
                <div class="flex gap-2">
                  <div class={`badge ${
                    pkg.status === 'AVAILABLE' ? 'badge-success' : 
                    pkg.status === 'SOLD_OUT' ? 'badge-warning' : 
                    'badge-error'
                  }`}>
                    {pkg.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Advance Booking:</span>
                  <span>{pkg.bookingOptions.advanceBookingDays} days</span>
                </div>
                <div class="flex justify-between">
                  <span>Same Day Booking:</span>
                  <span>{pkg.bookingOptions.allowSameDayBooking ? 'Yes' : 'No'}</span>
                </div>
                {pkg.bookingOptions.requiresTimeSlot && (
                  <div class="flex justify-between">
                    <span>Time Slots:</span>
                    <span>{pkg.bookingOptions.timeSlots?.length || 0} slots</span>
                  </div>
                )}
              </div>

              {pkg.inclusions && pkg.inclusions.length > 0 && (
                <div class="mt-3">
                  <div class="text-sm font-medium mb-1">Included:</div>
                  <ul class="text-xs text-base-content/70 list-disc list-inside">
                    {pkg.inclusions.slice(0, 3).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {pkg.inclusions.length > 3 && (
                      <li>+{pkg.inclusions.length - 3} more...</li>
                    )}
                  </ul>
                </div>
              )}
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
                      <span class="label-text">Package ID *</span>
                    </label>
                    <input
                      type="text"
                      name="packageId"
                      class="input input-bordered"
                      value={formData.packageId}
                      onInput$={(e) => formData.packageId = (e.target as HTMLInputElement).value}
                      placeholder="e.g., PKG-001, BASIC, PREMIUM"
                      required
                    />
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Package Title *</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      class="input input-bordered"
                      value={formData.title}
                      onInput$={(e) => formData.title = (e.target as HTMLInputElement).value}
                      required
                    />
                  </div>

                  <div class="form-control md:col-span-2">
                    <label class="label">
                      <span class="label-text">Description</span>
                    </label>
                    <textarea
                      name="description"
                      class="textarea textarea-bordered h-20"
                      value={formData.description}
                      onInput$={(e) => formData.description = (e.target as HTMLTextAreaElement).value}
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Package Status */}
              <div class="space-y-4">
                <h4 class="font-semibold">Package Status</h4>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Status</span>
                  </label>
                  <select
                    name="status"
                    class="select select-bordered"
                    value={formData.status}
                    onChange$={(e) => formData.status = (e.target as HTMLSelectElement).value as 'AVAILABLE' | 'SOLD_OUT' | 'UNAVAILABLE'}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="SOLD_OUT">Sold Out</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
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
                  {formData.pricingTiers!.map((tier, index) => (
                    <div key={index} class="card bg-base-200">
                      <div class="card-body">
                        <div class="flex justify-between items-center mb-4">
                          <h5 class="font-medium">Tier {index + 1}</h5>
                          <button
                            type="button"
                            class="btn btn-sm btn-error"
                            onClick$={() => removePricingTier(index)}
                          >
                            Remove
                          </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Tier Name</span>
                            </label>
                            <input
                              type="text"
                              class="input input-bordered input-sm"
                              value={tier.tierName}
                              onInput$={(e) => formData.pricingTiers![index].tierName = (e.target as HTMLInputElement).value}
                              placeholder="e.g., Adult, Child, Senior"
                            />
                          </div>
                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Price</span>
                            </label>
                            <div class="input-group">
                              <input
                                type="number"
                                class="input input-bordered input-sm flex-1"
                                value={tier.price}
                                onInput$={(e) => formData.pricingTiers![index].price = parseFloat((e.target as HTMLInputElement).value) || 0}
                                min="0"
                                step="0.01"
                              />
                              <select
                                class="select select-bordered select-sm"
                                value={tier.currency}
                                onChange$={(e) => formData.pricingTiers![index].currency = (e.target as HTMLSelectElement).value}
                              >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="MVR">MVR</option>
                              </select>
                            </div>
                          </div>
                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Original Price (optional)</span>
                            </label>
                            <input
                              type="number"
                              class="input input-bordered input-sm"
                              value={tier.originalPrice || ''}
                              onInput$={(e) => formData.pricingTiers![index].originalPrice = (e.target as HTMLInputElement).value ? parseFloat((e.target as HTMLInputElement).value) : undefined}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div class="form-control">
                            <label class="label">
                              <span class="label-text">Description</span>
                            </label>
                            <input
                              type="text"
                              class="input input-bordered input-sm"
                              value={tier.description}
                              onInput$={(e) => formData.pricingTiers![index].description = (e.target as HTMLInputElement).value}
                              placeholder="Brief description of this tier"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {formData.pricingTiers!.length === 0 && (
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

              {/* Booking Options */}
              <div class="space-y-4">
                <h4 class="font-semibold">Booking Options</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Advance Booking Days</span>
                    </label>
                    <input
                      type="number"
                      name="advanceBookingDays"
                      class="input input-bordered"
                      value={formData.bookingOptions?.advanceBookingDays}
                      onInput$={(e) => formData.bookingOptions!.advanceBookingDays = parseInt((e.target as HTMLInputElement).value) || 1}
                      min="0"
                    />
                  </div>
                  
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Max Bookings Per Day (optional)</span>
                    </label>
                    <input
                      type="number"
                      name="maxBookingsPerDay"
                      class="input input-bordered"
                      value={formData.bookingOptions?.maxBookingsPerDay || ''}
                      onInput$={(e) => formData.bookingOptions!.maxBookingsPerDay = (e.target as HTMLInputElement).value ? parseInt((e.target as HTMLInputElement).value) : undefined}
                      min="1"
                    />
                  </div>
                </div>

                <div class="flex gap-4">
                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        name="requiresTimeSlot"
                        class="checkbox"
                        checked={formData.bookingOptions?.requiresTimeSlot}
                        onChange$={(e) => formData.bookingOptions!.requiresTimeSlot = (e.target as HTMLInputElement).checked}
                      />
                      <span class="label-text">Requires Time Slot</span>
                    </label>
                  </div>

                  <div class="form-control">
                    <label class="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        name="allowSameDayBooking"
                        class="checkbox"
                        checked={formData.bookingOptions?.allowSameDayBooking}
                        onChange$={(e) => formData.bookingOptions!.allowSameDayBooking = (e.target as HTMLInputElement).checked}
                      />
                      <span class="label-text">Allow Same Day Booking</span>
                    </label>
                  </div>
                </div>

                {formData.bookingOptions?.requiresTimeSlot && (
                  <TimeSlotManager
                    timeSlots={formData.bookingOptions.timeSlots!}
                    onAdd={addTimeSlot}
                    onRemove={removeTimeSlot}
                  />
                )}
              </div>

              {/* Lists: Inclusions, Exclusions */}
              <PackageListBuilder
                title="What's Included"
                items={formData.inclusions!}
                fieldName="inclusions"
                onAdd={addListItem}
                onRemove={removeListItem}
              />

              <PackageListBuilder
                title="What's Excluded"
                items={formData.exclusions!}
                fieldName="exclusions"
                onAdd={addListItem}
                onRemove={removeListItem}
              />

              {/* Cancellation Policy */}
              <div class="space-y-4">
                <h4 class="font-semibold">Cancellation Policy</h4>
                <div class="form-control">
                  <textarea
                    name="cancellationPolicy"
                    class="textarea textarea-bordered h-24"
                    value={formData.cancellationPolicy}
                    onInput$={(e) => formData.cancellationPolicy = (e.target as HTMLTextAreaElement).value}
                    placeholder="Describe the cancellation policy for this package..."
                  ></textarea>
                </div>
              </div>

              {/* Hidden fields for complex data */}
              <input type="hidden" name="bookingType" value={formData.bookingType || 'open_date'} />
              <input type="hidden" name="inclusions" value={JSON.stringify(formData.inclusions)} />
              <input type="hidden" name="exclusions" value={JSON.stringify(formData.exclusions)} />
              <input type="hidden" name="pricingTiers" value={JSON.stringify(formData.pricingTiers)} />
              <input type="hidden" name="timeSlots" value={JSON.stringify(formData.bookingOptions?.timeSlots)} />

              <div class="modal-action">
                <button type="button" class="btn" onClick$={() => showForm.value = false}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  {editingPackage.value ? 'Update Package' : 'Create Package'}
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

      {/* Success/Error Messages */}
      {savePackage.value?.success && (
        <div class="toast toast-end">
          <div class="alert alert-success">
            <span>{savePackage.value.message}</span>
          </div>
        </div>
      )}
    </div>
  );
});

const PackageListBuilder = component$<{
  title: string;
  items: string[];
  fieldName: 'inclusions' | 'exclusions';
  onAdd: QRL<(field: 'inclusions' | 'exclusions', value: string) => void>;
  onRemove: QRL<(field: 'inclusions' | 'exclusions', index: number) => void>;
}>(({ title, items, fieldName, onAdd, onRemove }) => {
  const newItem = useSignal('');

  return (
    <div class="space-y-4">
      <h4 class="font-semibold">{title}</h4>
      <div class="space-y-2">
        {items.map((item, index) => (
          <div key={index} class="flex items-center gap-2">
            <input
              type="text"
              class="input input-bordered input-sm flex-1"
              value={item}
              onInput$={(e) => items[index] = (e.target as HTMLInputElement).value}
            />
            <button
              type="button"
              class="btn btn-ghost btn-sm text-error"
              onClick$={() => onRemove(fieldName, index)}
            >
              ✕
            </button>
          </div>
        ))}
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="input input-bordered input-sm flex-1"
            placeholder={`Add ${title.toLowerCase().replace("what's ", "")} item...`}
            value={newItem.value}
            onInput$={(e) => newItem.value = (e.target as HTMLInputElement).value}
            onKeyPress$={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAdd(fieldName, newItem.value);
                newItem.value = '';
              }
            }}
          />
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            onClick$={() => {
              onAdd(fieldName, newItem.value);
              newItem.value = '';
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

const TimeSlotManager = component$<{
  timeSlots: string[];
  onAdd: QRL<(value: string) => void>;
  onRemove: QRL<(index: number) => void>;
}>(({ timeSlots, onAdd, onRemove }) => {
  const newTimeSlot = useSignal('');

  return (
    <div class="space-y-4">
      <h5 class="font-medium">Available Time Slots</h5>
      <div class="space-y-2">
        {timeSlots.map((slot, index) => (
          <div key={index} class="flex items-center gap-2">
            <input
              type="text"
              class="input input-bordered input-sm flex-1"
              value={slot}
              onInput$={(e) => timeSlots[index] = (e.target as HTMLInputElement).value}
              placeholder="e.g., 09:00, 14:30, 18:00"
            />
            <button
              type="button"
              class="btn btn-ghost btn-sm text-error"
              onClick$={() => onRemove(index)}
            >
              ✕
            </button>
          </div>
        ))}
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="input input-bordered input-sm flex-1"
            placeholder="Add time slot (e.g., 09:00, 14:30)"
            value={newTimeSlot.value}
            onInput$={(e) => newTimeSlot.value = (e.target as HTMLInputElement).value}
            onKeyPress$={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAdd(newTimeSlot.value);
                newTimeSlot.value = '';
              }
            }}
          />
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            onClick$={() => {
              onAdd(newTimeSlot.value);
              newTimeSlot.value = '';
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Activity Packages • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Manage activity packages and pricing options",
    },
  ],
};