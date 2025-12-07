import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { Ticket, TicketMessage, TicketStatus } from '~/types/ticket';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
  TICKET_CATEGORY_LABELS,
} from '~/types/ticket';

export const useTicket = routeLoader$(async (requestEvent) => {
  const ticketId = requestEvent.params.id;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendorPortal.tickets.getById(ticketId, token);
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
    const isInternal = data.is_internal === 'true';

    const response = await apiClient.vendorPortal.tickets.addMessage(
      ticketId,
      { message, is_internal: isInternal },
      token
    );

    return {
      success: response.success,
      message: response.success
        ? 'Message sent successfully'
        : response.error_message || 'Failed to send message',
    };
  });
});

export const useUpdateStatus = routeAction$(async (data, requestEvent) => {
  const ticketId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const status = data.status as TicketStatus;

    const response = await apiClient.vendorPortal.tickets.updateStatus(ticketId, { status }, token);

    return {
      success: response.success,
      message: response.success
        ? 'Status updated successfully'
        : response.error_message || 'Failed to update status',
    };
  });
});

export default component$(() => {
  const ticketData = useTicket();
  const addMessageAction = useAddMessage();
  const updateStatusAction = useUpdateStatus();

  const isInternalNote = useSignal(false);
  const messageText = useSignal('');

  const ticket = ticketData.value.ticket;

  if (!ticket) {
    return (
      <div class="space-y-6">
        <Link href="/vendor/tickets" class="btn btn-ghost btn-sm">
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
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

  const getSenderBadge = (senderType: string, isInternal: boolean) => {
    if (isInternal) {
      return <span class="badge badge-xs badge-warning">Internal Note</span>;
    }
    switch (senderType) {
      case 'admin':
        return <span class="badge badge-xs badge-primary">Admin</span>;
      case 'vendor':
        return <span class="badge badge-xs badge-secondary">You</span>;
      case 'user':
        return <span class="badge badge-xs badge-info">Customer</span>;
      case 'guest':
        return <span class="badge badge-xs badge-ghost">Guest</span>;
      case 'system':
        return <span class="badge badge-xs badge-neutral">System</span>;
      default:
        return null;
    }
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center gap-3">
        <Link href="/vendor/tickets" class="btn btn-ghost btn-sm">
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </Link>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold">{ticket.ticket_number}</h1>
            <span class={`badge ${TICKET_STATUS_COLORS[ticket.status]}`}>
              {TICKET_STATUS_LABELS[ticket.status]}
            </span>
            <span class={`badge ${TICKET_PRIORITY_COLORS[ticket.priority]}`}>
              {TICKET_PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>
          <p class="text-base-content/60 text-sm mt-1">{ticket.subject}</p>
        </div>
      </div>

      {/* Messages */}
      {(addMessageAction.value?.success || updateStatusAction.value?.success) && (
        <div class="alert alert-success py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{addMessageAction.value?.message || updateStatusAction.value?.message}</span>
        </div>
      )}

      {(addMessageAction.value?.success === false || updateStatusAction.value?.success === false) && (
        <div class="alert alert-error py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{addMessageAction.value?.message || updateStatusAction.value?.message}</span>
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div class="lg:col-span-2 space-y-4">
          {/* Original Ticket */}
          <div class="bg-base-200 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="font-medium">{ticket.user?.name || ticket.guest_name || 'Customer'}</div>
                <div class="text-xs text-base-content/50">{ticket.user?.email || ticket.guest_email}</div>
              </div>
              <div class="text-xs text-base-content/50">{formatDate(ticket.created_at)}</div>
            </div>
            <div class="prose prose-sm max-w-none">
              <p class="whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Messages */}
          {ticket.messages && ticket.messages.length > 0 && (
            <div class="space-y-3">
              {ticket.messages.map((msg: TicketMessage) => (
                <div
                  key={msg.id}
                  class={`bg-base-200 rounded-xl p-4 ${msg.is_internal ? 'border-l-4 border-warning' : ''}`}
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm">{msg.sender_name || msg.sender_type}</span>
                      {getSenderBadge(msg.sender_type, msg.is_internal)}
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
          <div class="bg-base-200 rounded-xl p-4">
            <h3 class="font-semibold mb-3">Add Reply</h3>
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
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_internal"
                    value="true"
                    class="checkbox checkbox-sm checkbox-warning"
                    checked={isInternalNote.value}
                    onChange$={(e) => (isInternalNote.value = (e.target as HTMLInputElement).checked)}
                  />
                  <span class="text-sm">Internal note (not visible to customer)</span>
                </label>
                <button type="submit" class="btn btn-primary btn-sm">
                  Send Reply
                </button>
              </div>
            </Form>
          </div>
        </div>

        {/* Sidebar */}
        <div class="space-y-4">
          {/* Details */}
          <div class="bg-base-200 rounded-xl p-4">
            <h3 class="font-semibold mb-3">Details</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/60">Category</span>
                <span class="badge badge-ghost badge-sm">{TICKET_CATEGORY_LABELS[ticket.category]}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Priority</span>
                <span class={`badge badge-sm ${TICKET_PRIORITY_COLORS[ticket.priority]}`}>
                  {TICKET_PRIORITY_LABELS[ticket.priority]}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Status</span>
                <span class={`badge badge-sm ${TICKET_STATUS_COLORS[ticket.status]}`}>
                  {TICKET_STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Created</span>
                <span>{formatDate(ticket.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div class="bg-base-200 rounded-xl p-4">
            <h3 class="font-semibold mb-3">Customer</h3>
            <div class="space-y-2 text-sm">
              <div>
                <span class="text-base-content/60">Name:</span>{' '}
                <span class="font-medium">{ticket.user?.name || ticket.guest_name || 'N/A'}</span>
              </div>
              <div>
                <span class="text-base-content/60">Email:</span>{' '}
                <span>{ticket.user?.email || ticket.guest_email}</span>
              </div>
            </div>
          </div>

          {/* Related */}
          {(ticket.booking || ticket.activity) && (
            <div class="bg-base-200 rounded-xl p-4">
              <h3 class="font-semibold mb-3">Related</h3>
              <div class="space-y-2 text-sm">
                {ticket.booking && (
                  <div>
                    <span class="text-base-content/60">Booking:</span>{' '}
                    <Link href={`/vendor/bookings/${ticket.booking.id}`} class="link link-primary">
                      {ticket.booking.booking_number}
                    </Link>
                  </div>
                )}
                {ticket.activity && (
                  <div>
                    <span class="text-base-content/60">Activity:</span> {ticket.activity.title}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Update Status */}
          <div class="bg-base-200 rounded-xl p-4">
            <h3 class="font-semibold mb-3">Update Status</h3>
            <Form action={updateStatusAction}>
              <div class="join w-full">
                <select name="status" class="select select-sm select-bordered join-item flex-1">
                  <option value="in_progress" selected={ticket.status === 'in_progress'}>
                    In Progress
                  </option>
                  <option value="resolved" selected={ticket.status === 'resolved'}>
                    Resolved
                  </option>
                </select>
                <button type="submit" class="btn btn-sm btn-primary join-item">
                  Update
                </button>
              </div>
              <p class="text-xs text-base-content/50 mt-2">
                Note: You can only set status to In Progress or Resolved
              </p>
            </Form>
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
    title: ticket ? `${ticket.ticket_number} | Vendor Portal | Rihigo` : 'Ticket Details | Vendor Portal | Rihigo',
    meta: [
      {
        name: 'description',
        content: 'View and manage support ticket',
      },
    ],
  };
};
