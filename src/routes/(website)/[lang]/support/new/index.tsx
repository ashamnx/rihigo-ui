import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeAction$, Form, Link, useLocation } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import type { TicketCategory } from '~/types/ticket';
import { TICKET_CATEGORY_LABELS } from '~/types/ticket';

export const useCreateGuestTicket = routeAction$(async (data, requestEvent) => {
  const lang = requestEvent.params.lang || 'en-US';

  const ticketData = {
    guest_name: data.guest_name as string,
    guest_email: data.guest_email as string,
    subject: data.subject as string,
    description: data.description as string,
    category: data.category as TicketCategory,
  };

  const response = await apiClient.support.createTicket(ticketData);

  if (response.success && response.data) {
    // Redirect to a success/confirmation page with ticket number
    return {
      success: true,
      ticketNumber: response.data.ticket_number,
      email: ticketData.guest_email,
    };
  }

  return {
    success: false,
    error: response.error_message || 'Failed to create ticket',
  };
});

export default component$(() => {
  const location = useLocation();
  const lang = location.params.lang || 'en-US';
  const createAction = useCreateGuestTicket();

  // If ticket was created successfully, show confirmation
  if (createAction.value?.success && createAction.value?.ticketNumber) {
    return (
      <div class="min-h-screen bg-base-100">
        <div class="container mx-auto px-4 py-12 max-w-2xl">
          <div class="bg-base-200 rounded-xl p-8 text-center">
            <div class="size-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <svg class="size-8 text-success" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 class="text-2xl font-bold mb-2">Ticket Submitted Successfully!</h1>
            <p class="text-base-content/60 mb-6">
              We've received your support request and will get back to you soon.
            </p>

            <div class="bg-base-300 rounded-lg p-4 mb-6">
              <div class="text-sm text-base-content/60 mb-1">Your Ticket Number</div>
              <div class="text-xl font-mono font-bold">{createAction.value.ticketNumber}</div>
            </div>

            <div class="bg-info/10 border border-info/20 rounded-lg p-4 mb-6 text-left">
              <div class="flex items-start gap-3">
                <svg class="size-5 text-info flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <div class="text-sm">
                  <p class="font-medium text-info mb-1">Check Your Email</p>
                  <p class="text-base-content/70">
                    We've sent a confirmation email to <strong>{createAction.value.email}</strong> with
                    a link to track your ticket. Please check your inbox (and spam folder).
                  </p>
                </div>
              </div>
            </div>

            <div class="flex gap-3 justify-center">
              <Link href={`/${lang}/support`} class="btn btn-ghost">
                Back to Support
              </Link>
              <Link href={`/${lang}`} class="btn btn-primary">
                Continue Browsing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-base-100">
      <div class="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div class="mb-8">
          <Link href={`/${lang}/support`} class="btn btn-ghost btn-sm mb-4">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Support
          </Link>
          <h1 class="text-2xl font-bold">Contact Support</h1>
          <p class="text-base-content/60 mt-1">Let us know how we can help you</p>
        </div>

        {/* Login Suggestion */}
        <div class="bg-info/10 border border-info/20 rounded-xl p-4 mb-6">
          <div class="flex items-start gap-3">
            <svg class="size-5 text-info flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div class="text-sm">
              <p class="font-medium text-info mb-1">Already have an account?</p>
              <p class="text-base-content/70">
                <Link href={`/auth/sign-in?callbackUrl=/${lang}/support/tickets/new`} class="link link-primary">
                  Sign in
                </Link>{' '}
                to track all your tickets in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {createAction.value?.success === false && (
          <div class="alert alert-error mb-6">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{createAction.value.error}</span>
          </div>
        )}

        {/* Form */}
        <div class="bg-base-200 rounded-xl p-6">
          <Form action={createAction}>
            {/* Contact Information */}
            <h3 class="font-semibold mb-4">Your Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Name</span>
                </label>
                <input
                  type="text"
                  name="guest_name"
                  class="input input-bordered w-full"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Email</span>
                </label>
                <input
                  type="email"
                  name="guest_email"
                  class="input input-bordered w-full"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Ticket Details */}
            <h3 class="font-semibold mb-4">How can we help?</h3>

            {/* Subject */}
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Subject</span>
              </label>
              <input
                type="text"
                name="subject"
                class="input input-bordered w-full"
                placeholder="Brief summary of your issue"
                required
              />
            </div>

            {/* Category */}
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Category</span>
              </label>
              <select name="category" class="select select-bordered w-full" required>
                <option value="">Select a category</option>
                {Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div class="form-control mb-6">
              <label class="label">
                <span class="label-text">Description</span>
              </label>
              <textarea
                name="description"
                class="textarea textarea-bordered w-full"
                rows={6}
                placeholder="Please describe your issue in detail. Include any relevant booking numbers, dates, or other information that might help us assist you better."
                required
              ></textarea>
            </div>

            {/* Privacy Notice */}
            <div class="text-xs text-base-content/50 mb-6">
              By submitting this form, you agree to our{' '}
              <Link href={`/${lang}/privacy`} class="link">
                Privacy Policy
              </Link>
              . We'll use your information to respond to your inquiry.
            </div>

            {/* Submit */}
            <button type="submit" class="btn btn-primary w-full">
              Submit Request
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Contact Support | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Contact our support team for help with your bookings or any other questions.',
    },
  ],
};
