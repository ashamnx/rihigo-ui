import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form, Link, useLocation } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { TicketCategory, TicketPriority } from '~/types/ticket';
import { TICKET_CATEGORY_LABELS } from '~/types/ticket';

export const useUserProfile = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session');
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(requestEvent.url.pathname);
    throw requestEvent.redirect(302, `/auth/sign-in?callbackUrl=${callbackUrl}`);
  }

  return {
    name: session.user.name,
    email: session.user.email,
  };
});

export const useUserBookings = routeLoader$(async (requestEvent) => {
  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.bookings.list(1, 50, token);
  });

  if (!response.success) {
    return [];
  }

  return response.data || [];
});

export const useCreateTicket = routeAction$(async (data, requestEvent) => {
  const lang = requestEvent.params.lang || 'en-US';

  return authenticatedRequest(requestEvent, async (token) => {
    const ticketData = {
      subject: data.subject as string,
      description: data.description as string,
      category: data.category as TicketCategory,
      priority: (data.priority as TicketPriority) || 'medium',
      related_booking_id: (data.related_booking_id as string) || undefined,
    };

    const response = await apiClient.tickets.create(ticketData, token);

    if (response.success && response.data) {
      throw requestEvent.redirect(302, `/${lang}/support/tickets/${response.data.id}`);
    }

    return {
      success: response.success,
      error: response.error_message || 'Failed to create ticket',
    };
  });
});

export default component$(() => {
  const location = useLocation();
  const lang = location.params.lang || 'en-US';
  const userProfile = useUserProfile();
  const bookings = useUserBookings();
  const createAction = useCreateTicket();

  return (
    <div class="min-h-screen bg-base-100">
      <div class="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div class="mb-8">
          <Link href={`/${lang}/support/tickets`} class="btn btn-ghost btn-sm mb-4">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Tickets
          </Link>
          <h1 class="text-2xl font-bold">Create Support Ticket</h1>
          <p class="text-base-content/60 mt-1">Let us know how we can help</p>
        </div>

        {/* Error Message */}
        {createAction.value?.success === false && (
          <div class="alert alert-error mb-6">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{createAction.value.error_message}</span>
          </div>
        )}

        {/* Form */}
        <div class="bg-base-200 rounded-xl p-6">
          <Form action={createAction}>
            {/* Contact Info (pre-filled) */}
            <div class="mb-6 p-4 bg-base-300 rounded-lg">
              <div class="text-sm text-base-content/60 mb-1">Submitting as</div>
              <div class="font-medium">{userProfile.value.name}</div>
              <div class="text-sm text-base-content/60">{userProfile.value.email}</div>
            </div>

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

            {/* Related Booking (optional) */}
            {bookings.value.length > 0 && (
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Related Booking (optional)</span>
                </label>
                <select name="related_booking_id" class="select select-bordered w-full">
                  <option value="">None</option>
                  {bookings.value.map((booking: any) => (
                    <option key={booking.id} value={booking.id}>
                      {`${booking.activity?.title || 'Booking'} - ${new Date(booking.booking_date).toLocaleDateString()}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Priority</span>
              </label>
              <select name="priority" class="select select-bordered w-full">
                <option value="low">Low - General question</option>
                <option value="medium" selected>Medium - Need help soon</option>
                <option value="high">High - Urgent issue</option>
                <option value="critical">Critical - Requires immediate attention</option>
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
                placeholder="Please describe your issue in detail..."
                required
              ></textarea>
            </div>

            {/* Submit */}
            <button type="submit" class="btn btn-primary w-full">
              Submit Ticket
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Create Support Ticket | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Create a new support ticket',
    },
  ],
};
