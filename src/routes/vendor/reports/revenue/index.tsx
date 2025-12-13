// @ts-nocheck
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { RevenueReportData, DateRangePreset } from '~/types/report';
import {
    DATE_RANGE_PRESETS,
    GROUP_BY_OPTIONS,
    getDateRangeFromPreset,
    formatReportCurrency,
    formatPercentage,
} from '~/types/report';

export const useLoadRevenueReport = routeLoader$<RevenueReportData>(async (requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const url = new URL(requestEvent.url);
        const from_date = url.searchParams.get('from_date') || getDateRangeFromPreset('this_month').from;
        const to_date = url.searchParams.get('to_date') || getDateRangeFromPreset('this_month').to;
        const group_by = url.searchParams.get('group_by') || 'day';

        const result = await apiClient.vendorPortal.reports.getRevenue({ from_date, to_date, group_by }, token);

        return result.data || {
            summary: {
                total_revenue: 0,
                commission_paid: 0,
                net_revenue: 0,
                average_daily_revenue: 0,
                total_bookings: 0,
            },
            trend: [],
            by_source: [],
            by_resource: [],
            by_service_type: [],
        };
    });
});

export const useExportReport = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async () => {
        // In a real implementation, this would generate and return a download link
        return { success: true, message: 'Export started. Download will begin shortly.' };
    });
});

