// @ts-nocheck
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { PaymentsReportData, DateRangePreset } from '~/types/report';
import type { PaymentMethod } from '~/types/payment';
import {
    DATE_RANGE_PRESETS,
    getDateRangeFromPreset,
    formatReportCurrency,
    formatPercentage,
} from '~/types/report';

export const useLoadPaymentsReport = routeLoader$<PaymentsReportData>(async (requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const url = new URL(requestEvent.url);
        const from_date = url.searchParams.get('from_date') || getDateRangeFromPreset('this_month').from;
        const to_date = url.searchParams.get('to_date') || getDateRangeFromPreset('this_month').to;

        const result = await apiClient.vendorPortal.reports.getPaymentsReport({ from_date, to_date }, token);

        return result.data || {
            summary: {
                total_received: 0,
                pending: 0,
                failed: 0,
                refunded: 0,
            },
            by_method: [],
            recent_payments: [],
        };
    });
});

export const useExportReport = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async () => {
        return { success: true, message: 'Export started.' };
    });
});

export default component$(() => {
    const reportData = useLoadPaymentsReport();
    const exportAction = useExportReport();

    const currency = useSignal('USD');
    const datePreset = useSignal<DateRangePreset>('this_month');
    const showCustomDates = useSignal(false);

    const filters = useStore({
        from_date: getDateRangeFromPreset('this_month').from,
        to_date: getDateRangeFromPreset('this_month').to,
    });

    const applyDatePreset = $((preset: DateRangePreset) => {
        datePreset.value = preset;
        if (preset === 'custom') {
            showCustomDates.value = true;
        } else {
            showCustomDates.value = false;
            const range = getDateRangeFromPreset(preset);
            filters.from_date = range.from;
            filters.to_date = range.to;
        }
    });

    const getMethodIcon = (method: PaymentMethod) => {
        switch (method) {
            case 'cash':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case 'card':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                );
            case 'bank_transfer':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            case 'online':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span class="badge badge-success badge-sm">Completed</span>;
            case 'pending':
                return <span class="badge badge-warning badge-sm">Pending</span>;
            case 'failed':
                return <span class="badge badge-error badge-sm">Failed</span>;
            case 'refunded':
                return <span class="badge badge-info badge-sm">Refunded</span>;
            default:
                return <span class="badge badge-ghost badge-sm">{status}</span>;
        }
    };

    const methodColors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success', 'bg-warning'];

    return (
        <div class="p-6">
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <div class="flex items-center gap-2 text-sm breadcrumbs mb-2">
                        <a href="/vendor/reports" class="link link-hover">Reports</a>
                        <span>/</span>
                        <span>Payments</span>
                    </div>
                    <h1 class="text-2xl font-bold">Payments Report</h1>
                    <p class="text-base-content/70 mt-1">
                        Payment transactions and method breakdown
                    </p>
                </div>
                <Form action={exportAction}>
                    <input type="hidden" name="from_date" value={filters.from_date} />
                    <input type="hidden" name="to_date" value={filters.to_date} />
                    <div class="dropdown dropdown-end">
                        <label tabIndex={0} class="btn btn-outline">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </label>
                        <ul tabIndex={0} class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                            <li><button type="submit" name="format" value="csv">Export CSV</button></li>
                            <li><button type="submit" name="format" value="pdf">Export PDF</button></li>
                        </ul>
                    </div>
                </Form>
            </div>

            {/* Filters */}
            <div class="card bg-base-100 shadow mb-6">
                <div class="card-body">
                    <div class="flex flex-wrap gap-4 items-end">
                        {/* Date Preset */}
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Date Range</span>
                            </label>
                            <select
                                class="select select-bordered"
                                value={datePreset.value}
                                onChange$={(e) => applyDatePreset((e.target as HTMLSelectElement).value as DateRangePreset)}
                            >
                                {DATE_RANGE_PRESETS.map((preset) => (
                                    <option key={preset.value} value={preset.value}>
                                        {preset.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Date Range */}
                        {showCustomDates.value && (
                            <>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">From</span>
                                    </label>
                                    <input
                                        type="date"
                                        class="input input-bordered"
                                        value={filters.from_date}
                                        onInput$={(e) => {
                                            filters.from_date = (e.target as HTMLInputElement).value;
                                        }}
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">To</span>
                                    </label>
                                    <input
                                        type="date"
                                        class="input input-bordered"
                                        value={filters.to_date}
                                        onInput$={(e) => {
                                            filters.to_date = (e.target as HTMLInputElement).value;
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        {/* Apply Button */}
                        <a
                            href={`/vendor/reports/payments?from_date=${filters.from_date}&to_date=${filters.to_date}`}
                            class="btn btn-primary"
                        >
                            Apply Filters
                        </a>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-figure text-success">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="stat-title">Total Received</div>
                    <div class="stat-value text-lg text-success">
                        {formatReportCurrency(reportData.value.summary.total_received, currency.value)}
                    </div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-figure text-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="stat-title">Pending</div>
                    <div class="stat-value text-lg text-warning">
                        {formatReportCurrency(reportData.value.summary.pending, currency.value)}
                    </div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-figure text-error">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="stat-title">Failed</div>
                    <div class="stat-value text-lg text-error">
                        {formatReportCurrency(reportData.value.summary.failed, currency.value)}
                    </div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-figure text-info">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </div>
                    <div class="stat-title">Refunded</div>
                    <div class="stat-value text-lg text-info">
                        {formatReportCurrency(reportData.value.summary.refunded, currency.value)}
                    </div>
                </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* By Method - Chart */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h3 class="card-title text-lg">Payments by Method</h3>

                        {reportData.value.by_method.length > 0 ? (
                            <div class="space-y-4 mt-4">
                                {reportData.value.by_method.map((method, index) => (
                                    <div key={method.method}>
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="flex items-center gap-2">
                                                <div class={`p-1.5 rounded ${methodColors[index % methodColors.length]} text-white`}>
                                                    {getMethodIcon(method.method)}
                                                </div>
                                                <span class="capitalize">{method.method.replace('_', ' ')}</span>
                                            </div>
                                            <div class="text-right">
                                                <div class="font-semibold">
                                                    {formatReportCurrency(method.amount, currency.value)}
                                                </div>
                                                <div class="text-xs text-base-content/70">
                                                    {method.count} payments ({formatPercentage(method.percentage)})
                                                </div>
                                            </div>
                                        </div>
                                        <div class="w-full bg-base-200 rounded-full h-2">
                                            <div
                                                class={`${methodColors[index % methodColors.length]} h-2 rounded-full transition-all`}
                                                style={{ width: `${method.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div class="py-8 text-center text-base-content/50">
                                No payment data for the selected period
                            </div>
                        )}
                    </div>
                </div>

                {/* By Method - Table */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h3 class="card-title text-lg">Method Summary</h3>

                        {reportData.value.by_method.length > 0 ? (
                            <div class="overflow-x-auto">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Method</th>
                                            <th class="text-right">Amount</th>
                                            <th class="text-right">Count</th>
                                            <th class="text-right">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.value.by_method.map((method) => (
                                            <tr key={method.method}>
                                                <td class="capitalize">{method.method.replace('_', ' ')}</td>
                                                <td class="text-right">{formatReportCurrency(method.amount, currency.value)}</td>
                                                <td class="text-right">{method.count}</td>
                                                <td class="text-right">{formatPercentage(method.percentage)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr class="font-semibold">
                                            <td>Total</td>
                                            <td class="text-right">
                                                {formatReportCurrency(reportData.value.summary.total_received, currency.value)}
                                            </td>
                                            <td class="text-right">
                                                {reportData.value.by_method.reduce((sum, m) => sum + m.count, 0)}
                                            </td>
                                            <td class="text-right">100%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div class="py-8 text-center text-base-content/50">
                                No payment data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Payments */}
            <div class="card bg-base-100 shadow">
                <div class="card-body">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="card-title">Recent Payments</h3>
                        <a href="/vendor/payments" class="btn btn-ghost btn-sm">
                            View All
                        </a>
                    </div>

                    {reportData.value.recent_payments.length > 0 ? (
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Guest</th>
                                        <th>Booking</th>
                                        <th>Method</th>
                                        <th class="text-right">Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.value.recent_payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{new Date(payment.date).toLocaleDateString()}</td>
                                            <td>{payment.guest_name}</td>
                                            <td>
                                                {payment.booking_ref ? (
                                                    <a href={`/vendor/bookings/${payment.booking_ref}`} class="link link-primary">
                                                        {payment.booking_ref}
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>
                                                <div class="flex items-center gap-2">
                                                    {getMethodIcon(payment.method)}
                                                    <span class="capitalize">{payment.method.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td class="text-right font-medium">
                                                {formatReportCurrency(payment.amount, currency.value)}
                                            </td>
                                            <td>{getStatusBadge(payment.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div class="py-8 text-center text-base-content/50">
                            No recent payments
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
