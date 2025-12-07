import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form, Link, useLocation } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { Ticket, TicketMessage } from '~/types/ticket';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
  TICKET_CATEGORY_LABELS,
} from '~/types/ticket';

export const useTicket = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get('session');
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(requestEvent.url.pathname);
    throw requestEvent.redirect(302, `/auth/sign-in?callbackUrl=${callbackUrl}`);
  }

  const ticketId = requestEvent.params.id;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.tickets.getById(ticketId, token);
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error_message || 'Failed to load ticket',
      ticket: null as Ticket | null,
    };
  }

  return {
    success: true,
    error: null,
    ticket: response.data as Ticket,
  };
});

export const useAddMessage = routeAction$(async (data, requestEvent) => {
  const ticketId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const message = data.message as string;

    const response = await apiClient.tickets.addMessage(ticketId, { message }, token);

    return {
      success: response.success,
      error: response.error_message || 'Failed to send message',
    };
  });
});

export default component$(() => {
  const location = useLocation();
  const lang = location.params.lang || 'en-US';
  const ticketData = useTicket();
  const addMessageAction = useAddMessage();
  const messageText = useSignal('');

  const ticket = ticketData.value.ticket;

  if (!ticket) {
    return (
      <div class="min-h-screen bg-base-100">
        <div class="container mx-auto px-4 py-8 max-w-4xl">
          <Link href={`/${lang}/support/tickets`} class="btn btn-ghost btn-sm mb-4">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Tickets
          </Link>
          <div class="bg-base-200 rounded-xl p-12 text-center">
            <div class="size-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
              <svg class="size-8 text-error" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2">Ticket Not Found</h3>
            <p class="text-base-content/60">{ticketData.value.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSenderBadge = (senderType: string) => {
    switch (senderType) {
      case 'admin':
        return <span class="badge badge-xs badge-primary">Support Team</span>;
      case 'vendor':
        return <span class="badge badge-xs badge-secondary">Vendor</span>;
      case 'user':
        return <span class="badge badge-xs badge-info">You</span>;
      case 'system':
        return <span class="badge badge-xs badge-neutral">System</span>;
      default:
        return null;
    }
  };

  return (
    <div class="min-h-screen bg-base-100">
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Link href={`/${lang}/support/tickets`} class="btn btn-ghost btn-sm mb-4">
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Tickets
        </Link>

        <div class="flex items-start justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono text-sm text-base-content/50">{ticket.ticket_number}</span>
              <span class={`badge ${TICKET_STATUS_COLORS[ticket.status]}`}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </span>
              <span class={`badge ${TICKET_PRIORITY_COLORS[ticket.priority]}`}>
                {TICKET_PRIORITY_LABELS[ticket.priority]}
              </span>
            </div>
            <h1 class="text-xl font-bold">{ticket.subject}</h1>
          </div>
        </div>

        {/* Success Message */}
        {addMessageAction.value?.success && (
          <div class="alert alert-success mb-6">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Message sent successfully</span>
          </div>
        )}

        {addMessageAction.value?.success === false && (
          <div class="alert alert-error mb-6">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{addMessageAction.value.error_message}</span>
          </div>
        )}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages */}
          <div class="lg:col-span-2 space-y-4">
            {/* Original Ticket */}
            <div class="bg-base-200 rounded-xl p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="font-medium">You</span>
                  <span class="badge badge-xs badge-info">Original Request</span>
                </div>
                <div class="text-xs text-base-content/50">{formatDate(ticket.created_at)}</div>
              </div>
              <div class="prose prose-sm max-w-none">
                <p class="whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Message Thread */}
            {ticket.messages && ticket.messages.length > 0 && (
              <div class="space-y-3">
                {ticket.messages
                  .filter((msg: TicketMessage) => !msg.is_internal)
                  .map((msg: TicketMessage) => (
                    <div key={msg.id} class="bg-base-200 rounded-xl p-4">
                      <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-sm">
                            {msg.sender_name || msg.sender_type}
                          </span>
                          {getSenderBadge(msg.sender_type)}
                        </div>
                        <div class="text-xs text-base-content/50">{formatDate(msg.created_at)}</div>
                      </div>
                      <div class="prose prose-sm max-w-none">
                        <p class="whitespace-pre-wrap text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Reply Form */}
            {ticket.status !== 'closed' && (
              <div class="bg-base-200 rounded-xl p-4">
                <h3 class="font-semibold mb-3">Add a Reply</h3>
                <Form action={addMessageAction}>
                  <div class="form-control mb-3">
                    <textarea
                      name="message"
                      class="textarea textarea-bordered w-full"
                      rows={4}
                      placeholder="Type your message..."
                      required
                      value={messageText.value}
                      onInput$={(e) => (messageText.value = (e.target as HTMLTextAreaElement).value)}
                    ></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary">
                    Send Reply
                  </button>
                </Form>
              </div>
            )}

            {ticket.status === 'closed' && (
              <div class="bg-base-200 rounded-xl p-4 text-center">
                <p class="text-base-content/60">
                  This ticket is closed. If you need further assistance, please create a new ticket.
                </p>
                <Link href={`/${lang}/support/tickets/new`} class="btn btn-sm btn-primary mt-3">
                  Create New Ticket
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div class="space-y-4">
            {/* Ticket Details */}
            <div class="bg-base-200 rounded-xl p-4">
              <h3 class="font-semibold mb-3">Details</h3>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">Category</span>
                  <span class="badge badge-ghost badge-sm">
                    {TICKET_CATEGORY_LABELS[ticket.category]}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Status</span>
                  <span class={`badge badge-sm ${TICKET_STATUS_COLORS[ticket.status]}`}>
                    {TICKET_STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Priority</span>
                  <span class={`badge badge-sm ${TICKET_PRIORITY_COLORS[ticket.priority]}`}>
                    {TICKET_PRIORITY_LABELS[ticket.priority]}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Created</span>
                  <span>{formatDate(ticket.created_at)}</span>
                </div>
                {ticket.resolved_at && (
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Resolved</span>
                    <span>{formatDate(ticket.resolved_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Booking */}
            {ticket.booking && (
              <div class="bg-base-200 rounded-xl p-4">
                <h3 class="font-semibold mb-3">Related Booking</h3>
                <Link
                  href={`/${lang}/bookings/${ticket.booking.id}/confirmation`}
                  class="block p-3 bg-base-300 rounded-lg hover:bg-base-100 transition-colors"
                >
                  <div class="font-medium">{ticket.booking.activity_title}</div>
                  <div class="text-sm text-base-content/60">{ticket.booking.booking_number}</div>
                </Link>
              </div>
            )}

            {/* Status Info */}
            <div class="bg-base-200 rounded-xl p-4">
              <h3 class="font-semibold mb-3">Need Help?</h3>
              <p class="text-sm text-base-content/60 mb-3">
                Our support team typically responds within 24 hours during business days.
              </p>
              <div class="text-xs text-base-content/50">
                {ticket.assigned_to_name || ticket.assigned_vendor_name ? (
                  <span>Assigned to: {ticket.assigned_to_name || ticket.assigned_vendor_name}</span>
                ) : (
                  <span>Awaiting assignment</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const ticketData = resolveValue(useTicket);
  const ticket = ticketData.ticket;

  return {
    title: ticket ? `${ticket.ticket_number} - ${ticket.subject} | Rihigo` : 'Ticket Details | Rihigo',
    meta: [
      {
        name: 'description',
        content: 'View your support ticket details',
      },
    ],
  };
};
