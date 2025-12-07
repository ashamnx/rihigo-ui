import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeAction$, Form, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { TicketCategory, TicketPriority } from '~/types/ticket';
import { TICKET_CATEGORY_LABELS } from '~/types/ticket';

export const useCreateTicket = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const ticketData = {
      subject: data.subject as string,
      description: data.description as string,
      category: data.category as TicketCategory,
      priority: (data.priority as TicketPriority) || 'medium',
    };

    const response = await apiClient.vendorPortal.tickets.create(ticketData, token);

    if (response.success && response.data) {
      throw requestEvent.redirect(302, `/vendor/tickets/${response.data.id}`);
    }

    return {
      success: response.success,
      error: response.error_message || 'Failed to create ticket',
    };
  });
});

export default component$(() => {
  const createAction = useCreateTicket();

  return (
    <div class="space-y-6">
      {/* Header */}
      <div>
        <Link href="/vendor/tickets" class="btn btn-ghost btn-sm mb-4">
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Tickets
        </Link>
        <h1 class="text-2xl font-bold">Create Support Ticket</h1>
        <p class="text-base-content/60 mt-1">Contact platform support for technical issues</p>
      </div>

      {/* Error Message */}
      {createAction.value?.success === false && (
        <div class="alert alert-error">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{createAction.value.error_message}</span>
        </div>
      )}

      {/* Form */}
      <div class="bg-base-200 rounded-xl p-6 max-w-2xl">
        <Form action={createAction}>
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
              <option value="technical">Technical Issue</option>
              <option value="payment">Payment Issue</option>
              <option value="inquiry">General Inquiry</option>
              <option value="other">Other</option>
            </select>
          </div>

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
          <button type="submit" class="btn btn-primary">
            Submit Ticket
          </button>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Create Support Ticket | Vendor Portal | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Create a platform support ticket',
    },
  ],
};
