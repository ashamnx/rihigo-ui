import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory } from '~/types/ticket';
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
    return await apiClient.admin.tickets.getById(ticketId, token);
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

    const response = await apiClient.admin.tickets.addMessage(
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

    const response = await apiClient.admin.tickets.updateStatus(ticketId, { status }, token);

    return {
      success: response.success,
      message: response.success
        ? 'Status updated successfully'
        : response.error_message || 'Failed to update status',
    };
  });
});

export const useUpdateTicket = routeAction$(async (data, requestEvent) => {
  const ticketId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const priority = data.priority as TicketPriority | undefined;
    const category = data.category as TicketCategory | undefined;

    const response = await apiClient.admin.tickets.update(ticketId, { priority, category }, token);

    return {
      success: response.success,
      message: response.success
        ? 'Ticket updated successfully'
        : response.error_message || 'Failed to update ticket',
    };
  });
});

export const useAssignTicket = routeAction$(async (data, requestEvent) => {
  const ticketId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    const assignedTo = data.assigned_to as string | undefined;
    const assignedVendorId = data.assigned_vendor_id as string | undefined;

    const response = await apiClient.admin.tickets.assign(
      ticketId,
      { assigned_to: assignedTo || undefined, assigned_vendor_id: assignedVendorId || undefined },
      token
    );

    return {
      success: response.success,
      message: response.success
        ? 'Ticket assigned successfully'
        : response.error_message || 'Failed to assign ticket',
    };
  });
});

