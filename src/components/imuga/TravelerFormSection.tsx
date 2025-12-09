import { component$, useSignal, $, type QRL } from '@builder.io/qwik';
import type { TravelerInputData } from '~/types/imuga';
import {
  TRAVELER_TITLES,
  GENDERS,
  VISIT_PURPOSES,
  COUNTRIES,
  CURRENCIES,
} from '~/types/imuga';
import { CountrySelect, PhoneCodeSelect } from './CountrySelect';
import { FileUpload } from './FileUpload';

interface TravelerFormSectionProps {
  index: number;
  traveler: TravelerInputData;
  isOpen?: boolean;
  canRemove?: boolean;
  onUpdate$: QRL<(index: number, field: string, value: any) => void>;
  onRemove$?: QRL<(index: number) => void>;
}

export const TravelerFormSection = component$<TravelerFormSectionProps>(
  ({ index, traveler, isOpen = true, canRemove = true, onUpdate$, onRemove$ }) => {
    const isExpanded = useSignal(isOpen);

    const updateField = $(async (field: string, value: any) => {
      await onUpdate$(index, field, value);
    });

    const updateNestedField = $(async (parent: string, field: string, value: any) => {
      const currentValue = traveler[parent as keyof TravelerInputData];
      if (typeof currentValue === 'object' && currentValue !== null) {
        await onUpdate$(index, parent, { ...currentValue, [field]: value });
      }
    });

    const getTravelerName = () => {
      if (traveler.first_name || traveler.last_name) {
        return `${traveler.first_name} ${traveler.last_name}`.trim();
      }
      return `Traveler ${index + 1}`;
    };

    return (
      <div class="collapse collapse-arrow bg-base-200 mb-4">
        <input
          type="checkbox"
          checked={isExpanded.value}
          onChange$={() => (isExpanded.value = !isExpanded.value)}
        />
        <div class="collapse-title font-medium flex items-center justify-between pr-12">
          <div class="flex items-center gap-2">
            <span class="badge badge-primary badge-sm">{index + 1}</span>
            <span>{getTravelerName()}</span>
          </div>
          {canRemove && onRemove$ && (
            <button
              type="button"
              class="btn btn-ghost btn-xs text-error"
              onClick$={(e) => {
                e.stopPropagation();
                onRemove$(index);
              }}
            >
              Remove
            </button>
          )}
        </div>
        <div class="collapse-content">
          {/* Personal Information */}
          <div class="border-b border-base-300 pb-4 mb-4">
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Personal Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Title */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Title <span class="text-error">*</span>
                  </span>
                </label>
                <select
                  class="select select-bordered select-sm w-full"
                  value={traveler.title}
                  onChange$={(e) =>
                    updateField('title', (e.target as HTMLSelectElement).value)
                  }
                  required
                >
                  {TRAVELER_TITLES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* First Name */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    First Name <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.first_name}
                  onInput$={(e) =>
                    updateField('first_name', (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>

              {/* Middle Name */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Middle Name</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.middle_name}
                  onInput$={(e) =>
                    updateField('middle_name', (e.target as HTMLInputElement).value)
                  }
                />
              </div>

              {/* Last Name */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Last Name <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.last_name}
                  onInput$={(e) =>
                    updateField('last_name', (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>

              {/* Gender */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Gender <span class="text-error">*</span>
                  </span>
                </label>
                <select
                  class="select select-bordered select-sm w-full"
                  value={traveler.gender}
                  onChange$={(e) =>
                    updateField('gender', (e.target as HTMLSelectElement).value)
                  }
                  required
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date of Birth */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Date of Birth <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  class="input input-bordered input-sm w-full"
                  value={traveler.date_of_birth}
                  onInput$={(e) =>
                    updateField('date_of_birth', (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>

              {/* Place of Birth */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Place of Birth <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.place_of_birth}
                  onInput$={(e) =>
                    updateField('place_of_birth', (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>

              {/* Nationality */}
              <CountrySelect
                name={`travelers[${index}].nationality`}
                value={traveler.nationality}
                label="Nationality"
                required
                class="select-sm"
                onChange$={(value) => updateField('nationality', value)}
              />

              {/* Country of Residence */}
              <CountrySelect
                name={`travelers[${index}].country_of_residence`}
                value={traveler.country_of_residence}
                label="Country of Residence"
                required
                class="select-sm"
                onChange$={(value) => updateField('country_of_residence', value)}
              />
            </div>
          </div>

          {/* Passport Details */}
          <div class="border-b border-base-300 pb-4 mb-4">
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Passport Details
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Passport Number */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Passport Number <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full uppercase"
                  value={traveler.passport_number}
                  onInput$={(e) =>
                    updateField(
                      'passport_number',
                      (e.target as HTMLInputElement).value.toUpperCase()
                    )
                  }
                  required
                />
              </div>

              {/* Issue Date */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Issue Date <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  class="input input-bordered input-sm w-full"
                  value={traveler.passport_issue_date}
                  onInput$={(e) =>
                    updateField(
                      'passport_issue_date',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  required
                />
              </div>

              {/* Expiry Date */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Expiry Date <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  class="input input-bordered input-sm w-full"
                  value={traveler.passport_expiry_date}
                  onInput$={(e) =>
                    updateField(
                      'passport_expiry_date',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  required
                />
              </div>

              {/* Issuing Country */}
              <CountrySelect
                name={`travelers[${index}].passport_issuing_country`}
                value={traveler.passport_issuing_country}
                label="Issuing Country"
                required
                class="select-sm"
                onChange$={(value) => updateField('passport_issuing_country', value)}
              />
            </div>

            {/* Passport Image */}
            <div class="mt-4">
              <FileUpload
                name={`travelers[${index}].passport_image_url`}
                value={traveler.passport_image_url}
                label="Passport Photo Page"
                helpText="Upload a clear photo of your passport's photo page"
                onUpload$={(base64) => updateField('passport_image_url', base64)}
                onRemove$={() => updateField('passport_image_url', '')}
              />
            </div>
          </div>

          {/* Photo */}
          <div class="border-b border-base-300 pb-4 mb-4">
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Traveler Photo
            </h4>
            <FileUpload
              name={`travelers[${index}].photo_url`}
              value={traveler.photo_url}
              label="Recent Photo"
              helpText="Upload a recent passport-style photo"
              onUpload$={(base64) => updateField('photo_url', base64)}
              onRemove$={() => updateField('photo_url', '')}
            />
          </div>

          {/* Contact Information */}
          <div class="border-b border-base-300 pb-4 mb-4">
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Contact Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Email <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  class="input input-bordered input-sm w-full"
                  value={traveler.email}
                  onInput$={(e) =>
                    updateField('email', (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>

              {/* Phone */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Phone <span class="text-error">*</span>
                  </span>
                </label>
                <div class="flex gap-2">
                  <div class="w-32">
                    <PhoneCodeSelect
                      name={`travelers[${index}].phone_country_code`}
                      value={traveler.phone_country_code}
                      class="select-sm"
                      onChange$={(value) => updateField('phone_country_code', value)}
                    />
                  </div>
                  <input
                    type="tel"
                    class="input input-bordered input-sm flex-1"
                    value={traveler.phone}
                    onInput$={(e) =>
                      updateField('phone', (e.target as HTMLInputElement).value)
                    }
                    placeholder="Phone number"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div class="border-b border-base-300 pb-4 mb-4">
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Permanent Address
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address Line 1 */}
              <div class="form-control md:col-span-2">
                <label class="label">
                  <span class="label-text">
                    Address Line 1 <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.permanent_address.line1}
                  onInput$={(e) =>
                    updateNestedField(
                      'permanent_address',
                      'line1',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  required
                />
              </div>

              {/* Address Line 2 */}
              <div class="form-control md:col-span-2">
                <label class="label">
                  <span class="label-text">Address Line 2</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.permanent_address.line2}
                  onInput$={(e) =>
                    updateNestedField(
                      'permanent_address',
                      'line2',
                      (e.target as HTMLInputElement).value
                    )
                  }
                />
              </div>

              {/* City */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    City <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.permanent_address.city}
                  onInput$={(e) =>
                    updateNestedField(
                      'permanent_address',
                      'city',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  required
                />
              </div>

              {/* State/Province */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">State/Province</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.permanent_address.state}
                  onInput$={(e) =>
                    updateNestedField(
                      'permanent_address',
                      'state',
                      (e.target as HTMLInputElement).value
                    )
                  }
                />
              </div>

              {/* Postal Code */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Postal Code</span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.permanent_address.postal_code}
                  onInput$={(e) =>
                    updateNestedField(
                      'permanent_address',
                      'postal_code',
                      (e.target as HTMLInputElement).value
                    )
                  }
                />
              </div>

              {/* Country */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Country <span class="text-error">*</span>
                  </span>
                </label>
                <select
                  class="select select-bordered select-sm w-full"
                  value={traveler.permanent_address.country}
                  onChange$={(e) =>
                    updateNestedField(
                      'permanent_address',
                      'country',
                      (e.target as HTMLSelectElement).value
                    )
                  }
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
          <div class="border-b border-base-300 pb-4 mb-4">
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Visit Information
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purpose of Visit */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Purpose of Visit <span class="text-error">*</span>
                  </span>
                </label>
                <select
                  class="select select-bordered select-sm w-full"
                  value={traveler.visit_purpose}
                  onChange$={(e) =>
                    updateField('visit_purpose', (e.target as HTMLSelectElement).value)
                  }
                  required
                >
                  {VISIT_PURPOSES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Other Purpose (conditional) */}
              {traveler.visit_purpose === 'other' && (
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">
                      Specify Purpose <span class="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    class="input input-bordered input-sm w-full"
                    value={traveler.visit_purpose_other}
                    onInput$={(e) =>
                      updateField(
                        'visit_purpose_other',
                        (e.target as HTMLInputElement).value
                      )
                    }
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Health Declarations */}
          <div class="border-b border-base-300 pb-4 mb-4">
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Health Declarations
            </h4>
            <div class="space-y-4">
              {/* Yellow Fever */}
              <div class="form-control">
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    checked={traveler.yellow_fever_endemic_travel}
                    onChange$={(e) =>
                      updateField(
                        'yellow_fever_endemic_travel',
                        (e.target as HTMLInputElement).checked
                      )
                    }
                  />
                  <span class="label-text">
                    Have you visited a Yellow Fever endemic country in the last 6
                    days?
                  </span>
                </label>
              </div>

              {traveler.yellow_fever_endemic_travel && (
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                  {/* Vaccination Date */}
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Vaccination Date</span>
                    </label>
                    <input
                      type="date"
                      class="input input-bordered input-sm w-full"
                      value={traveler.vaccination_date}
                      onInput$={(e) =>
                        updateField(
                          'vaccination_date',
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {/* Health Notes */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Health Notes (Optional)</span>
                </label>
                <textarea
                  class="textarea textarea-bordered textarea-sm w-full"
                  rows={2}
                  value={traveler.health_notes}
                  onInput$={(e) =>
                    updateField('health_notes', (e.target as HTMLTextAreaElement).value)
                  }
                  placeholder="Any health conditions or medications to declare"
                />
              </div>
            </div>
          </div>

          {/* Customs Declarations */}
          <div class="border-b border-base-300 pb-4 mb-4">
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Customs Declarations
            </h4>
            <div class="space-y-4">
              {/* Items to Declare */}
              <div class="form-control">
                <label class="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    checked={traveler.customs_items_to_declare}
                    onChange$={(e) =>
                      updateField(
                        'customs_items_to_declare',
                        (e.target as HTMLInputElement).checked
                      )
                    }
                  />
                  <span class="label-text">
                    Do you have any items to declare?
                  </span>
                </label>
              </div>

              {traveler.customs_items_to_declare && (
                <div class="form-control ml-8">
                  <label class="label">
                    <span class="label-text">Declaration Details</span>
                  </label>
                  <textarea
                    class="textarea textarea-bordered textarea-sm w-full"
                    rows={2}
                    value={traveler.declaration_details}
                    onInput$={(e) =>
                      updateField(
                        'declaration_details',
                        (e.target as HTMLTextAreaElement).value
                      )
                    }
                    placeholder="List items to declare"
                  />
                </div>
              )}

              {/* Currency */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Currency Amount (if over $10,000)</span>
                  </label>
                  <input
                    type="number"
                    class="input input-bordered input-sm w-full"
                    value={traveler.currency_amount}
                    onInput$={(e) =>
                      updateField(
                        'currency_amount',
                        parseFloat((e.target as HTMLInputElement).value) || undefined
                      )
                    }
                    placeholder="Amount"
                  />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Currency Type</span>
                  </label>
                  <select
                    class="select select-bordered select-sm w-full"
                    value={traveler.currency_type}
                    onChange$={(e) =>
                      updateField(
                        'currency_type',
                        (e.target as HTMLSelectElement).value
                      )
                    }
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
          </div>

          {/* Emergency Contact */}
          <div>
            <h4 class="font-semibold text-sm mb-3 text-primary">
              Emergency Contact
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contact Name */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Contact Name <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.emergency_contact.contact_name}
                  onInput$={(e) =>
                    updateNestedField(
                      'emergency_contact',
                      'contact_name',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  required
                />
              </div>

              {/* Contact Phone */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Contact Phone <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="tel"
                  class="input input-bordered input-sm w-full"
                  value={traveler.emergency_contact.contact_phone}
                  onInput$={(e) =>
                    updateNestedField(
                      'emergency_contact',
                      'contact_phone',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  required
                />
              </div>

              {/* Relationship */}
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Relationship <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  value={traveler.emergency_contact.contact_relationship}
                  onInput$={(e) =>
                    updateNestedField(
                      'emergency_contact',
                      'contact_relationship',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  placeholder="e.g., Spouse, Parent, Friend"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default TravelerFormSection;
