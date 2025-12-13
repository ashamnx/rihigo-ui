// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, Link, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { EmptyState } from '~/components/vendor/shared/EmptyState';
import { FilterBar, type FilterDefinition } from '~/components/vendor/shared/FilterBar';
import { ActionDropdown, type Action } from '~/components/vendor/shared/ActionDropdown';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type Refund,
    type RefundFilters,
    refundStatusLabels,
    refundStatusColors,
    refundReasonLabels,
    refundMethodLabels,
    canApproveRefund,
    canProcessRefund,
} from '~/types/payment';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

interface RefundListResponse {
    success: boolean;
    data: Refund[];
    total: number;
    page: number;
    limit: number;
}

export const useRefundsLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const url = requestEvent.url;
            const filters: RefundFilters = {
                search: url.searchParams.get('search') || undefined,
                status: url.searchParams.get('status') as RefundFilters['status'] || undefined,
                reason_type: url.searchParams.get('reason_type') as RefundFilters['reason_type'] || undefined,
                date_from: url.searchParams.get('date_from') || undefined,
                date_to: url.searchParams.get('date_to') || undefined,
                page: parseInt(url.searchParams.get('page') || '1'),
                limit: parseInt(url.searchParams.get('limit') || '20'),
            };

            const response = await apiClient.vendorPortal.refunds.list(token, filters);
            return response as RefundListResponse;
        } catch (error) {
            console.error('Failed to load refunds:', error);
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
    const refundsData = useRefundsLoader();
    const navigate = useNavigate();

    const filters = useSignal<Record<string, string>>({});
    const searchValue = useSignal('');
    const selectedRefund = useSignal<Refund | null>(null);

    const refunds = refundsData.value.data || [];
    const total = refundsData.value.total || 0;

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'pending', label: 'Pending Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' },
            ],
        },
        {
            key: 'reason_type',
            label: 'Reason',
            type: 'select',
            options: [
                { value: 'cancellation', label: 'Cancellation' },
                { value: 'overcharge', label: 'Overcharge' },
                { value: 'service_issue', label: 'Service Issue' },
                { value: 'duplicate', label: 'Duplicate' },
                { value: 'other', label: 'Other' },
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
        navigate('/vendor/refunds');
    });

    const applyFilters = $(() => {
        const params = new URLSearchParams();
        if (searchValue.value) params.set('search', searchValue.value);
        Object.entries(filters.value).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const queryString = params.toString();
        navigate(`/vendor/refunds${queryString ? `?${queryString}` : ''}`);
    });

    const getRefundActions = $((refund: Refund): Action[] => {
        const actions: Action[] = [
            {
                label: 'View Details',
                icon: 'view',
                onClick$: $(() => navigate(`/vendor/refunds/${refund.id}`)),
            },
        ];

        if (canApproveRefund(refund.status)) {
            actions.push({
                label: 'Approve',
                icon: 'check',
                onClick$: $(() => {
                    selectedRefund.value = refund;
                    showModal('approve-refund-modal');
                }),
            });
            actions.push({
                label: 'Reject',
                icon: 'delete',
                danger: true,
                onClick$: $(() => {
                    selectedRefund.value = refund;
                    showModal('reject-refund-modal');
                }),
            });
        }

        if (canProcessRefund(refund.status)) {
            actions.push({
                label: 'Process Refund',
                icon: 'payment',
                onClick$: $(() => {
                    selectedRefund.value = refund;
                    showModal('process-refund-modal');
                }),
            });
        }

        if (refund.payment_id) {
            actions.push({
                label: 'View Payment',
                icon: 'document',
                dividerBefore: true,
                onClick$: $(() => navigate(`/vendor/payments/${refund.payment_id}`)),
            });
        }

        return actions;
    });

    const handleApprove = $(async () => {
        if (!selectedRefund.value) return;
        console.log('Approving refund:', selectedRefund.value.id);
        navigate('/vendor/refunds', { forceReload: true });
    });

    const handleReject = $(async () => {
        if (!selectedRefund.value) return;
        console.log('Rejecting refund:', selectedRefund.value.id);
        navigate('/vendor/refunds', { forceReload: true });
    });

    const handleProcess = $(async () => {
        if (!selectedRefund.value) return;
        console.log('Processing refund:', selectedRefund.value.id);
        navigate('/vendor/refunds', { forceReload: true });
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

    // Calculate stats
    const pendingCount = refunds.filter((r) => r.status === 'pending').length;
    const totalRefunded = refunds
        .filter((r) => r.status === 'completed')
        .reduce((sum, r) => sum + r.amount, 0);

    return (
        <div>
            <PageHeader
                title="Refunds"
                subtitle={`${total} refund${total !== 1 ? 's' : ''} total`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Refunds' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/refunds/new" class="btn btn-primary btn-sm">
                    <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Refund
                </Link>
            </PageHeader>

            {/* Filters */}
            <FilterBar
                filters={filterDefinitions}
                values={filters.value}
                onChange$={handleFilterChange}
                onReset$={handleReset}
                searchPlaceholder="Search by refund #, recipient..."
                onSearch$={handleSearch}
                searchValue={searchValue.value}
            />

            {/* Quick Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Pending Approval</div>
                    <div class="stat-value text-lg text-warning">{pendingCount}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Processing</div>
                    <div class="stat-value text-lg">
                        {refunds.filter((r) => r.status === 'processing').length}
                    </div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Completed</div>
                    <div class="stat-value text-lg text-success">
                        {refunds.filter((r) => r.status === 'completed').length}
                    </div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Total Refunded</div>
                    <div class="stat-value text-lg">{formatCurrency(totalRefunded)}</div>
                </div>
            </div>

            {/* Refund List */}
            {refunds.length === 0 ? (
                <EmptyState
                    title="No refunds found"
                    description="No refund requests have been created yet."
                    icon="refund"
                >
                    <Link q:slot="action" href="/vendor/refunds/new" class="btn btn-primary btn-sm">
                        Create Refund
                    </Link>
                </EmptyState>
            ) : (
                <div class="overflow-x-auto">
                    <table class="table table-zebra bg-base-100">
                        <thead>
                            <tr>
                                <th>Refund</th>
                                <th>Recipient</th>
                                <th>Reason</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {refunds.map((refund) => (
                                <tr key={refund.id}>
                                    <td>
                                        <Link
                                            href={`/vendor/refunds/${refund.id}`}
                                            class="font-medium hover:text-primary"
                                        >
                                            {refund.refund_number}
                                        </Link>
                                        {refund.payment && (
                                            <div class="text-xs text-base-content/60">
                                                Payment {refund.payment.payment_number}
                                            </div>
                                        )}
                                    </td>
                                    <td>{refund.recipient_name}</td>
                                    <td>
                                        <span class="badge badge-ghost badge-sm">
                                            {refundReasonLabels[refund.reason_type]}
                                        </span>
                                        {refund.reason_description && (
                                            <div class="text-xs text-base-content/60 truncate max-w-[150px]">
                                                {refund.reason_description}
                                            </div>
                                        )}
                                    </td>
                                    <td class="font-medium text-error">
                                        -{formatCurrency(refund.amount, refund.currency)}
                                    </td>
                                    <td>
                                        <span class="text-sm">
                                            {refundMethodLabels[refund.refund_method]}
                                        </span>
                                    </td>
                                    <td>
                                        <span class={`badge badge-sm ${refundStatusColors[refund.status]}`}>
                                            {refundStatusLabels[refund.status]}
                                        </span>
                                    </td>
                                    <td>{formatDate(refund.created_at)}</td>
                                    <td>
                                        <ActionDropdown actions={getRefundActions(refund)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Approve Modal */}
            <ConfirmModal
                id="approve-refund-modal"
                title="Approve Refund"
                message={`Approve refund ${selectedRefund.value?.refund_number} for ${selectedRefund.value ? formatCurrency(selectedRefund.value.amount, selectedRefund.value.currency) : ''}?`}
                confirmText="Approve"
                onConfirm$={handleApprove}
            />

            {/* Reject Modal */}
            <ConfirmModal
                id="reject-refund-modal"
                title="Reject Refund"
                message={`Are you sure you want to reject refund ${selectedRefund.value?.refund_number}?`}
                confirmText="Reject"
                danger={true}
                onConfirm$={handleReject}
            />

            {/* Process Modal */}
            <ConfirmModal
                id="process-refund-modal"
                title="Process Refund"
                message={`Process refund ${selectedRefund.value?.refund_number} for ${selectedRefund.value ? formatCurrency(selectedRefund.value.amount, selectedRefund.value.currency) : ''}? This will initiate the refund to the customer.`}
                confirmText="Process Refund"
                onConfirm$={handleProcess}
            />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Refunds | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "Process and track customer refunds",
        },
    ],
};
