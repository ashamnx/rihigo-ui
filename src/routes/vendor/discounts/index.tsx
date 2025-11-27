import { component$, useSignal, useComputed$, $ } from '@builder.io/qwik';
import { routeLoader$, Link, useNavigate } from '@builder.io/qwik-city';
import { authenticatedRequest, apiClient } from '~/utils/api-client';
import type { DiscountRule } from '~/types/discount';
import {
    discountStatusLabels,
    discountStatusColors,
    discountTypeLabels,
    formatDiscountValue,
    hasUsageRemaining,
} from '~/types/discount';

export const useDiscountsLoader = routeLoader$(async (requestEvent) => {
    const url = requestEvent.url;
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const discountType = url.searchParams.get('discount_type') || '';
    const isAutomatic = url.searchParams.get('is_automatic');
    const page = parseInt(url.searchParams.get('page') || '1');

    return authenticatedRequest(requestEvent, async (token) => {
        return apiClient.vendorPortal.discounts.list(token, {
            search: search || undefined,
            status: status || undefined,
            discount_type: discountType || undefined,
            is_automatic: isAutomatic ? isAutomatic === 'true' : undefined,
            page,
            limit: 20,
        });
    });
});

export default component$(() => {
    const discountsData = useDiscountsLoader();
    const nav = useNavigate();

    const searchInput = useSignal('');
    const statusFilter = useSignal('');
    const typeFilter = useSignal('');
    const quickFilter = useSignal<'all' | 'active' | 'promo' | 'automatic'>('all');

    const discounts = useComputed$(() => {
        return discountsData.value.data || [];
    });

    const stats = useComputed$(() => {
        const data = discounts.value as DiscountRule[];
        return {
            total: data.length,
            active: data.filter(d => d.status === 'active').length,
            promoCodes: data.filter(d => d.code).length,
            automatic: data.filter(d => d.is_automatic).length,
        };
    });

    const handleSearch = $(() => {
        const params = new URLSearchParams();
        if (searchInput.value) params.set('search', searchInput.value);
        if (statusFilter.value) params.set('status', statusFilter.value);
        if (typeFilter.value) params.set('discount_type', typeFilter.value);
        nav(`/vendor/discounts?${params.toString()}`);
    });

    const handleQuickFilter = $((filter: 'all' | 'active' | 'promo' | 'automatic') => {
        quickFilter.value = filter;
        const params = new URLSearchParams();
        if (filter === 'active') {
            params.set('status', 'active');
        } else if (filter === 'promo') {
            params.set('is_automatic', 'false');
        } else if (filter === 'automatic') {
            params.set('is_automatic', 'true');
        }
        nav(`/vendor/discounts?${params.toString()}`);
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getValidityDisplay = (discount: DiscountRule) => {
        if (discount.booking_start_date && discount.booking_end_date) {
            return `${formatDate(discount.booking_start_date)} - ${formatDate(discount.booking_end_date)}`;
        }
        if (discount.booking_start_date) {
            return `From ${formatDate(discount.booking_start_date)}`;
        }
        if (discount.booking_end_date) {
            return `Until ${formatDate(discount.booking_end_date)}`;
        }
        return 'No limit';
    };

    const getUsageDisplay = (discount: DiscountRule) => {
        if (discount.usage_limit) {
            return `${discount.current_usage} / ${discount.usage_limit}`;
        }
        return `${discount.current_usage} uses`;
    };

    return (
        <div class="p-6">
            {/* Page Header */}
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Discounts & Promotions</h1>
                    <p class="text-base-content/70">Manage promo codes and automatic discounts</p>
                </div>
                <Link href="/vendor/discounts/new" class="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Discount
                </Link>
            </div>

            {/* Stats Cards */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Total Discounts</div>
                    <div class="stat-value text-xl">{stats.value.total}</div>
                </div>
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Active</div>
                    <div class="stat-value text-xl text-success">{stats.value.active}</div>
                </div>
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Promo Codes</div>
                    <div class="stat-value text-xl text-primary">{stats.value.promoCodes}</div>
                </div>
                <div class="stat bg-base-100 rounded-lg shadow p-4">
                    <div class="stat-title text-xs">Automatic</div>
                    <div class="stat-value text-xl text-accent">{stats.value.automatic}</div>
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
                                placeholder="Search by name or code..."
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
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="expired">Expired</option>
                        <option value="depleted">Depleted</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        class="select select-bordered"
                        value={typeFilter.value}
                        onChange$={(e) => {
                            typeFilter.value = (e.target as HTMLSelectElement).value;
                            handleSearch();
                        }}
                    >
                        <option value="">All Types</option>
                        <option value="percentage">Percentage Off</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="free_nights">Free Nights</option>
                        <option value="free_service">Free Service</option>
                    </select>
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
                        class={`btn btn-sm ${quickFilter.value === 'promo' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick$={() => handleQuickFilter('promo')}
                    >
                        Promo Codes
                    </button>
                    <button
                        class={`btn btn-sm ${quickFilter.value === 'automatic' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick$={() => handleQuickFilter('automatic')}
                    >
                        Automatic
                    </button>
                </div>
            </div>

            {/* Discounts Table */}
            {discounts.value.length === 0 ? (
                <div class="bg-base-100 rounded-lg shadow p-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 class="text-lg font-semibold mb-2">No Discounts Found</h3>
                    <p class="text-base-content/70 mb-4">Create your first discount to start offering promotions</p>
                    <Link href="/vendor/discounts/new" class="btn btn-primary">
                        Create Discount
                    </Link>
                </div>
            ) : (
                <div class="bg-base-100 rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Discount</th>
                                    <th>Type</th>
                                    <th>Value</th>
                                    <th>Validity</th>
                                    <th>Usage</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(discounts.value as DiscountRule[]).map((discount) => (
                                    <tr key={discount.id} class="hover">
                                        <td>
                                            <div class="flex items-center gap-3">
                                                <div class={`p-2 rounded-lg ${discount.is_automatic ? 'bg-accent/10' : 'bg-primary/10'}`}>
                                                    {discount.is_automatic ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <Link href={`/vendor/discounts/${discount.id}`} class="font-medium hover:text-primary">
                                                        {discount.name}
                                                    </Link>
                                                    {discount.code && (
                                                        <div class="flex items-center gap-1 mt-1">
                                                            <span class="badge badge-outline badge-sm font-mono">{discount.code}</span>
                                                        </div>
                                                    )}
                                                    {discount.is_automatic && (
                                                        <div class="text-xs text-accent">Automatic</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="text-sm">{discountTypeLabels[discount.discount_type]}</span>
                                        </td>
                                        <td>
                                            <span class="font-semibold text-primary">
                                                {formatDiscountValue(discount.discount_type, discount.discount_value, 'USD')}
                                            </span>
                                            {discount.max_discount_amount && (
                                                <div class="text-xs text-base-content/50">
                                                    Max: ${discount.max_discount_amount}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div class="text-sm">{getValidityDisplay(discount)}</div>
                                        </td>
                                        <td>
                                            <div class="text-sm">{getUsageDisplay(discount)}</div>
                                            {!hasUsageRemaining(discount) && (
                                                <div class="text-xs text-error">Limit reached</div>
                                            )}
                                        </td>
                                        <td>
                                            <span class={`badge ${discountStatusColors[discount.status]}`}>
                                                {discountStatusLabels[discount.status]}
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
                                                        <Link href={`/vendor/discounts/${discount.id}`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View Details
                                                        </Link>
                                                    </li>
                                                    {discount.status !== 'expired' && discount.status !== 'depleted' && (
                                                        <li>
                                                            <Link href={`/vendor/discounts/${discount.id}?edit=true`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                Edit
                                                            </Link>
                                                        </li>
                                                    )}
                                                    {discount.status === 'active' && (
                                                        <li>
                                                            <button>
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Pause
                                                            </button>
                                                        </li>
                                                    )}
                                                    {discount.status === 'paused' && (
                                                        <li>
                                                            <button>
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Activate
                                                            </button>
                                                        </li>
                                                    )}
                                                    <li>
                                                        <button>
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                            Duplicate
                                                        </button>
                                                    </li>
                                                    <div class="divider my-1"></div>
                                                    <li>
                                                        <button class="text-error">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete
                                                        </button>
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
        </div>
    );
});
