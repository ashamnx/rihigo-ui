import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form, Link, useNavigate } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { AddTravelerInput, ImugaDeclaration } from '~/types/imuga';
import {
  TRAVELER_TITLES,
  GENDERS,
  VISIT_PURPOSES,
  COUNTRIES,
  CURRENCIES,
} from '~/types/imuga';

export const useDeclaration = routeLoader$(async (requestEvent) => {
  const declarationId = requestEvent.params.id;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.imugaDeclarations.getById(declarationId, token);
  });

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error_message || 'Declaration not found',
      declaration: null,
    };
  }

  return {
    success: true,
    error: null,
    declaration: response.data as ImugaDeclaration,
  };
});

export const useAddTraveler = routeAction$(async (data, requestEvent) => {
  const declarationId = requestEvent.params.id;

  const travelerData: AddTravelerInput = {
    // Personal Info
    title: data.title as AddTravelerInput['title'],
    first_name: data.first_name as string,
    middle_name: (data.middle_name as string) || undefined,
    last_name: data.last_name as string,
    gender: data.gender as AddTravelerInput['gender'],
    date_of_birth: data.date_of_birth as string,
    place_of_birth: data.place_of_birth as string,
    nationality: data.nationality as string,
    country_of_residence: data.country_of_residence as string,

    // Passport Info
    passport_number: data.passport_number as string,
    passport_issue_date: data.passport_issue_date as string,
    passport_expiry_date: data.passport_expiry_date as string,
    passport_issuing_country: data.passport_issuing_country as string,

    // Contact Info
    email: data.email as string,
    phone: data.phone as string,
    phone_country_code: data.phone_country_code as string,

    // Address
    permanent_address_line1: data.permanent_address_line1 as string,
    permanent_address_line2: (data.permanent_address_line2 as string) || undefined,
    permanent_address_city: data.permanent_address_city as string,
    permanent_address_state: (data.permanent_address_state as string) || undefined,
    permanent_address_postal_code: (data.permanent_address_postal_code as string) || undefined,
    permanent_address_country: data.permanent_address_country as string,

    // Visit Info
    visit_purpose: data.visit_purpose as AddTravelerInput['visit_purpose'],
    visit_purpose_other: (data.visit_purpose_other as string) || undefined,

    // Health Info
    yellow_fever_endemic_travel: data.yellow_fever_endemic_travel === 'true',
    vaccination_date: (data.vaccination_date as string) || undefined,
    health_notes: (data.health_notes as string) || undefined,

    // Customs Info
    customs_items_to_declare: data.customs_items_to_declare === 'true',
    declaration_details: (data.declaration_details as string) || undefined,
    currency_amount: data.currency_amount ? Number(data.currency_amount) : undefined,
    currency_type: (data.currency_type as string) || undefined,

    // Emergency Contact
    emergency_contact_name: data.emergency_contact_name as string,
    emergency_contact_phone: data.emergency_contact_phone as string,
    emergency_contact_relationship: data.emergency_contact_relationship as string,
  };

  return authenticatedRequest(requestEvent, async (token) => {
    const response = await apiClient.imugaTravelers.add(
      declarationId,
      travelerData,
      token
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: { traveler_id: response.data.id },
        message: 'Traveler added successfully',
      };
    }

    return {
      success: false,
      error_message: response.error_message || 'Failed to add traveler',
    };
  });
});