export default component$(() => {
  const ticketData = useTicket();
  const addMessageAction = useAddMessage();
  const updateStatusAction = useUpdateStatus();
  const updateTicketAction = useUpdateTicket();
  const assignAction = useAssignTicket();

  const isInternalNote = useSignal(false);
  const messageText = useSignal('');

  const ticket = ticketData.value.ticket;

  if (!ticket) {
    return (
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <Link href="/admin/tickets" class="btn btn-ghost btn-sm">
            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
        </div>
        <div class="bg-base-200 rounded-xl p-12 text-center">
          <div class="size-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
            <svg class="size-8 text-error" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Ticket Not Found</h3>
          <p class="text-base-content/60">{ticketData.value.error || 'The ticket could not be found'}</p>
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
        return <span class="badge badge-xs badge-secondary">Vendor</span>;
      case 'user':
        return <span class="badge badge-xs badge-info">User</span>;
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
        <Link href="/admin/tickets" class="btn btn-ghost btn-sm">
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

      {/* Success/Error Messages */}
      {(addMessageAction.value?.success || updateStatusAction.value?.success || updateTicketAction.value?.success || assignAction.value?.success) && (
        <div class="alert alert-success py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {addMessageAction.value?.message || updateStatusAction.value?.message || updateTicketAction.value?.message || assignAction.value?.message}
          </span>
        </div>
      )}

      {(addMessageAction.value?.success === false || updateStatusAction.value?.success === false || updateTicketAction.value?.success === false || assignAction.value?.success === false) && (
        <div class="alert alert-error py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>
            {addMessageAction.value?.message || updateStatusAction.value?.message || updateTicketAction.value?.message || assignAction.value?.message}
          </span>
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Messages */}
        <div class="lg:col-span-2 space-y-4">
          {/* Original Ticket */}
          <div class="bg-base-200 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="font-medium">
                  {ticket.user?.name || ticket.guest_name || 'Guest'}
                </div>
                <div class="text-xs text-base-content/50">
                  {ticket.user?.email || ticket.guest_email}
                </div>
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
              <h3 class="font-semibold text-sm text-base-content/60">Conversation</h3>
              {ticket.messages.map((msg: TicketMessage) => (
                <div
                  key={msg.id}
                  class={`bg-base-200 rounded-xl p-4 ${msg.is_internal ? 'border-l-4 border-warning' : ''}`}
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm">
                        {msg.sender_name || msg.sender_email || msg.sender_type}
                      </span>
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

        {/* Sidebar - Details & Actions */}
        <div class="space-y-4">
          {/* Ticket Details */}
          <div class="bg-base-200 rounded-xl p-4">
            <h3 class="font-semibold mb-3">Details</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/60">Category</span>
                <span class="badge badge-sm badge-ghost">
                  {TICKET_CATEGORY_LABELS[ticket.category]}
                </span>
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
              {ticket.resolved_at && (
                <div class="flex justify-between">
                  <span class="text-base-content/60">Resolved</span>
                  <span>{formatDate(ticket.resolved_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
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
              {ticket.user_id && (
                <div>
                  <span class="text-base-content/60">User ID:</span>{' '}
                  <span class="font-mono text-xs">{ticket.user_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Related Entities */}
          {(ticket.booking || ticket.activity) && (
            <div class="bg-base-200 rounded-xl p-4">
              <h3 class="font-semibold mb-3">Related</h3>
              <div class="space-y-2 text-sm">
                {ticket.booking && (
                  <div>
                    <span class="text-base-content/60">Booking:</span>{' '}
                    <Link href={`/admin/bookings/${ticket.booking.id}`} class="link link-primary">
                      {ticket.booking.booking_number}
                    </Link>
                    <div class="text-xs text-base-content/50">{ticket.booking.activity_title}</div>
                  </div>
                )}
                {ticket.activity && (
                  <div>
                    <span class="text-base-content/60">Activity:</span>{' '}
                    <Link href={`/admin/activities/${ticket.activity.id}`} class="link link-primary">
                      {ticket.activity.title}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignment */}
          <div class="bg-base-200 rounded-xl p-4">
            <h3 class="font-semibold mb-3">Assignment</h3>
            <div class="text-sm mb-3">
              {ticket.assigned_to_name || ticket.assigned_vendor_name ? (
                <div>
                  <span class="text-base-content/60">Assigned to:</span>{' '}
                  <span class="font-medium">
                    {ticket.assigned_to_name || ticket.assigned_vendor_name}
                  </span>
                </div>
              ) : (
                <span class="text-base-content/50">Unassigned</span>
              )}
            </div>
            <Form action={assignAction}>
              <div class="form-control mb-2">
                <input
                  type="text"
                  name="assigned_to"
                  class="input input-xs input-bordered"
                  placeholder="Admin User ID"
                  value={ticket.assigned_to || ''}
                />
              </div>
              <div class="form-control mb-2">
                <input
                  type="text"
                  name="assigned_vendor_id"
                  class="input input-xs input-bordered"
                  placeholder="Vendor ID"
                  value={ticket.assigned_vendor_id || ''}
                />
              </div>
              <button type="submit" class="btn btn-xs btn-outline w-full">
                Update Assignment
              </button>
            </Form>
          </div>

          {/* Quick Actions */}
          <div class="bg-base-200 rounded-xl p-4">
            <h3 class="font-semibold mb-3">Quick Actions</h3>

            {/* Status Update */}
            <Form action={updateStatusAction} class="mb-3">
              <label class="label py-1">
                <span class="label-text text-xs">Update Status</span>
              </label>
              <div class="join w-full">
                <select name="status" class="select select-xs select-bordered join-item flex-1">
                  <option value="open" selected={ticket.status === 'open'}>Open</option>
                  <option value="in_progress" selected={ticket.status === 'in_progress'}>In Progress</option>
                  <option value="resolved" selected={ticket.status === 'resolved'}>Resolved</option>
                  <option value="closed" selected={ticket.status === 'closed'}>Closed</option>
                </select>
                <button type="submit" class="btn btn-xs btn-primary join-item">
                  Update
                </button>
              </div>
            </Form>

            {/* Priority & Category Update */}
            <Form action={updateTicketAction}>
              <label class="label py-1">
                <span class="label-text text-xs">Priority</span>
              </label>
              <select name="priority" class="select select-xs select-bordered w-full mb-2">
                <option value="low" selected={ticket.priority === 'low'}>Low</option>
                <option value="medium" selected={ticket.priority === 'medium'}>Medium</option>
                <option value="high" selected={ticket.priority === 'high'}>High</option>
                <option value="critical" selected={ticket.priority === 'critical'}>Critical</option>
              </select>

              <label class="label py-1">
                <span class="label-text text-xs">Category</span>
              </label>
              <select name="category" class="select select-xs select-bordered w-full mb-2">
                <option value="booking_issue" selected={ticket.category === 'booking_issue'}>Booking Issue</option>
                <option value="refund" selected={ticket.category === 'refund'}>Refund</option>
                <option value="inquiry" selected={ticket.category === 'inquiry'}>Inquiry</option>
                <option value="complaint" selected={ticket.category === 'complaint'}>Complaint</option>
                <option value="technical" selected={ticket.category === 'technical'}>Technical</option>
                <option value="payment" selected={ticket.category === 'payment'}>Payment</option>
                <option value="other" selected={ticket.category === 'other'}>Other</option>
              </select>

              <button type="submit" class="btn btn-xs btn-outline w-full">
                Update Details
              </button>
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
    title: ticket
      ? `${ticket.ticket_number} - ${ticket.subject} | Admin | Rihigo`
      : 'Ticket Details | Admin | Rihigo',
    meta: [
      {
        name: 'description',
        content: 'View and manage support ticket',
      },
    ],
  };
};
