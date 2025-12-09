import { component$, type QRL } from '@builder.io/qwik';
import type { ImugaTraveler } from '~/types/imuga';
import {
  TRAVELER_TITLES,
  GENDERS,
  VISIT_PURPOSES,
  getCountryName,
} from '~/types/imuga';

interface TravelerCardProps {
  traveler: ImugaTraveler;
  index: number;
  onEdit$?: QRL<(traveler: ImugaTraveler) => void>;
  onDelete$?: QRL<(traveler: ImugaTraveler) => void>;
}

export const TravelerCard = component$<TravelerCardProps>(
  ({ traveler, index, onEdit$, onDelete$ }) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    const getTitleLabel = (value: string) => {
      return TRAVELER_TITLES.find((t) => t.value === value)?.label || value;
    };

    const getGenderLabel = (value: string) => {
      return GENDERS.find((g) => g.value === value)?.label || value;
    };

    const getPurposeLabel = (value: string) => {
      return VISIT_PURPOSES.find((p) => p.value === value)?.label || value;
    };

    return (
      <div class="collapse collapse-arrow bg-base-100 rounded-lg mb-2">
        <input type="checkbox" />
        <div class="collapse-title font-medium flex items-center gap-3">
          <span class="badge badge-primary badge-sm">{index + 1}</span>
          <div class="flex items-center gap-2 flex-1">
            {traveler.photo_url && (
              <div class="avatar">
                <div class="w-8 rounded-full">
                  <img
                    src={traveler.photo_url}
                    alt={`${traveler.first_name} ${traveler.last_name}`}
                    width={32}
                    height={32}
                  />
                </div>
              </div>
            )}
            <div>
              <span class="font-medium">
                {getTitleLabel(traveler.title)} {traveler.first_name}{' '}
                {traveler.middle_name} {traveler.last_name}
              </span>
              <span class="text-xs text-base-content/60 ml-2">
                {getCountryName(traveler.nationality)}
              </span>
            </div>
          </div>
          {(onEdit$ || onDelete$) && (
            <div class="flex gap-1" onClick$={(e) => e.stopPropagation()}>
              {onEdit$ && (
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  onClick$={() => onEdit$(traveler)}
                >
                  Edit
                </button>
              )}
              {onDelete$ && (
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-error"
                  onClick$={() => onDelete$(traveler)}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
        <div class="collapse-content">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {/* Personal Info */}
            <div>
              <p class="text-xs text-base-content/60">Gender</p>
              <p class="text-sm">{getGenderLabel(traveler.gender)}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Date of Birth</p>
              <p class="text-sm">{formatDate(traveler.date_of_birth)}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Place of Birth</p>
              <p class="text-sm">{traveler.place_of_birth}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Country of Residence</p>
              <p class="text-sm">
                {getCountryName(traveler.country_of_residence)}
              </p>
            </div>

            {/* Passport */}
            <div>
              <p class="text-xs text-base-content/60">Passport Number</p>
              <p class="text-sm font-mono">{traveler.passport_number}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Passport Issue</p>
              <p class="text-sm">{formatDate(traveler.passport_issue_date)}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Passport Expiry</p>
              <p class="text-sm">{formatDate(traveler.passport_expiry_date)}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Issuing Country</p>
              <p class="text-sm">
                {getCountryName(traveler.passport_issuing_country)}
              </p>
            </div>

            {/* Contact */}
            <div>
              <p class="text-xs text-base-content/60">Email</p>
              <p class="text-sm">{traveler.email}</p>
            </div>
            <div>
              <p class="text-xs text-base-content/60">Phone</p>
              <p class="text-sm">
                {traveler.phone_country_code} {traveler.phone}
              </p>
            </div>

            {/* Visit */}
            <div>
              <p class="text-xs text-base-content/60">Purpose of Visit</p>
              <p class="text-sm">
                {getPurposeLabel(traveler.visit_purpose)}
                {traveler.visit_purpose === 'other' &&
                  traveler.visit_purpose_other &&
                  ` (${traveler.visit_purpose_other})`}
              </p>
            </div>

            {/* Address */}
            <div class="col-span-2">
              <p class="text-xs text-base-content/60">Address</p>
              <p class="text-sm">
                {traveler.permanent_address.line1}
                {traveler.permanent_address.line2 &&
                  `, ${traveler.permanent_address.line2}`}
                , {traveler.permanent_address.city}
                {traveler.permanent_address.state &&
                  `, ${traveler.permanent_address.state}`}
                {traveler.permanent_address.postal_code &&
                  ` ${traveler.permanent_address.postal_code}`}
                , {getCountryName(traveler.permanent_address.country)}
              </p>
            </div>

            {/* Health */}
            <div>
              <p class="text-xs text-base-content/60">Yellow Fever Travel</p>
              <p class="text-sm">
                {traveler.yellow_fever_endemic_travel ? (
                  <span class="badge badge-warning badge-sm">Yes</span>
                ) : (
                  <span class="badge badge-ghost badge-sm">No</span>
                )}
              </p>
            </div>

            {/* Customs */}
            <div>
              <p class="text-xs text-base-content/60">Items to Declare</p>
              <p class="text-sm">
                {traveler.customs_items_to_declare ? (
                  <span class="badge badge-warning badge-sm">Yes</span>
                ) : (
                  <span class="badge badge-ghost badge-sm">No</span>
                )}
              </p>
            </div>

            {/* Emergency Contact */}
            <div class="col-span-2">
              <p class="text-xs text-base-content/60">Emergency Contact</p>
              <p class="text-sm">
                {traveler.emergency_contact.contact_name} (
                {traveler.emergency_contact.contact_relationship}) -{' '}
                {traveler.emergency_contact.contact_phone}
              </p>
            </div>
          </div>

          {/* Documents */}
          {(traveler.passport_image_url || traveler.photo_url) && (
            <div class="mt-4 pt-4 border-t border-base-300">
              <p class="text-xs text-base-content/60 mb-2">Documents</p>
              <div class="flex gap-4">
                {traveler.photo_url && (
                  <div>
                    <p class="text-xs mb-1">Photo</p>
                    <img
                      src={traveler.photo_url}
                      alt="Traveler photo"
                      class="w-20 h-24 object-cover rounded"
                      width={80}
                      height={96}
                    />
                  </div>
                )}
                {traveler.passport_image_url && (
                  <div>
                    <p class="text-xs mb-1">Passport</p>
                    <img
                      src={traveler.passport_image_url}
                      alt="Passport"
                      class="w-32 h-24 object-cover rounded"
                      width={128}
                      height={96}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default TravelerCard;
