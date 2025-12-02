// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, Link, useNavigate } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { EmptyState } from '~/components/vendor/shared/EmptyState';
import { FilterBar, type FilterDefinition } from '~/components/vendor/shared/FilterBar';
import { ActionDropdown, type Action } from '~/components/vendor/shared/ActionDropdown';
import {
    type Payment,
    type PaymentFilters,
    paymentMethodLabels,
    paymentStatusLabels,
    paymentStatusColors,
} from '~/types/payment';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

interface PaymentListResponse {
    success: boolean;
    data: Payment[];
    total: number;
    page: number;
    limit: number;
}

export const usePaymentsLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const url = requestEvent.url;
            const filters: PaymentFilters = {
                search: url.searchParams.get('search') || undefined,
                status: url.searchParams.get('status') as PaymentFilters['status'] || undefined,
                payment_method: url.searchParams.get('payment_method') as PaymentFilters['payment_method'] || undefined,
                date_from: url.searchParams.get('date_from') || undefined,
                date_to: url.searchParams.get('date_to') || undefined,
                page: parseInt(url.searchParams.get('page') || '1'),
                limit: parseInt(url.searchParams.get('limit') || '20'),
            };

            const response = await apiClient.vendorPortal.payments.list(token, filters);
            return response as PaymentListResponse;
        } catch (error) {
            console.error('Failed to load payments:', error);
            return {
                success: false,
                data: [],
                total: 0,
                page: 1,
                limit: 20,
            };
        }
    });
});

