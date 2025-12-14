import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, Link, type DocumentHead } from '@builder.io/qwik-city';
import { authenticatedRequest, apiClient } from '~/utils/api-client';
import type { CustomerPayment } from '~/types/customer-payment';
import { paymentStatusColors } from '~/types/customer-payment';

export const usePayments = routeLoader$(async (requestEvent) => {
    const page = parseInt(requestEvent.url.searchParams.get('page') || '1');
    const status = requestEvent.url.searchParams.get('status') || undefined;

    const response = await authenticatedRequest(requestEvent, (token) =>
        apiClient.admin.payments.list(token, {
            page,
            page_size: 20,
            status,
            include_booking: true,
        })
    );

    if (!response.success) {
        return {
            success: false,
            error: response.error_message || 'Failed to load payments',
            payments: [] as CustomerPayment[],
        };
    }

    return {
        success: true,
        error: null,
        payments: (response.data || []) as CustomerPayment[],
        pagination: response.pagination_data,
    };
});

export const useSyncPayment = routeAction$(async (data, requestEvent) => {
    const paymentId = data.payment_id as string;

    return authenticatedRequest(requestEvent, (token) =>
        apiClient.admin.payments.sync(paymentId, token)
    );
});

export default component$(() => {
    const paymentsData = usePayments();
    const syncAction = useSyncPayment();

    const filterStatus = useSignal<string>('all');
    const searchTerm = useSignal<string>('');

    const payments = paymentsData.value.payments;
    const pagination = paymentsData.value.pagination;

    const filteredPayments = payments.filter((payment: CustomerPayment) => {
        const matchesStatus = filterStatus.value === 'all' || payment.status === filterStatus.value;
        const matchesSearch =
            searchTerm.value === '' ||
            payment.id.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            payment.transaction_id.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
            payment.booking?.customer_info.name.toLowerCase().includes(searchTerm.value.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    const getStatusStyle = (status: string) => {
        return paymentStatusColors[status as keyof typeof paymentStatusColors] || 'badge-ghost';
    };

    const formatCurrency = (amount: number, currency: string = 'MVR') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    // Stats
    const pendingCount = payments.filter((p: CustomerPayment) => p.status === 'pending').length;
    const completedCount = payments.filter((p: CustomerPayment) => p.status === 'completed').length;
    const failedCount = payments.filter((p: CustomerPayment) => p.status === 'failed').length;
    const totalAmount = payments
        .filter((p: CustomerPayment) => p.status === 'completed')
        .reduce((sum: number, p: CustomerPayment) => sum + p.amount, 0);

    return (
        <div class="space-y-6">
            {/* Header */}
            <div>
                <h1 class="text-2xl font-bold">Payments</h1>
                <p class="text-base-content/60 mt-1">View and manage customer payments</p>
            </div>

            {/* Stats */}
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-base-200 rounded-xl p-4">
                    <p class="text-base-content/60 text-sm">Total Payments</p>
                    <p class="text-2xl font-bold mt-1">{payments.length}</p>
                </div>
                <div class="bg-base-200 rounded-xl p-4">
                    <p class="text-base-content/60 text-sm">Completed</p>
                    <p class="text-2xl font-bold mt-1 text-success">{completedCount}</p>
                </div>
                <div class="bg-base-200 rounded-xl p-4">
                    <p class="text-base-content/60 text-sm">Pending</p>
                    <p class="text-2xl font-bold mt-1 text-warning">{pendingCount}</p>
                </div>
                <div class="bg-base-200 rounded-xl p-4">
                    <p class="text-base-content/60 text-sm">Total Revenue</p>
                    <p class="text-2xl font-bold mt-1 text-primary">{formatCurrency(totalAmount)}</p>
                </div>
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
                                placeholder="Search by ID, transaction, or customer..."
                                class="input input-sm input-bordered w-full pl-9"
                                value={searchTerm.value}
                                onInput$={(e) => (searchTerm.value = (e.target as HTMLInputElement).value)}
                            />
                        </div>
                    </div>

                    {/* Status filter buttons */}
                    <div class="flex gap-1 flex-wrap">
                        {['all', 'pending', 'completed', 'failed', 'refunded'].map((status) => (
                            <button
                                key={status}
                                class={`btn btn-sm ${filterStatus.value === status ? 'btn-primary' : 'btn-ghost'}`}
                                onClick$={() => (filterStatus.value = status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                {status === 'pending' && pendingCount > 0 && (
                                    <span class="badge badge-xs badge-warning ml-1">{pendingCount}</span>
                                )}
                                {status === 'failed' && failedCount > 0 && (
                                    <span class="badge badge-xs badge-error ml-1">{failedCount}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {syncAction.value?.success && (
                <div class="alert alert-success py-2">
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>Payment status synced successfully</span>
                </div>
            )}

            {syncAction.value?.success === false && (
                <div class="alert alert-error py-2">
                    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                        />
                    </svg>
                    <span>{syncAction.value.error_message || 'Failed to sync payment'}</span>
                </div>
            )}

            {/* Payments Table */}
            {filteredPayments.length === 0 ? (
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
                                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold mb-2">No payments found</h3>
                    <p class="text-base-content/60">
                        {searchTerm.value || filterStatus.value !== 'all'
                            ? 'Try adjusting your filters'
                            : 'No payments have been made yet'}
                    </p>
                </div>
            ) : (
                <div class="bg-base-200 rounded-xl overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="table table-sm">
                            <thead>
                                <tr class="border-base-300">
                                    <th>Transaction</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Provider</th>
                                    <th>Date</th>
                                    <th class="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment: CustomerPayment) => (
                                    <tr key={payment.id} class="hover border-base-300">
                                        <td>
                                            <div>
                                                <div class="font-mono text-xs">
                                                    {payment.transaction_id?.substring(0, 12) ?? 'N/A'}...
                                                </div>
                                                <div class="text-xs text-base-content/50">
                                                    {payment.id?.substring(0, 8) ?? ''}...
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div class="font-medium">
                                                    {payment.booking?.customer_info.name || 'N/A'}
                                                </div>
                                                <div class="text-xs text-base-content/50">
                                                    {payment.booking?.customer_info.email || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="font-semibold">
                                                {formatCurrency(payment.amount, payment.currency)}
                                            </div>
                                            {payment.refund_amount && payment.refund_amount > 0 && (
                                                <div class="text-xs text-error">
                                                    Refunded: {formatCurrency(payment.refund_amount, payment.currency)}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span class={`badge badge-sm ${getStatusStyle(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="text-sm uppercase">{payment.provider}</span>
                                        </td>
                                        <td>
                                            <div class="text-sm">{formatDate(payment.created_at)}</div>
                                            {payment.paid_at && (
                                                <div class="text-xs text-success">
                                                    Paid: {formatDate(payment.paid_at)}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div class="flex items-center justify-end gap-1">
                                                {payment.status === 'pending' && (
                                                    <Form action={syncAction}>
                                                        <input type="hidden" name="payment_id" value={payment.id} />
                                                        <button
                                                            type="submit"
                                                            class="btn btn-ghost btn-xs"
                                                            disabled={syncAction.isRunning}
                                                        >
                                                            {syncAction.isRunning ? (
                                                                <span class="loading loading-spinner loading-xs"></span>
                                                            ) : (
                                                                'Sync'
                                                            )}
                                                        </button>
                                                    </Form>
                                                )}
                                                {payment.booking_id && (
                                                    <Link
                                                        href={`/admin/bookings/${payment.booking_id}`}
                                                        class="btn btn-ghost btn-xs"
                                                    >
                                                        Booking
                                                    </Link>
                                                )}
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
                                href={`/admin/payments?page=${page}`}
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
    title: 'Payments | Admin | Rihigo',
    meta: [
        {
            name: 'description',
            content: 'Manage customer payments',
        },
    ],
};
