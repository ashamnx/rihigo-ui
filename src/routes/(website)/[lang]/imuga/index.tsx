import { component$, useStore, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeAction$, Form, Link, useLocation } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import type { TravelerInputData, CreateImugaRequestInput } from '~/types/imuga';
import { createEmptyTravelerData } from '~/types/imuga';
import { TravelerFormSection } from '~/components/imuga/TravelerFormSection';

interface FormState {
  // Requester Info
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  // Group Info
  group_name: string;
  // Accommodation
  accommodation_name: string;
  accommodation_island: string;
  accommodation_atoll: string;
  // Travel Info
  arrival_date: string;
  departure_date: string;
  arrival_flight: string;
  departure_flight: string;
  // Notes
  notes: string;
  // Travelers
  travelers: TravelerInputData[];
}

export const useSubmitRequest = routeAction$(async (formData, requestEvent) => {
  const lang = requestEvent.params.lang || 'en-US';

  // Parse travelers from form data
  const travelersJson = formData.travelers_json as string;
  let travelers: TravelerInputData[] = [];

  try {
    travelers = JSON.parse(travelersJson);
  } catch {
    return {
      success: false,
      error: 'Invalid traveler data',
    };
  }

  if (travelers.length === 0) {
    return {
      success: false,
      error: 'At least one traveler is required',
    };
  }

  const requestData: CreateImugaRequestInput = {
    requester_email: formData.requester_email as string,
    requester_name: formData.requester_name as string,
    requester_phone: formData.requester_phone as string || undefined,
    group_name: formData.group_name as string,
    accommodation_name: formData.accommodation_name as string,
    accommodation_island: formData.accommodation_island as string,
    accommodation_atoll: formData.accommodation_atoll as string,
    arrival_date: formData.arrival_date as string,
    departure_date: formData.departure_date as string,
    arrival_flight: formData.arrival_flight as string,
    departure_flight: formData.departure_flight as string || undefined,
    notes: formData.notes as string || undefined,
    travelers_data: travelers,
  };

  const response = await apiClient.imugaPublic.createRequest(requestData);

  if (response.success && response.data) {
    return {
      success: true,
      requestNumber: response.data.request_number,
      email: requestData.requester_email,
      lang,
    };
  }

  return {
    success: false,
    error: response.error_message || 'Failed to submit request',
  };
});

