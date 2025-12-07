import { component$, useSignal } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, Link, useLocation } from '@builder.io/qwik-city';
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
  const session = requestEvent.sharedMap.get('session');
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(requestEvent.url.pathname);
    throw requestEvent.redirect(302, `/auth/sign-in?callbackUrl=${callbackUrl}`);
  }

  const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
  const status = requestEvent.url.searchParams.get('status') || undefined;

  const response = await authenticatedRequest(requestEvent, async (token) => {
    return await apiClient.tickets.list(token, {
      page,
      page_size: 10,
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
  const location = useLocation();
  const lang = location.params.lang || 'en-US';
  const ticketsData = useTickets();

  const filterStatus = useSignal<string>('all');

  const tickets = ticketsData.value.tickets;
  const pagination = ticketsData.value.pagination;

  const filteredTickets = tickets.filter((ticket: Ticket) => {
    return filterStatus.value === 'all' || ticket.status === filterStatus.value;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div class="min-h-screen bg-base-100">
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold">My Support Tickets</h1>
            <p class="text-base-content/60 mt-1">Track and manage your support requests</p>
          </div>
          <Link href={`/${lang}/support/tickets/new`} class="btn btn-primary">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Ticket
          </Link>
        </div>

        {/* Filters */}
        <div class="flex gap-2 mb-6 flex-wrap">
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

        {/* Tickets List */}
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
              {filterStatus.value !== 'all'
                ? 'No tickets match your filter'
                : "You haven't created any support tickets yet"}
            </p>
            <Link href={`/${lang}/support/tickets/new`} class="btn btn-primary">
              Create Your First Ticket
            </Link>
          </div>
        ) : (
          <div class="space-y-4">
            {filteredTickets.map((ticket: Ticket) => (
              <Link
                key={ticket.id}
                href={`/${lang}/support/tickets/${ticket.id}`}
                class="block bg-base-200 rounded-xl p-4 hover:bg-base-300 transition-colors"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-mono text-xs text-base-content/50">
                        {ticket.ticket_number}
                      </span>
                      <span class={`badge badge-sm ${TICKET_STATUS_COLORS[ticket.status]}`}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </span>
                      <span class={`badge badge-sm ${TICKET_PRIORITY_COLORS[ticket.priority]}`}>
                        {TICKET_PRIORITY_LABELS[ticket.priority]}
                      </span>
                    </div>
                    <h3 class="font-medium truncate">{ticket.subject}</h3>
                    <div class="flex items-center gap-3 mt-2 text-sm text-base-content/60">
                      <span class="badge badge-ghost badge-sm">
                        {TICKET_CATEGORY_LABELS[ticket.category]}
                      </span>
                      <span>{formatDate(ticket.created_at)}</span>
                      {ticket.messages && ticket.messages.length > 0 && (
                        <span class="flex items-center gap-1">
                          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                          {ticket.messages.length} messages
                        </span>
                      )}
                    </div>
                  </div>
                  <div class="text-right text-sm text-base-content/50">
                    <div>{getTimeAgo(ticket.updated_at)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div class="flex justify-center mt-8">
            <div class="join">
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                <a
                  key={page}
                  href={`/${lang}/support/tickets?page=${page}`}
                  class={`join-item btn btn-sm ${page === pagination.page ? 'btn-active' : ''}`}
                >
                  {page}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'My Support Tickets | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'View and manage your support tickets',
    },
  ],
};
