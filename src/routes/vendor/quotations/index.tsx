import { component$, useSignal, useComputed$, $ } from '@builder.io/qwik';
import { routeLoader$, Link, useNavigate } from '@builder.io/qwik-city';
import { authenticatedRequest, apiClient } from '~/utils/api-client';
import type { Quotation } from '~/types/quotation';
import { quotationStatusLabels, quotationStatusColors } from '~/types/quotation';

export const useQuotationsLoader = routeLoader$(async (requestEvent) => {
    const url = requestEvent.url;
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const dateFrom = url.searchParams.get('date_from') || '';
    const dateTo = url.searchParams.get('date_to') || '';
    const page = parseInt(url.searchParams.get('page') || '1');

    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.quotations.list(token, {
            search: search || undefined,
            status: status || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page,
            limit: 20,
        });
    });
});

export default component$(() => {
    const quotationsData = useQuotationsLoader();
    const nav = useNavigate();

    const searchInput = useSignal('');
    const statusFilter = useSignal('');
    const dateFromFilter = useSignal('');
    const dateToFilter = useSignal('');
    const quickFilter = useSignal<'all' | 'active' | 'expired' | 'converted'>('all');

    const quotations = useComputed$(() => {
        return quotationsData.value.data || [];
    });

    const stats = useComputed$(() => {
        const data = quotations.value as Quotation[];
        return {
            total: data.length,
            draft: data.filter(q => q.status === 'draft').length,
            pending: data.filter(q => ['sent', 'viewed'].includes(q.status)).length,
            accepted: data.filter(q => q.status === 'accepted').length,
            totalValue: data.reduce((sum, q) => sum + q.total, 0),
        };
    });

    const handleSearch = $(() => {
        const params = new URLSearchParams();
        if (searchInput.value) params.set('search', searchInput.value);
        if (statusFilter.value) params.set('status', statusFilter.value);
        if (dateFromFilter.value) params.set('date_from', dateFromFilter.value);
        if (dateToFilter.value) params.set('date_to', dateToFilter.value);
        nav(`/vendor/quotations?${params.toString()}`);
    });

    const handleQuickFilter = $((filter: 'all' | 'active' | 'expired' | 'converted') => {
        quickFilter.value = filter;
        const params = new URLSearchParams();
        if (filter === 'active') {
            params.set('status', 'sent');
        } else if (filter === 'expired') {
            params.set('status', 'expired');
        } else if (filter === 'converted') {
            params.set('status', 'converted');
        }
        nav(`/vendor/quotations?${params.toString()}`);
    });

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isExpiringSoon = (validUntil: string) => {
        const expiryDate = new Date(validUntil);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    };

    const isExpired = (validUntil: string) => {
        return new Date(validUntil) < new Date();
    };

    return (
        <div class="p-6">
            {/* Page Header */}
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Quotations</h1>
                    <p class="text-base-content/70">Create and manage quotations for your customers</p>
                </div>
                <Link href="/vendor/quotations/new" class="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Quotation
                </Link>
            </div>

            {/* Stats Cards */}
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Total</div>
                    <div class="stat-value text-xl">{stats.value.total}</div>
                </div>
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Draft</div>
                    <div class="stat-value text-xl text-base-content/50">{stats.value.draft}</div>
                </div>
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Pending</div>
                    <div class="stat-value text-xl text-info">{stats.value.pending}</div>
                </div>
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Accepted</div>
                    <div class="stat-value text-xl text-success">{stats.value.accepted}</div>
                </div>
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Total Value</div>
                    <div class="stat-value text-lg">{formatCurrency(stats.value.totalValue)}</div>
                </div>
            </div>

            {/* Filters */}
            <div class="bg-base-100 rounded-lg shadow p-4 mb-6">
                <div class="flex flex-wrap gap-4">
                    {/* Search */}
                    <div class="form-control flex-1 min-w-[200px]">
                        <div class="input-group">
                            <input
                                type="text"
                                placeholder="Search by number or customer..."
                                class="input input-bordered w-full"
                                value={searchInput.value}
                                onInput$={(e) => searchInput.value = (e.target as HTMLInputElement).value}
                                onKeyUp$={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                            <button class="btn btn-square" onClick$={handleSearch}>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        class="select select-bordered"
                        value={statusFilter.value}
                        onChange$={(e) => {
                            statusFilter.value = (e.target as HTMLSelectElement).value;
                            handleSearch();
                        }}
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="viewed">Viewed</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="expired">Expired</option>
                        <option value="converted">Converted</option>
                    </select>

                    {/* Date Range */}
                    <input
                        type="date"
                        class="input input-bordered"
                        placeholder="From Date"
                        value={dateFromFilter.value}
                        onChange$={(e) => {
                            dateFromFilter.value = (e.target as HTMLInputElement).value;
                            handleSearch();
                        }}
                    />
                    <input
                        type="date"
                        class="input input-bordered"
                        placeholder="To Date"
                        value={dateToFilter.value}
                        onChange$={(e) => {
                            dateToFilter.value = (e.target as HTMLInputElement).value;
                            handleSearch();
                        }}
                    />
                </div>

                {/* Quick Filters */}
                <div class="flex gap-2 mt-4">
                    <button
                        class={`btn btn-sm ${quickFilter.value === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick$={() => handleQuickFilter('all')}
                    >
                        All
                    </button>
                    <button
                        class={`btn btn-sm ${quickFilter.value === 'active' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick$={() => handleQuickFilter('active')}
                    >
                        Active
                    </button>
                    <button
                        class={`btn btn-sm ${quickFilter.value === 'expired' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick$={() => handleQuickFilter('expired')}
                    >
                        Expired
                    </button>
                    <button
                        class={`btn btn-sm ${quickFilter.value === 'converted' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick$={() => handleQuickFilter('converted')}
                    >
                        Converted
                    </button>
                </div>
            </div>

            {/* Quotations Table */}
            {quotations.value.length === 0 ? (
                <div class="bg-base-100 rounded-lg shadow p-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 class="text-lg font-semibold mb-2">No Quotations Found</h3>
                    <p class="text-base-content/70 mb-4">Create your first quotation to start tracking proposals</p>
                    <Link href="/vendor/quotations/new" class="btn btn-primary">
                        Create Quotation
                    </Link>
                </div>
            ) : (
                <div class="bg-base-100 rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Quotation</th>
                                    <th>Customer</th>
                                    <th>Issue Date</th>
                                    <th>Valid Until</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(quotations.value as Quotation[]).map((quotation) => (
                                    <tr key={quotation.id} class="hover">
                                        <td>
                                            <Link href={`/vendor/quotations/${quotation.id}`} class="font-medium hover:text-primary">
                                                {quotation.quotation_number}
                                            </Link>
                                            {quotation.service_type && (
                                                <div class="text-xs text-base-content/50 capitalize">
                                                    {quotation.service_type}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div class="font-medium">{quotation.customer_name}</div>
                                            {quotation.customer_company && (
                                                <div class="text-xs text-base-content/50">
                                                    {quotation.customer_company}
                                                </div>
                                            )}
                                            <div class="text-xs text-base-content/50">
                                                {quotation.customer_email}
                                            </div>
                                        </td>
                                        <td>{formatDate(quotation.issue_date)}</td>
                                        <td>
                                            <div class={`${isExpired(quotation.valid_until) ? 'text-error' : isExpiringSoon(quotation.valid_until) ? 'text-warning' : ''}`}>
                                                {formatDate(quotation.valid_until)}
                                            </div>
                                            {isExpiringSoon(quotation.valid_until) && !isExpired(quotation.valid_until) && (
                                                <div class="text-xs text-warning">Expiring soon</div>
                                            )}
                                            {isExpired(quotation.valid_until) && quotation.status !== 'expired' && (
                                                <div class="text-xs text-error">Expired</div>
                                            )}
                                        </td>
                                        <td class="font-semibold">
                                            {formatCurrency(quotation.total, quotation.currency)}
                                        </td>
                                        <td>
                                            <span class={`badge ${quotationStatusColors[quotation.status]}`}>
                                                {quotationStatusLabels[quotation.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="dropdown dropdown-end">
                                                <label tabIndex={0} class="btn btn-ghost btn-sm btn-square">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                    </svg>
                                                </label>
                                                <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                                    <li>
                                                        <Link href={`/vendor/quotations/${quotation.id}`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View Details
                                                        </Link>
                                                    </li>
                                                    {quotation.status === 'draft' && (
                                                        <li>
                                                            <Link href={`/vendor/quotations/${quotation.id}?edit=true`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                Edit
                                                            </Link>
                                                        </li>
                                                    )}
                                                    {(quotation.status === 'draft' || quotation.status === 'sent') && (
                                                        <li>
                                                            <button>
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                                Send to Customer
                                                            </button>
                                                        </li>
                                                    )}
                                                    {quotation.status === 'accepted' && (
                                                        <li>
                                                            <button>
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                </svg>
                                                                Convert to Booking
                                                            </button>
                                                        </li>
                                                    )}
                                                    <li>
                                                        <button>
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                            Download PDF
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button>
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            Duplicate
                                                        </button>
                                                    </li>
                                                    {quotation.status === 'draft' && (
                                                        <>
                                                            <div class="divider my-1"></div>
                                                            <li>
                                                                <button class="text-error">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                    Delete
                                                                </button>
                                                            </li>
                                                        </>
                                                    )}
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
        </div>
    );
});