export default component$(() => {
  const location = useLocation();
  const lang = location.params.lang || 'en-US';
  const submitAction = useSubmitRequest();

  const formState = useStore<FormState>({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    group_name: '',
    accommodation_name: '',
    accommodation_island: '',
    accommodation_atoll: '',
    arrival_date: '',
    departure_date: '',
    arrival_flight: '',
    departure_flight: '',
    notes: '',
    travelers: [createEmptyTravelerData()],
  });

  const addTraveler = $(() => {
    formState.travelers = [...formState.travelers, createEmptyTravelerData()];
  });

  const removeTraveler = $((index: number) => {
    if (formState.travelers.length > 1) {
      formState.travelers = formState.travelers.filter((_, i) => i !== index);
    }
  });

  const updateTraveler = $((index: number, field: string, value: any) => {
    const traveler = formState.travelers[index];
    (traveler as any)[field] = value;
    formState.travelers = [...formState.travelers];
  });

  // Success state
  if (submitAction.value?.success && submitAction.value?.requestNumber) {
    return (
      <div class="min-h-screen bg-base-100">
        <div class="container mx-auto px-4 py-12 max-w-2xl">
          <div class="bg-base-200 rounded-xl p-8 text-center">
            <div class="size-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <svg
                class="size-8 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold mb-2">Request Submitted Successfully!</h1>
            <p class="text-base-content/60 mb-6">
              Your IMUGA declaration request has been submitted. We will process it
              and get back to you soon.
            </p>

            <div class="bg-base-300 rounded-lg p-4 mb-6">
              <div class="text-sm text-base-content/60 mb-1">
                Your Request Number
              </div>
              <div class="text-xl font-mono font-bold">
                {submitAction.value.requestNumber}
              </div>
            </div>

            <div class="bg-info/10 border border-info/20 rounded-lg p-4 mb-6 text-left">
              <div class="flex items-start gap-3">
                <svg
                  class="size-5 text-info flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <div class="text-sm">
                  <p class="font-medium text-info mb-1">Check Your Email</p>
                  <p class="text-base-content/70">
                    We've sent a confirmation email to{' '}
                    <strong>{submitAction.value.email}</strong> with your request
                    details.
                  </p>
                </div>
              </div>
            </div>

            <div class="flex gap-3 justify-center">
              <Link
                href={`/${lang}/imuga/${submitAction.value.requestNumber}`}
                class="btn btn-primary"
              >
                Track Request
              </Link>
              <Link href={`/${lang}`} class="btn btn-ghost">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-base-100">
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div class="mb-8">
          <Link href={`/${lang}`} class="btn btn-ghost btn-sm mb-4">
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
            Back
          </Link>
          <h1 class="text-2xl font-bold">IMUGA Declaration Request</h1>
          <p class="text-base-content/60 mt-1">
            Submit your travel declaration for entry to the Maldives
          </p>
        </div>

        {/* Info Banner */}
        <div class="bg-info/10 border border-info/20 rounded-xl p-4 mb-6">
          <div class="flex items-start gap-3">
            <svg
              class="size-5 text-info flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <div class="text-sm">
              <p class="font-medium text-info mb-1">Important Information</p>
              <p class="text-base-content/70">
                All travelers entering the Maldives must complete an IMUGA
                declaration. Please ensure all information matches your passport
                exactly. Fields marked with <span class="text-error">*</span> are
                required.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {submitAction.value?.success === false && (
          <div class="alert alert-error mb-6">
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
            <span>{submitAction.value.error}</span>
          </div>
        )}

        {/* Form */}
        <Form action={submitAction}>
          {/* Hidden field for travelers JSON */}
          <input
            type="hidden"
            name="travelers_json"
            value={JSON.stringify(formState.travelers)}
          />

          {/* Requester Information */}
          <div class="bg-base-200 rounded-xl p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">Your Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Full Name <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="requester_name"
                  class="input input-bordered w-full"
                  placeholder="Your full name"
                  value={formState.requester_name}
                  onInput$={(e) =>
                    (formState.requester_name = (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Email <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  name="requester_email"
                  class="input input-bordered w-full"
                  placeholder="your@email.com"
                  value={formState.requester_email}
                  onInput$={(e) =>
                    (formState.requester_email = (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="requester_phone"
                  class="input input-bordered w-full"
                  placeholder="+1 234 567 8900"
                  value={formState.requester_phone}
                  onInput$={(e) =>
                    (formState.requester_phone = (e.target as HTMLInputElement).value)
                  }
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Group/Booking Name <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="group_name"
                  class="input input-bordered w-full"
                  placeholder="e.g., Smith Family Trip"
                  value={formState.group_name}
                  onInput$={(e) =>
                    (formState.group_name = (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Accommodation */}
          <div class="bg-base-200 rounded-xl p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">Accommodation in Maldives</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="form-control md:col-span-3">
                <label class="label">
                  <span class="label-text">
                    Accommodation Name <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="accommodation_name"
                  class="input input-bordered w-full"
                  placeholder="Hotel/Resort name"
                  value={formState.accommodation_name}
                  onInput$={(e) =>
                    (formState.accommodation_name = (
                      e.target as HTMLInputElement
                    ).value)
                  }
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Island <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="accommodation_island"
                  class="input input-bordered w-full"
                  placeholder="e.g., Malé"
                  value={formState.accommodation_island}
                  onInput$={(e) =>
                    (formState.accommodation_island = (
                      e.target as HTMLInputElement
                    ).value)
                  }
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Atoll <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="accommodation_atoll"
                  class="input input-bordered w-full"
                  placeholder="e.g., Kaafu"
                  value={formState.accommodation_atoll}
                  onInput$={(e) =>
                    (formState.accommodation_atoll = (
                      e.target as HTMLInputElement
                    ).value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Travel Information */}
          <div class="bg-base-200 rounded-xl p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">Travel Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Arrival Date <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  name="arrival_date"
                  class="input input-bordered w-full"
                  value={formState.arrival_date}
                  onInput$={(e) =>
                    (formState.arrival_date = (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Departure Date <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  name="departure_date"
                  class="input input-bordered w-full"
                  value={formState.departure_date}
                  onInput$={(e) =>
                    (formState.departure_date = (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">
                    Arrival Flight <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="arrival_flight"
                  class="input input-bordered w-full"
                  placeholder="e.g., SQ452"
                  value={formState.arrival_flight}
                  onInput$={(e) =>
                    (formState.arrival_flight = (e.target as HTMLInputElement).value)
                  }
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Departure Flight</span>
                </label>
                <input
                  type="text"
                  name="departure_flight"
                  class="input input-bordered w-full"
                  placeholder="e.g., SQ453"
                  value={formState.departure_flight}
                  onInput$={(e) =>
                    (formState.departure_flight = (
                      e.target as HTMLInputElement
                    ).value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div class="bg-base-200 rounded-xl p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">Additional Notes</h2>
            <div class="form-control">
              <textarea
                name="notes"
                class="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Any special requests or additional information..."
                value={formState.notes}
                onInput$={(e) =>
                  (formState.notes = (e.target as HTMLTextAreaElement).value)
                }
              />
            </div>
          </div>

          {/* Travelers */}
          <div class="bg-base-200 rounded-xl p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold">Travelers</h2>
                <p class="text-sm text-base-content/60">
                  {formState.travelers.length} traveler
                  {formState.travelers.length !== 1 ? 's' : ''} added
                </p>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                onClick$={addTraveler}
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add Traveler
              </button>
            </div>

            {formState.travelers.map((traveler, index) => (
              <TravelerFormSection
                key={index}
                index={index}
                traveler={traveler}
                isOpen={index === 0}
                canRemove={formState.travelers.length > 1}
                onUpdate$={updateTraveler}
                onRemove$={removeTraveler}
              />
            ))}
          </div>

          {/* Privacy Notice */}
          <div class="text-xs text-base-content/50 mb-6 px-2">
            By submitting this form, you agree to our{' '}
            <Link href={`/${lang}/privacy`} class="link">
              Privacy Policy
            </Link>{' '}
            and consent to the processing of your personal information for IMUGA
            declaration purposes.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            class="btn btn-primary w-full"
            disabled={submitAction.isRunning}
          >
            {submitAction.isRunning ? (
              <>
                <span class="loading loading-spinner loading-sm"></span>
                Submitting...
              </>
            ) : (
              'Submit Declaration Request'
            )}
          </button>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'IMUGA Declaration Request | Rihigo',
  meta: [
    {
      name: 'description',
      content:
        'Submit your IMUGA travel declaration for entry to the Maldives. Complete the online form with traveler information.',
    },
  ],
};