export default component$(() => {
  const declarationData = useDeclaration();
  const addAction = useAddTraveler();
  const navigate = useNavigate();

  // Redirect on success
  if (addAction.value?.success && declarationData.value.declaration) {
    navigate(`/admin/imuga/declarations/${declarationData.value.declaration.id}`);
  }

  // Error state - declaration not found
  if (!declarationData.value.success || !declarationData.value.declaration) {
    return (
      <div class="space-y-6">
        <Link
          href="/admin/imuga/declarations"
          class="btn btn-ghost btn-sm"
        >
          <svg
            class="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Declarations
        </Link>
        <div class="alert alert-error">
          <svg
            class="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <span>{declarationData.value.error}</span>
        </div>
      </div>
    );
  }

  const declaration = declarationData.value.declaration;

  return (
    <div class="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/admin/imuga/declarations/${declaration.id}`}
          class="btn btn-ghost btn-sm mb-4"
        >
          <svg
            class="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Declaration
        </Link>
        <h1 class="text-2xl font-bold">Add Traveler</h1>
        <p class="text-base-content/60 mt-1">
          Add a new traveler to <span class="font-mono">{declaration.declaration_number}</span>
        </p>
      </div>

      {/* Error Message */}
      {addAction.value?.success === false && (
        <div class="alert alert-error">
          <svg
            class="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <span>{addAction.value.error_message}</span>
        </div>
      )}

      <Form action={addAction}>
        {/* Personal Information */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Personal Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Title <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="title"
                class="select select-bordered w-full"
                required
              >
                {TRAVELER_TITLES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  First Name <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="first_name"
                class="input input-bordered w-full"
                placeholder="First name"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Middle Name</span>
              </label>
              <input
                type="text"
                name="middle_name"
                class="input input-bordered w-full"
                placeholder="Middle name"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Last Name <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="last_name"
                class="input input-bordered w-full"
                placeholder="Last name"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Gender <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="gender"
                class="select select-bordered w-full"
                required
              >
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Date of Birth <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Place of Birth <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="place_of_birth"
                class="input input-bordered w-full"
                placeholder="City, Country"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Nationality <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="nationality"
                class="select select-bordered w-full"
                required
              >
                <option value="">Select nationality</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Country of Residence <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="country_of_residence"
                class="select select-bordered w-full"
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Passport Information */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Passport Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Passport Number <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="passport_number"
                class="input input-bordered w-full"
                placeholder="Passport number"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Issue Date <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                name="passport_issue_date"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Expiry Date <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                name="passport_expiry_date"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Issuing Country <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="passport_issuing_country"
                class="select select-bordered w-full"
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Contact Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Email <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="email"
                name="email"
                class="input input-bordered w-full"
                placeholder="email@example.com"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Phone Country Code <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="phone_country_code"
                class="select select-bordered w-full"
                required
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.phone_code}>
                    {`${c.phone_code} (${c.name})`}
                  </option>
                ))}
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Phone Number <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="tel"
                name="phone"
                class="input input-bordered w-full"
                placeholder="Phone number"
                required
              />
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Permanent Address</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">
                  Address Line 1 <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="permanent_address_line1"
                class="input input-bordered w-full"
                placeholder="Street address"
                required
              />
            </div>
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">Address Line 2</span>
              </label>
              <input
                type="text"
                name="permanent_address_line2"
                class="input input-bordered w-full"
                placeholder="Apartment, suite, etc."
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  City <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="permanent_address_city"
                class="input input-bordered w-full"
                placeholder="City"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">State / Province</span>
              </label>
              <input
                type="text"
                name="permanent_address_state"
                class="input input-bordered w-full"
                placeholder="State or province"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Postal Code</span>
              </label>
              <input
                type="text"
                name="permanent_address_postal_code"
                class="input input-bordered w-full"
                placeholder="Postal code"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Country <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="permanent_address_country"
                class="select select-bordered w-full"
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Visit Information */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Visit Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Purpose of Visit <span class="text-error">*</span>
                </span>
              </label>
              <select
                name="visit_purpose"
                class="select select-bordered w-full"
                required
              >
                {VISIT_PURPOSES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Purpose Details (if Other)</span>
              </label>
              <input
                type="text"
                name="visit_purpose_other"
                class="input input-bordered w-full"
                placeholder="Specify purpose if 'Other' selected"
              />
            </div>
          </div>
        </div>

        {/* Health Information */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Health Information</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  name="yellow_fever_endemic_travel"
                  value="true"
                  class="checkbox checkbox-primary"
                />
                <span class="label-text">
                  Traveled from/through Yellow Fever endemic area
                </span>
              </label>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Vaccination Date</span>
              </label>
              <input
                type="date"
                name="vaccination_date"
                class="input input-bordered w-full"
              />
            </div>
            <div class="form-control md:col-span-2 lg:col-span-1">
              <label class="label">
                <span class="label-text">Health Notes</span>
              </label>
              <input
                type="text"
                name="health_notes"
                class="input input-bordered w-full"
                placeholder="Any health-related notes"
              />
            </div>
          </div>
        </div>

        {/* Customs Declaration */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Customs Declaration</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="form-control md:col-span-2 lg:col-span-4">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  name="customs_items_to_declare"
                  value="true"
                  class="checkbox checkbox-primary"
                />
                <span class="label-text">
                  Has items to declare
                </span>
              </label>
            </div>
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">Declaration Details</span>
              </label>
              <input
                type="text"
                name="declaration_details"
                class="input input-bordered w-full"
                placeholder="Items to declare"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Currency Amount</span>
              </label>
              <input
                type="number"
                name="currency_amount"
                class="input input-bordered w-full"
                placeholder="Amount"
                min="0"
                step="0.01"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Currency Type</span>
              </label>
              <select
                name="currency_type"
                class="select select-bordered w-full"
              >
                <option value="">Select currency</option>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {`${c.code} - ${c.name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div class="bg-base-200 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold mb-4">Emergency Contact</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Contact Name <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                class="input input-bordered w-full"
                placeholder="Full name"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Contact Phone <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="tel"
                name="emergency_contact_phone"
                class="input input-bordered w-full"
                placeholder="Phone number with country code"
                required
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">
                  Relationship <span class="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="emergency_contact_relationship"
                class="input input-bordered w-full"
                placeholder="e.g., Spouse, Parent"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div class="flex justify-end gap-3">
          <Link
            href={`/admin/imuga/declarations/${declaration.id}`}
            class="btn btn-ghost"
          >
            Cancel
          </Link>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={addAction.isRunning}
          >
            {addAction.isRunning ? (
              <>
                <span class="loading loading-spinner loading-sm"></span>
                Adding...
              </>
            ) : (
              'Add Traveler'
            )}
          </button>
        </div>
      </Form>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useDeclaration);
  const declaration = data.declaration;
  return {
    title: declaration
      ? `Add Traveler | ${declaration.declaration_number} | IMUGA | Admin | Rihigo`
      : 'Add Traveler | IMUGA | Admin | Rihigo',
    meta: [
      {
        name: 'description',
        content: 'Add a new traveler to an IMUGA declaration.',
      },
    ],
  };
};
