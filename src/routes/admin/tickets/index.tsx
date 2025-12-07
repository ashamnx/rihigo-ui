import { component$, useSignal, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { Ticket, TicketSummary, TicketStatus, TicketPriority, TicketCategory } from '~/types/ticket';
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
  TICKET_CATEGORY_LABELS,
} from '~/types/ticket';

export const useTickets = routeLoader$(async (requestEvent) => {
  const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
  const status = requestEvent.url.searchParams.get('status') || undefined;
  const priority = requestEvent.url.searchParams.get('priority') || undefined;
  const category = requestEvent.url.searchParams.get('category') || undefined;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.admin.tickets.list(token, {
      page,
      page_size: 20,
      status: status as TicketStatus | undefined,
      priority: priority as TicketPriority | undefined,
      category: category as TicketCategory | undefined,
    });
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error_message || 'Failed to load tickets',
      tickets: [] as Ticket[],
      pagination: null,
    };
  }

  return {
    success: true,
    error: null,
    tickets: (response.data || []) as Ticket[],
    pagination: response.pagination_data,
  };
});

export const useTicketSummary = routeLoader$(async (requestEvent) => {
  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.admin.tickets.getSummary(token);
  });

  if (!response.success) {
    return null;
  }

  return response.data as TicketSummary;
});

export const useUpdateStatus = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const ticketId = data.ticket_id as string;
    const status = data.status as TicketStatus;

    const response = await apiClient.admin.tickets.updateStatus(ticketId, { status }, token);

    return {
      success: response.success,
      message: response.success
        ? 'Ticket status updated successfully'
        : response.error_message || 'Failed to update ticket status',
    };
  });
});

export const useAssignTicket = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const ticketId = data.ticket_id as string;
    const assignedTo = data.assigned_to as string | undefined;
    const assignedVendorId = data.assigned_vendor_id as string | undefined;

    const response = await apiClient.admin.tickets.assign(
      ticketId,
      {
        assigned_to: assignedTo || undefined,
        assigned_vendor_id: assignedVendorId || undefined,
      },
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

export const useUpdateTicket = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const ticketId = data.ticket_id as string;
    const priority = data.priority as TicketPriority | undefined;
    const category = data.category as TicketCategory | undefined;

    const response = await apiClient.admin.tickets.update(
      ticketId,
      { priority, category },
      token
    );

    return {
      success: response.success,
      message: response.success
        ? 'Ticket updated successfully'
        : response.error_message || 'Failed to update ticket',
    };
  });
});

