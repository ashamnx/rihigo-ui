// @ts-nocheck
import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, Link, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { EmptyState } from '~/components/vendor/shared/EmptyState';
import { FilterBar, type FilterDefinition } from '~/components/vendor/shared/FilterBar';
import { ActionDropdown, type Action } from '~/components/vendor/shared/ActionDropdown';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type Invoice,
    type InvoiceFilters,
    invoiceStatusLabels,
    invoiceStatusColors,
    canSendInvoice,
    canVoidInvoice,
    canRecordPayment,
    isInvoiceOverdue,
} from '~/types/invoice';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

interface InvoiceListResponse {
    success: boolean;
    data: Invoice[];
    total: number;
    page: number;
    limit: number;
}

export const useInvoicesLoader = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const url = requestEvent.url;
            const filters: InvoiceFilters = {
                search: url.searchParams.get('search') || undefined,
                status: url.searchParams.get('status') as InvoiceFilters['status'] || undefined,
                date_from: url.searchParams.get('date_from') || undefined,
                date_to: url.searchParams.get('date_to') || undefined,
                overdue_only: url.searchParams.get('overdue_only') === 'true',
                page: parseInt(url.searchParams.get('page') || '1'),
                limit: parseInt(url.searchParams.get('limit') || '20'),
            };

            const response = await apiClient.vendorPortal.invoices.list(token, filters);
            return response as InvoiceListResponse;
        } catch (error) {
            console.error('Failed to load invoices:', error);
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
    const invoicesData = useInvoicesLoader();
    const navigate = useNavigate();

    const filters = useSignal<Record<string, string>>({});
    const searchValue = useSignal('');
    const selectedInvoice = useSignal<Invoice | null>(null);

    const invoices = invoicesData.value.data || [];
    const total = invoicesData.value.total || 0;

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending' },
                { value: 'sent', label: 'Sent' },
                { value: 'partial', label: 'Partially Paid' },
                { value: 'paid', label: 'Paid' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'void', label: 'Void' },
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
        navigate('/vendor/invoices');
    });

    const applyFilters = $(() => {
        const params = new URLSearchParams();
        if (searchValue.value) params.set('search', searchValue.value);
        Object.entries(filters.value).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const queryString = params.toString();
        navigate(`/vendor/invoices${queryString ? `?${queryString}` : ''}`);
    });

    const getInvoiceActions = $((invoice: Invoice): Action[] => {
        const actions: Action[] = [
            {
                label: 'View Details',
                icon: 'view',
                onClick$: $(() => navigate(`/vendor/invoices/${invoice.id}`)),
            },
        ];

        if (invoice.status === 'draft') {
            actions.push({
                label: 'Edit',
                icon: 'edit',
                onClick$: $(() => navigate(`/vendor/invoices/${invoice.id}?edit=true`)),
            });
        }

        if (canSendInvoice(invoice.status)) {
            actions.push({
                label: 'Send Invoice',
                icon: 'send',
                dividerBefore: true,
                onClick$: $(() => {
                    selectedInvoice.value = invoice;
                    showModal('send-invoice-modal');
                }),
            });
        }

        if (canRecordPayment(invoice.status)) {
            actions.push({
                label: 'Record Payment',
                icon: 'payment',
                onClick$: $(() => navigate(`/vendor/payments/new?invoice_id=${invoice.id}`)),
            });
        }

        actions.push({
            label: 'Download PDF',
            icon: 'download',
            onClick$: $(() => {
                // Download invoice PDF
                window.open(`/api/vendor/invoices/${invoice.id}/pdf`, '_blank');
            }),
        });

        if (canVoidInvoice(invoice.status)) {
            actions.push({
                label: 'Void Invoice',
                icon: 'delete',
                danger: true,
                dividerBefore: true,
                onClick$: $(() => {
                    selectedInvoice.value = invoice;
                    showModal('void-invoice-modal');
                }),
            });
        }

        return actions;
    });

    const handleSendInvoice = $(async () => {
        if (!selectedInvoice.value) return;
        console.log('Sending invoice:', selectedInvoice.value.id);
        navigate('/vendor/invoices', { forceReload: true });
    });

    const handleVoidInvoice = $(async () => {
        if (!selectedInvoice.value) return;
        console.log('Voiding invoice:', selectedInvoice.value.id);
        navigate('/vendor/invoices', { forceReload: true });
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

    // Format amount in display currency if available
    const formatDisplayAmount = (amount: number, invoice: Invoice) => {
        const displayCurrency = invoice.display_currency || invoice.currency || 'USD';
        const exchangeRate = invoice.exchange_rate_at_creation;

        if (displayCurrency !== 'USD' && exchangeRate) {
            const displayAmount = amount * exchangeRate;
            return formatCurrency(displayAmount, displayCurrency);
        }
        return formatCurrency(amount, displayCurrency);
    };

    // Calculate stats
    const totalOutstanding = invoices
        .filter((i) => ['pending', 'sent', 'partial', 'overdue'].includes(i.status))
        .reduce((sum, i) => sum + i.amount_due, 0);

    const overdueCount = invoices.filter(
        (i) => isInvoiceOverdue(i.due_date, i.status) || i.status === 'overdue'
    ).length;

    return (
        <div>
            <PageHeader
                title="Invoices"
                subtitle={`${total} invoice${total !== 1 ? 's' : ''} total`}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Invoices' },
                ]}
            >
                <Link q:slot="actions" href="/vendor/invoices/new" class="btn btn-primary btn-sm">
                    <svg class="size-4 mr-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Invoice
                </Link>
            </PageHeader>

            {/* Filters */}
            <FilterBar
                filters={filterDefinitions}
                values={filters.value}
                onChange$={handleFilterChange}
                onReset$={handleReset}
                searchPlaceholder="Search by invoice #, customer..."
                onSearch$={handleSearch}
                searchValue={searchValue.value}
            />

            {/* Quick Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Total Outstanding</div>
                    <div class="stat-value text-lg">{formatCurrency(totalOutstanding)}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Overdue</div>
                    <div class="stat-value text-lg text-error">{overdueCount}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Drafts</div>
                    <div class="stat-value text-lg">
                        {invoices.filter((i) => i.status === 'draft').length}
                    </div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Paid This Month</div>
                    <div class="stat-value text-lg text-success">
                        {invoices.filter((i) => i.status === 'paid').length}
                    </div>
                </div>
            </div>

            {/* Invoice List */}
            {invoices.length === 0 ? (
                <EmptyState
                    title="No invoices found"
                    description="Create your first invoice to start billing customers."
                    icon="receipt"
                >
                    <Link q:slot="action" href="/vendor/invoices/new" class="btn btn-primary btn-sm">
                        Create Invoice
                    </Link>
                </EmptyState>
            ) : (
                <div class="overflow-x-auto">
                    <table class="table table-zebra bg-base-100">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Customer</th>
                                <th>Issue Date</th>
                                <th>Due Date</th>
                                <th>Total</th>
                                <th>Amount Due</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((invoice) => {
                                const overdue = isInvoiceOverdue(invoice.due_date, invoice.status);
                                return (
                                    <tr key={invoice.id}>
                                        <td>
                                            <Link
                                                href={`/vendor/invoices/${invoice.id}`}
                                                class="font-medium hover:text-primary"
                                            >
                                                {invoice.invoice_number}
                                            </Link>
                                            {invoice.booking && (
                                                <div class="text-xs text-base-content/60">
                                                    Booking #{invoice.booking.booking_number}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div>{invoice.billing_name}</div>
                                            <div class="text-xs text-base-content/60">
                                                {invoice.billing_email}
                                            </div>
                                        </td>
                                        <td>{formatDate(invoice.issue_date)}</td>
                                        <td>
                                            <span class={overdue ? 'text-error font-medium' : ''}>
                                                {formatDate(invoice.due_date)}
                                            </span>
                                            {overdue && (
                                                <div class="text-xs text-error">Overdue</div>
                                            )}
                                        </td>
                                        <td class="font-medium">
                                            <div>{formatDisplayAmount(invoice.total, invoice)}</div>
                                            {invoice.display_currency && invoice.display_currency !== 'USD' && invoice.exchange_rate_at_creation && (
                                                <div class="text-xs text-base-content/50">
                                                    {formatCurrency(invoice.total, 'USD')} USD
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span class={invoice.amount_due > 0 ? 'text-warning font-medium' : 'text-success'}>
                                                {formatDisplayAmount(invoice.amount_due, invoice)}
                                            </span>
                                            {invoice.display_currency && invoice.display_currency !== 'USD' && invoice.exchange_rate_at_creation && invoice.amount_due > 0 && (
                                                <div class="text-xs text-base-content/50">
                                                    {formatCurrency(invoice.amount_due, 'USD')} USD
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span class={`badge badge-sm ${invoiceStatusColors[invoice.status]}`}>
                                                {invoiceStatusLabels[invoice.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <ActionDropdown actions={getInvoiceActions(invoice)} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Send Invoice Modal */}
            <ConfirmModal
                id="send-invoice-modal"
                title="Send Invoice"
                message={`Send invoice ${selectedInvoice.value?.invoice_number} to ${selectedInvoice.value?.billing_email}?`}
                confirmText="Send"
                onConfirm$={handleSendInvoice}
            />

            {/* Void Invoice Modal */}
            <ConfirmModal
                id="void-invoice-modal"
                title="Void Invoice"
                message={`Are you sure you want to void invoice ${selectedInvoice.value?.invoice_number}? This action cannot be undone.`}
                confirmText="Void Invoice"
                danger={true}
                onConfirm$={handleVoidInvoice}
            />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Invoices | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "Manage and track customer invoices",
        },
    ],
};