export default component$(() => {
    const reportData = useLoadRevenueReport();
    const exportAction = useExportReport();

    const currency = useSignal('USD');
    const datePreset = useSignal<DateRangePreset>('this_month');
    const showCustomDates = useSignal(false);

    const filters = useStore({
        from_date: getDateRangeFromPreset('this_month').from,
        to_date: getDateRangeFromPreset('this_month').to,
        group_by: 'day',
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

    const maxTrendValue = Math.max(...reportData.value.trend.map((t) => t.revenue), 1);

    return (
        <div class="p-6">
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <div class="flex items-center gap-2 text-sm breadcrumbs mb-2">
                        <a href="/vendor/reports" class="link link-hover">Reports</a>
                        <span>/</span>
                        <span>Revenue</span>
                    </div>
                    <h1 class="text-2xl font-bold">Revenue Report</h1>
                    <p class="text-base-content/70 mt-1">
                        Detailed revenue analysis and trends
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

                        {/* Group By */}
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text">Group By</span>
                            </label>
                            <select
                                class="select select-bordered"
                                value={filters.group_by}
                                onChange$={(e) => {
                                    filters.group_by = (e.target as HTMLSelectElement).value;
                                }}
                            >
                                {GROUP_BY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Apply Button */}
                        <a
                            href={`/vendor/reports/revenue?from_date=${filters.from_date}&to_date=${filters.to_date}&group_by=${filters.group_by}`}
                            class="btn btn-primary"
                        >
                            Apply Filters
                        </a>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Total Revenue</div>
                    <div class="stat-value text-lg text-success">
                        {formatReportCurrency(reportData.value.summary.total_revenue, currency.value)}
                    </div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Commission Paid</div>
                    <div class="stat-value text-lg text-error">
                        {formatReportCurrency(reportData.value.summary.commission_paid, currency.value)}
                    </div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Net Revenue</div>
                    <div class="stat-value text-lg text-primary">
                        {formatReportCurrency(reportData.value.summary.net_revenue, currency.value)}
                    </div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Avg. Daily Revenue</div>
                    <div class="stat-value text-lg">
                        {formatReportCurrency(reportData.value.summary.average_daily_revenue, currency.value)}
                    </div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Total Bookings</div>
                    <div class="stat-value text-lg">{reportData.value.summary.total_bookings}</div>
                </div>
            </div>

            {/* Revenue Trend Chart */}
            <div class="card bg-base-100 shadow mb-6">
                <div class="card-body">
                    <h3 class="card-title">Revenue Trend</h3>

                    {reportData.value.trend.length > 0 ? (
                        <div class="h-64 flex items-end gap-1 mt-4">
                            {reportData.value.trend.map((item, index) => {
                                const height = (item.revenue / maxTrendValue) * 100;
                                return (
                                    <div key={index} class="flex-1 flex flex-col items-center group">
                                        <div class="relative w-full">
                                            <div
                                                class="w-full bg-primary rounded-t hover:bg-primary-focus transition-colors cursor-pointer"
                                                style={{ height: `${Math.max(height, 2)}px`, minHeight: '2px' }}
                                            ></div>
                                            {/* Tooltip */}
                                            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-base-300 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                <div class="font-semibold">{formatReportCurrency(item.revenue, currency.value)}</div>
                                                <div class="text-base-content/70">{item.bookings} bookings</div>
                                            </div>
                                        </div>
                                        <span class="text-xs text-base-content/70 mt-2 transform -rotate-45 origin-top-left">
                                            {item.period}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div class="h-64 flex items-center justify-center text-base-content/50">
                            No data for the selected period
                        </div>
                    )}
                </div>
            </div>

            {/* Breakdown Tables */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Source */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h3 class="card-title text-lg">Revenue by Source</h3>

                        {reportData.value.by_source.length > 0 ? (
                            <div class="overflow-x-auto">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th class="text-right">Revenue</th>
                                            <th class="text-right">Bookings</th>
                                            <th class="text-right">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.value.by_source.map((source, index) => (
                                            <tr key={index}>
                                                <td>{source.source}</td>
                                                <td class="text-right">{formatReportCurrency(source.revenue, currency.value)}</td>
                                                <td class="text-right">{source.bookings}</td>
                                                <td class="text-right">{formatPercentage(source.percentage)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div class="py-8 text-center text-base-content/50">No data available</div>
                        )}
                    </div>
                </div>

                {/* By Service Type */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h3 class="card-title text-lg">Revenue by Service Type</h3>

                        {reportData.value.by_service_type.length > 0 ? (
                            <div class="overflow-x-auto">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Service Type</th>
                                            <th class="text-right">Revenue</th>
                                            <th class="text-right">Bookings</th>
                                            <th class="text-right">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.value.by_service_type.map((type, index) => (
                                            <tr key={index}>
                                                <td class="capitalize">{type.service_type}</td>
                                                <td class="text-right">{formatReportCurrency(type.revenue, currency.value)}</td>
                                                <td class="text-right">{type.bookings}</td>
                                                <td class="text-right">{formatPercentage(type.percentage)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div class="py-8 text-center text-base-content/50">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* By Resource */}
            <div class="card bg-base-100 shadow mt-6">
                <div class="card-body">
                    <h3 class="card-title text-lg">Revenue by Resource/Activity</h3>

                    {reportData.value.by_resource.length > 0 ? (
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Resource/Activity</th>
                                        <th class="text-right">Revenue</th>
                                        <th class="text-right">Bookings</th>
                                        <th class="text-right">Avg. per Booking</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.value.by_resource.map((resource) => (
                                        <tr key={resource.resource_id}>
                                            <td>{resource.resource_name}</td>
                                            <td class="text-right">{formatReportCurrency(resource.revenue, currency.value)}</td>
                                            <td class="text-right">{resource.bookings}</td>
                                            <td class="text-right">
                                                {formatReportCurrency(
                                                    resource.bookings > 0 ? resource.revenue / resource.bookings : 0,
                                                    currency.value
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr class="font-semibold">
                                        <td>Total</td>
                                        <td class="text-right">
                                            {formatReportCurrency(
                                                reportData.value.by_resource.reduce((sum, r) => sum + r.revenue, 0),
                                                currency.value
                                            )}
                                        </td>
                                        <td class="text-right">
                                            {reportData.value.by_resource.reduce((sum, r) => sum + r.bookings, 0)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div class="py-8 text-center text-base-content/50">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Revenue Report | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "Detailed revenue analysis and trends",
        },
    ],
};