export default component$(() => {
  const ticketsData = useTickets();
  const summary = useTicketSummary();
  const updateStatusAction = useUpdateStatus();
  const assignAction = useAssignTicket();
  const updateAction = useUpdateTicket();

  const filterStatus = useSignal<string>('all');
  const filterPriority = useSignal<string>('all');
  const filterCategory = useSignal<string>('all');
  const searchTerm = useSignal<string>('');
  const selectedTicket = useSignal<Ticket | null>(null);
  const showStatusModal = useSignal(false);
  const showAssignModal = useSignal(false);
  const showEditModal = useSignal(false);

  const tickets = ticketsData.value.tickets;
  const pagination = ticketsData.value.pagination;

  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesStatus = filterStatus.value === 'all' || ticket.status === filterStatus.value;
    const matchesPriority = filterPriority.value === 'all' || ticket.priority === filterPriority.value;
    const matchesCategory = filterCategory.value === 'all' || ticket.category === filterCategory.value;
    const matchesSearch =
      searchTerm.value === '' ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      ticket.user?.name?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      ticket.guest_email?.toLowerCase().includes(searchTerm.value.toLowerCase());

    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  const openStatusModal = $((ticket: Ticket) => {
    selectedTicket.value = ticket;
    showStatusModal.value = true;
  });

  const closeStatusModal = $(() => {
    selectedTicket.value = null;
    showStatusModal.value = false;
  });

  const openAssignModal = $((ticket: Ticket) => {
    selectedTicket.value = ticket;
    showAssignModal.value = true;
  });

  const closeAssignModal = $(() => {
    selectedTicket.value = null;
    showAssignModal.value = false;
  });

  const openEditModal = $((ticket: Ticket) => {
    selectedTicket.value = ticket;
    showEditModal.value = true;
  });

  const closeEditModal = $(() => {
    selectedTicket.value = null;
    showEditModal.value = false;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Support Tickets</h1>
          <p class="text-base-content/60 mt-1">Manage customer support requests</p>
        </div>
      </div>

      {/* Stats */}
      {summary.value && (
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="bg-base-200 rounded-xl p-4">
            <p class="text-base-content/60 text-sm">Total</p>
            <p class="text-2xl font-bold mt-1">{summary.value.total}</p>
          </div>
          <div class="bg-base-200 rounded-xl p-4">
            <p class="text-base-content/60 text-sm">Open</p>
            <p class="text-2xl font-bold mt-1 text-info">{summary.value.by_status.open}</p>
          </div>
          <div class="bg-base-200 rounded-xl p-4">
            <p class="text-base-content/60 text-sm">In Progress</p>
            <p class="text-2xl font-bold mt-1 text-warning">{summary.value.by_status.in_progress}</p>
          </div>
          <div class="bg-base-200 rounded-xl p-4">
            <p class="text-base-content/60 text-sm">Resolved</p>
            <p class="text-2xl font-bold mt-1 text-success">{summary.value.by_status.resolved}</p>
          </div>
          <div class="bg-base-200 rounded-xl p-4">
            <p class="text-base-content/60 text-sm">Critical</p>
            <p class="text-2xl font-bold mt-1 text-error">{summary.value.by_priority.critical}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div class="bg-base-200 rounded-xl p-4">
        <div class="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div class="flex-1">
            <div class="relative">
              <svg
                class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by ticket #, subject, or customer..."
                class="input input-sm input-bordered w-full pl-9"
                value={searchTerm.value}
                onInput$={(e) => (searchTerm.value = (e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          {/* Status filter */}
          <select
            class="select select-sm select-bordered"
            value={filterStatus.value}
            onChange$={(e) => (filterStatus.value = (e.target as HTMLSelectElement).value)}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority filter */}
          <select
            class="select select-sm select-bordered"
            value={filterPriority.value}
            onChange$={(e) => (filterPriority.value = (e.target as HTMLSelectElement).value)}
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category filter */}
          <select
            class="select select-sm select-bordered"
            value={filterCategory.value}
            onChange$={(e) => (filterCategory.value = (e.target as HTMLSelectElement).value)}
          >
            <option value="all">All Categories</option>
            <option value="booking_issue">Booking Issue</option>
            <option value="refund">Refund</option>
            <option value="inquiry">Inquiry</option>
            <option value="complaint">Complaint</option>
            <option value="technical">Technical</option>
            <option value="payment">Payment</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Success/Error Messages */}
      {(updateStatusAction.value?.success ||
        assignAction.value?.success ||
        updateAction.value?.success) && (
        <div class="alert alert-success py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {updateStatusAction.value?.message ||
              assignAction.value?.message ||
              updateAction.value?.message}
          </span>
        </div>
      )}

      {(updateStatusAction.value?.success === false ||
        assignAction.value?.success === false ||
        updateAction.value?.success === false) && (
        <div class="alert alert-error py-2">
          <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <span>
            {updateStatusAction.value?.message ||
              assignAction.value?.message ||
              updateAction.value?.message}
          </span>
        </div>
      )}

      {/* Tickets Table */}
      {filteredTickets.length === 0 ? (
        <div class="bg-base-200 rounded-xl p-12 text-center">
          <div class="size-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
            <svg
              class="size-8 text-base-content/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">No tickets found</h3>
          <p class="text-base-content/60">
            {searchTerm.value || filterStatus.value !== 'all' || filterPriority.value !== 'all'
              ? 'Try adjusting your filters'
              : 'No support tickets have been created yet'}
          </p>
        </div>
      ) : (
        <div class="bg-base-200 rounded-xl overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="border-base-300">
                  <th>Ticket</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Created</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket: Ticket) => (
                  <tr key={ticket.id} class="hover border-base-300">
                    <td>
                      <div>
                        <div class="font-mono text-xs text-base-content/60">
                          {ticket.ticket_number}
                        </div>
                        <div class="font-medium truncate max-w-[200px]" title={ticket.subject}>
                          {ticket.subject}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div class="font-medium">
                          {ticket.user?.name || ticket.guest_name || 'Guest'}
                        </div>
                        <div class="text-xs text-base-content/50">
                          {ticket.user?.email || ticket.guest_email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-sm badge-ghost">
                        {TICKET_CATEGORY_LABELS[ticket.category]}
                      </span>
                    </td>
                    <td>
                      <span class={`badge badge-sm ${TICKET_PRIORITY_COLORS[ticket.priority]}`}>
                        {TICKET_PRIORITY_LABELS[ticket.priority]}
                      </span>
                    </td>
                    <td>
                      <span class={`badge badge-sm ${TICKET_STATUS_COLORS[ticket.status]}`}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </span>
                    </td>
                    <td>
                      <div class="text-sm">
                        {ticket.assigned_to_name ||
                          ticket.assigned_vendor_name || (
                            <span class="text-base-content/40">Unassigned</span>
                          )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div class="text-sm">{getTimeAgo(ticket.created_at)}</div>
                        <div class="text-xs text-base-content/50">{formatDate(ticket.created_at)}</div>
                      </div>
                    </td>
                    <td>
                      <div class="dropdown dropdown-end">
                        <button class="btn btn-ghost btn-xs">
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
                              d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                            />
                          </svg>
                        </button>
                        <ul class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-lg w-40">
                          <li>
                            <Link href={`/admin/tickets/${ticket.id}`}>View Details</Link>
                          </li>
                          <li>
                            <button onClick$={() => openStatusModal(ticket)}>Update Status</button>
                          </li>
                          <li>
                            <button onClick$={() => openEditModal(ticket)}>Edit Ticket</button>
                          </li>
                          <li>
                            <button onClick$={() => openAssignModal(ticket)}>Assign</button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div class="flex justify-center">
          <div class="join">
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
              <a
                key={page}
                href={`/admin/tickets?page=${page}`}
                class={`join-item btn btn-sm ${page === pagination.page ? 'btn-active' : ''}`}
              >
                {page}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal.value && selectedTicket.value && (
        <div class="modal modal-open">
          <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4">Update Status</h3>

            <div class="mb-4 p-3 bg-base-200 rounded-lg">
              <p class="font-mono text-xs text-base-content/60">{selectedTicket.value.ticket_number}</p>
              <p class="font-medium">{selectedTicket.value.subject}</p>
            </div>

            <Form action={updateStatusAction} onSubmitCompleted$={closeStatusModal}>
              <input type="hidden" name="ticket_id" value={selectedTicket.value.id} />

              <div class="form-control mb-4">
                <label class="label py-1">
                  <span class="label-text text-sm">Status</span>
                </label>
                <select name="status" class="select select-sm select-bordered" required>
                  <option value="open" selected={selectedTicket.value.status === 'open'}>
                    Open
                  </option>
                  <option value="in_progress" selected={selectedTicket.value.status === 'in_progress'}>
                    In Progress
                  </option>
                  <option value="resolved" selected={selectedTicket.value.status === 'resolved'}>
                    Resolved
                  </option>
                  <option value="closed" selected={selectedTicket.value.status === 'closed'}>
                    Closed
                  </option>
                </select>
              </div>

              <div class="modal-action">
                <button type="button" class="btn btn-ghost btn-sm" onClick$={closeStatusModal}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary btn-sm">
                  Update
                </button>
              </div>
            </Form>
          </div>
          <div class="modal-backdrop bg-base-300/50" onClick$={closeStatusModal}></div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {showEditModal.value && selectedTicket.value && (
        <div class="modal modal-open">
          <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4">Edit Ticket</h3>

            <div class="mb-4 p-3 bg-base-200 rounded-lg">
              <p class="font-mono text-xs text-base-content/60">{selectedTicket.value.ticket_number}</p>
              <p class="font-medium">{selectedTicket.value.subject}</p>
            </div>

            <Form action={updateAction} onSubmitCompleted$={closeEditModal}>
              <input type="hidden" name="ticket_id" value={selectedTicket.value.id} />

              <div class="form-control mb-3">
                <label class="label py-1">
                  <span class="label-text text-sm">Priority</span>
                </label>
                <select name="priority" class="select select-sm select-bordered">
                  <option value="low" selected={selectedTicket.value.priority === 'low'}>
                    Low
                  </option>
                  <option value="medium" selected={selectedTicket.value.priority === 'medium'}>
                    Medium
                  </option>
                  <option value="high" selected={selectedTicket.value.priority === 'high'}>
                    High
                  </option>
                  <option value="critical" selected={selectedTicket.value.priority === 'critical'}>
                    Critical
                  </option>
                </select>
              </div>

              <div class="form-control mb-4">
                <label class="label py-1">
                  <span class="label-text text-sm">Category</span>
                </label>
                <select name="category" class="select select-sm select-bordered">
                  <option value="booking_issue" selected={selectedTicket.value.category === 'booking_issue'}>
                    Booking Issue
                  </option>
                  <option value="refund" selected={selectedTicket.value.category === 'refund'}>
                    Refund Request
                  </option>
                  <option value="inquiry" selected={selectedTicket.value.category === 'inquiry'}>
                    General Inquiry
                  </option>
                  <option value="complaint" selected={selectedTicket.value.category === 'complaint'}>
                    Complaint
                  </option>
                  <option value="technical" selected={selectedTicket.value.category === 'technical'}>
                    Technical Issue
                  </option>
                  <option value="payment" selected={selectedTicket.value.category === 'payment'}>
                    Payment Issue
                  </option>
                  <option value="other" selected={selectedTicket.value.category === 'other'}>
                    Other
                  </option>
                </select>
              </div>

              <div class="modal-action">
                <button type="button" class="btn btn-ghost btn-sm" onClick$={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary btn-sm">
                  Save
                </button>
              </div>
            </Form>
          </div>
          <div class="modal-backdrop bg-base-300/50" onClick$={closeEditModal}></div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal.value && selectedTicket.value && (
        <div class="modal modal-open">
          <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4">Assign Ticket</h3>

            <div class="mb-4 p-3 bg-base-200 rounded-lg">
              <p class="font-mono text-xs text-base-content/60">{selectedTicket.value.ticket_number}</p>
              <p class="font-medium">{selectedTicket.value.subject}</p>
            </div>

            <Form action={assignAction} onSubmitCompleted$={closeAssignModal}>
              <input type="hidden" name="ticket_id" value={selectedTicket.value.id} />

              <div class="form-control mb-3">
                <label class="label py-1">
                  <span class="label-text text-sm">Assign to Admin (User ID)</span>
                </label>
                <input
                  type="text"
                  name="assigned_to"
                  class="input input-sm input-bordered"
                  placeholder="Enter admin user ID"
                  value={selectedTicket.value.assigned_to || ''}
                />
              </div>

              <div class="divider text-xs">OR</div>

              <div class="form-control mb-4">
                <label class="label py-1">
                  <span class="label-text text-sm">Assign to Vendor (Vendor ID)</span>
                </label>
                <input
                  type="text"
                  name="assigned_vendor_id"
                  class="input input-sm input-bordered"
                  placeholder="Enter vendor ID"
                  value={selectedTicket.value.assigned_vendor_id || ''}
                />
              </div>

              <div class="modal-action">
                <button type="button" class="btn btn-ghost btn-sm" onClick$={closeAssignModal}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary btn-sm">
                  Assign
                </button>
              </div>
            </Form>
          </div>
          <div class="modal-backdrop bg-base-300/50" onClick$={closeAssignModal}></div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Support Tickets | Admin | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Manage customer support tickets',
    },
  ],
};