export default component$(() => {
    const paymentsData = usePaymentsLoader();
    const navigate = useNavigate();

    const filters = useSignal<Record<string, string>>({});
    const searchValue = useSignal('');

    const payments = paymentsData.value.data || [];
    const total = paymentsData.value.total || 0;

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
            ],
        },
        {
            key: 'payment_method',
            label: 'Method',
            type: 'select',
            options: [
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'online', label: 'Online' },
            ],
        },
        {
            key: 'date_from',
            label: 'From',
            type: 'date',
        },
        {
            key: 'date_to',
            label: 'To',
            type: 'date',
        },
    ];

    const handleFilterChange = $((key: string, value: string) => {
        filters.value = { ...filters.value, [key]: value };
        applyFilters();
    });

    const handleSearch = $((value: string) => {
        searchValue.value = value;
        applyFilters();
    });

    const handleReset = $(() => {
        filters.value = {};
        searchValue.value = '';
        navigate('/vendor/payments');
    });

    const applyFilters = $(() => {
        const params = new URLSearchParams();
        if (searchValue.value) params.set('search', searchValue.value);
        Object.entries(filters.value).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const queryString = params.toString();
        navigate(`/vendor/payments${queryString ? `?${queryString}` : ''}`);
    });

    const getPaymentActions = $((payment: Payment): Action[] => {
        const actions: Action[] = [
            {
                label: 'View Details',
                icon: 'view',
                onClick$: $(() => navigate(`/vendor/payments/${payment.id}`)),
            },
        ];

        if (payment.status === 'completed') {
            actions.push({
                label: 'Issue Refund',
                icon: 'refund',
                onClick$: $(() => navigate(`/vendor/refunds/new?payment_id=${payment.id}`)),
            });
        }

        if (payment.invoice_id) {
            actions.push({
                label: 'View Invoice',
                icon: 'document',
                dividerBefore: true,
                onClick$: $(() => navigate(`/vendor/invoices/${payment.invoice_id}`)),
            });
        }

        actions.push({
            label: 'Download Receipt',
            icon: 'download',
            onClick$: $(() => {
                window.open(`/api/vendor/payments/${payment.id}/receipt`, '_blank');
            }),
        });

        return actions;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    // Format payment amount with exchange rate info
    const formatPaymentAmount = (payment: Payment) => {
        const amount = payment.amount;
        const currency = payment.currency || 'USD';

        // If payment was in a different currency, show both
        if (currency !== 'USD' && payment.exchange_rate && payment.amount_in_base_currency) {
            return {
                primary: formatCurrency(amount, currency),
                secondary: `${formatCurrency(payment.amount_in_base_currency, 'USD')} USD`,
                hasExchange: true,
            };
        }
        return {
            primary: formatCurrency(amount, currency),
            secondary: null,
            hasExchange: false,
        };
    };

    // Calculate stats
    const totalReceived = payments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

    return (
        <div>
            <PageHeader
                title="Payments"
                subtitle={`${total} payment${total !== 1 ? 's' : ''} recorded`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Payments' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/payments/new" class="btn btn-primary btn-sm">
                    <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Record Payment
                </Link>
            </PageHeader>

            {/* Filters */}
            <FilterBar
                filters={filterDefinitions}
                values={filters.value}
                onChange$={handleFilterChange}
                onReset$={handleReset}
                searchPlaceholder="Search by payment #, payer..."
                onSearch$={handleSearch}
                searchValue={searchValue.value}
            />

            {/* Quick Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Total Received</div>
                    <div class="stat-value text-lg text-success">{formatCurrency(totalReceived)}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Completed</div>
                    <div class="stat-value text-lg">
                        {payments.filter((p) => p.status === 'completed').length}
                    </div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Pending</div>
                    <div class="stat-value text-lg text-warning">
                        {payments.filter((p) => p.status === 'pending').length}
                    </div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Refunded</div>
                    <div class="stat-value text-lg">
                        {payments.filter((p) => p.status === 'refunded' || p.status === 'partially_refunded').length}
                    </div>
                </div>
            </div>

            {/* Payment List */}
            {payments.length === 0 ? (
                <EmptyState
                    title="No payments found"
                    description="Record your first payment or wait for online payments."
                    icon="payment"
                >
                    <Link q:slot="action" href="/vendor/payments/new" class="btn btn-primary btn-sm">
                        Record Payment
                    </Link>
                </EmptyState>
            ) : (
                <div class="overflow-x-auto">
                    <table class="table table-zebra bg-base-100">
                        <thead>
                            <tr>
                                <th>Payment</th>
                                <th>Payer</th>
                                <th>Date</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Invoice</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>
                                        <Link
                                            href={`/vendor/payments/${payment.id}`}
                                            class="font-medium hover:text-primary"
                                        >
                                            {payment.payment_number}
                                        </Link>
                                        {payment.transaction_id && (
                                            <div class="text-xs text-base-content/60 font-mono">
                                                {payment.transaction_id.slice(0, 12)}...
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div>{payment.payer_name}</div>
                                        {payment.payer_email && (
                                            <div class="text-xs text-base-content/60">
                                                {payment.payer_email}
                                            </div>
                                        )}
                                    </td>
                                    <td>{formatDate(payment.payment_date)}</td>
                                    <td>
                                        <div class="flex items-center gap-2">
                                            <span class="badge badge-ghost badge-sm">
                                                {paymentMethodLabels[payment.payment_method]}
                                            </span>
                                            {payment.card_brand && payment.card_last_four && (
                                                <span class="text-xs text-base-content/60">
                                                    {payment.card_brand} ****{payment.card_last_four}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td class="font-medium">
                                        <div>{formatPaymentAmount(payment).primary}</div>
                                        {formatPaymentAmount(payment).hasExchange && (
                                            <div class="text-xs text-base-content/50">
                                                {formatPaymentAmount(payment).secondary}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span class={`badge badge-sm ${paymentStatusColors[payment.status]}`}>
                                            {paymentStatusLabels[payment.status]}
                                        </span>
                                    </td>
                                    <td>
                                        {payment.invoice ? (
                                            <Link
                                                href={`/vendor/invoices/${payment.invoice_id}`}
                                                class="link link-primary text-sm"
                                            >
                                                {payment.invoice.invoice_number}
                                            </Link>
                                        ) : (
                                            <span class="text-base-content/50">-</span>
                                        )}
                                    </td>
                                    <td>
                                        <ActionDropdown actions={getPaymentActions(payment)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
});
