import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { apiClient, authenticatedRequest } from '~/utils/api-client';
import type { Ticket } from '~/types/ticket';
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

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.vendorPortal.tickets.list(token, {
      page,
      limit: 20,
      status,
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

export default component$(() => {
  const ticketsData = useTickets();

  const filterStatus = useSignal<string>('all');
  const searchTerm = useSignal<string>('');

  const tickets = ticketsData.value.tickets;
  const pagination = ticketsData.value.pagination;

  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesStatus = filterStatus.value === 'all' || ticket.status === filterStatus.value;
    const matchesSearch =
      searchTerm.value === '' ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.value.toLowerCase());

    return matchesStatus && matchesSearch;
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
          <h1 class="text-2xl font-bold">Support</h1>
          <p class="text-base-content/60 mt-1">Tickets assigned to you and platform support</p>
        </div>
        <Link href="/vendor/tickets/new" class="btn btn-primary btn-sm">
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Ticket
        </Link>
      </div>

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
                placeholder="Search tickets..."
                class="input input-sm input-bordered w-full pl-9"
                value={searchTerm.value}
                onInput$={(e) => (searchTerm.value = (e.target as HTMLInputElement).value)}
              />
            </div>
          </div>

          {/* Status filter */}
          <div class="flex gap-1 flex-wrap">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
              <button
                key={status}
                class={`btn btn-sm ${filterStatus.value === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick$={() => (filterStatus.value = status)}
              >
                {status === 'all' ? 'All' : TICKET_STATUS_LABELS[status as keyof typeof TICKET_STATUS_LABELS]}
              </button>
            ))}
          </div>
        </div>
      </div>

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
          <p class="text-base-content/60 mb-4">
            {searchTerm.value || filterStatus.value !== 'all'
              ? 'Try adjusting your filters'
              : 'No tickets have been assigned to you yet'}
          </p>
          <Link href="/vendor/tickets/new" class="btn btn-primary btn-sm">
            Create Platform Support Ticket
          </Link>
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
                  <th>Updated</th>
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
                      <div>
                        <div class="text-sm">{getTimeAgo(ticket.updated_at)}</div>
                        <div class="text-xs text-base-content/50">{formatDate(ticket.updated_at)}</div>
                      </div>
                    </td>
                    <td>
                      <Link href={`/vendor/tickets/${ticket.id}`} class="btn btn-ghost btn-xs">
                        View
                      </Link>
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
                href={`/vendor/tickets?page=${page}`}
                class={`join-item btn btn-sm ${page === pagination.page ? 'btn-active' : ''}`}
              >
                {page}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Support | Vendor Portal | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Manage support tickets',
    },
  ],
};
