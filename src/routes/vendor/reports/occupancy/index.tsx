// @ts-nocheck
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { OccupancyReportData, DateRangePreset } from '~/types/report';
import {
    DATE_RANGE_PRESETS,
    getDateRangeFromPreset,
    formatReportCurrency,
    formatPercentage,
} from '~/types/report';

export const useLoadOccupancyReport = routeLoader$<OccupancyReportData>(async (requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const url = new URL(requestEvent.url);
        const from_date = url.searchParams.get('from_date') || getDateRangeFromPreset('this_month').from;
        const to_date = url.searchParams.get('to_date') || getDateRangeFromPreset('this_month').to;
        const resource_id = url.searchParams.get('resource_id') || undefined;

        const result = await apiClient.vendorPortal.reports.getOccupancy({ from_date, to_date, resource_id }, token);

        return result.data || {
            summary: {
                overall_occupancy_rate: 0,
                average_daily_rate: 0,
                rev_par: 0,
                total_room_nights: 0,
                occupied_nights: 0,
            },
            by_date: [],
            by_resource: [],
        };
    });
});

export const useExportReport = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async () => {
        return { success: true, message: 'Export started.' };
    });
});

export default component$(() => {
    const reportData = useLoadOccupancyReport();
    const exportAction = useExportReport();

    const currency = useSignal('USD');
    const datePreset = useSignal<DateRangePreset>('this_month');
    const showCustomDates = useSignal(false);

    const filters = useStore({
        from_date: getDateRangeFromPreset('this_month').from,
        to_date: getDateRangeFromPreset('this_month').to,
        resource_id: '',
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

    // Get occupancy color based on rate
    const getOccupancyColor = (rate: number) => {
        if (rate >= 80) return 'bg-success';
        if (rate >= 50) return 'bg-warning';
        if (rate > 0) return 'bg-error';
        return 'bg-base-300';
    };

    const getOccupancyTextColor = (rate: number) => {
        if (rate >= 80) return 'text-success';
        if (rate >= 50) return 'text-warning';
        if (rate > 0) return 'text-error';
        return 'text-base-content/50';
    };

    return (
        <div class="p-6">
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <div class="flex items-center gap-2 text-sm breadcrumbs mb-2">
                        <a href="/vendor/reports" class="link link-hover">Reports</a>
                        <span>/</span>
                        <span>Occupancy</span>
                    </div>
                    <h1 class="text-2xl font-bold">Occupancy Report</h1>
                    <p class="text-base-content/70 mt-1">
                        Room occupancy rates and performance metrics
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

                        {/* Resource Filter */}
                        {reportData.value.by_resource.length > 0 && (
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Resource</span>
                                </label>
                                <select
                                    class="select select-bordered"
                                    value={filters.resource_id}
                                    onChange$={(e) => {
                                        filters.resource_id = (e.target as HTMLSelectElement).value;
                                    }}
                                >
                                    <option value="">All Resources</option>
                                    {reportData.value.by_resource.map((resource) => (
                                        <option key={resource.resource_id} value={resource.resource_id}>
                                            {resource.resource_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Apply Button */}
                        <a
                            href={`/vendor/reports/occupancy?from_date=${filters.from_date}&to_date=${filters.to_date}${filters.resource_id ? `&resource_id=${filters.resource_id}` : ''}`}
                            class="btn btn-primary"
                        >
                            Apply Filters
                        </a>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Occupancy Rate</div>
                    <div class={`stat-value text-lg ${getOccupancyTextColor(reportData.value.summary.overall_occupancy_rate)}`}>
                        {formatPercentage(reportData.value.summary.overall_occupancy_rate)}
                    </div>
                    <div class="stat-desc">Overall for period</div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">ADR</div>
                    <div class="stat-value text-lg text-primary">
                        {formatReportCurrency(reportData.value.summary.average_daily_rate, currency.value)}
                    </div>
                    <div class="stat-desc">Average Daily Rate</div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">RevPAR</div>
                    <div class="stat-value text-lg text-secondary">
                        {formatReportCurrency(reportData.value.summary.rev_par, currency.value)}
                    </div>
                    <div class="stat-desc">Revenue per Available Room</div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Total Room Nights</div>
                    <div class="stat-value text-lg">{reportData.value.summary.total_room_nights}</div>
                    <div class="stat-desc">Available inventory</div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Occupied Nights</div>
                    <div class="stat-value text-lg">{reportData.value.summary.occupied_nights}</div>
                    <div class="stat-desc">Nights sold</div>
                </div>
            </div>

            {/* Occupancy Calendar Heatmap */}
            <div class="card bg-base-100 shadow mb-6">
                <div class="card-body">
                    <h3 class="card-title">Daily Occupancy</h3>

                    {/* Legend */}
                    <div class="flex items-center gap-4 mb-4 text-sm">
                        <span class="text-base-content/70">Occupancy:</span>
                        <div class="flex items-center gap-1">
                            <div class="w-4 h-4 bg-base-300 rounded"></div>
                            <span>0%</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <div class="w-4 h-4 bg-error rounded"></div>
                            <span>1-49%</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <div class="w-4 h-4 bg-warning rounded"></div>
                            <span>50-79%</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <div class="w-4 h-4 bg-success rounded"></div>
                            <span>80%+</span>
                        </div>
                    </div>

                    {reportData.value.by_date.length > 0 ? (
                        <div class="grid grid-cols-7 gap-1">
                            {/* Day Headers */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} class="text-center text-xs text-base-content/70 font-medium py-1">
                                    {day}
                                </div>
                            ))}

                            {/* Calendar Cells */}
                            {reportData.value.by_date.map((day, index) => {
                                const date = new Date(day.date);
                                const dayOfWeek = date.getDay();

                                // Add empty cells for alignment at start of month
                                const emptyCells = index === 0 ? Array(dayOfWeek).fill(null) : [];

                                return (
                                    <>
                                        {emptyCells.map((_, i) => (
                                            <div key={`empty-${i}`} class="aspect-square"></div>
                                        ))}
                                        <div
                                            key={day.date}
                                            class={`aspect-square ${getOccupancyColor(day.occupancy_rate)} rounded flex items-center justify-center text-xs group relative cursor-pointer`}
                                        >
                                            <span class={day.occupancy_rate > 0 ? 'text-white font-medium' : 'text-base-content/50'}>
                                                {date.getDate()}
                                            </span>
                                            {/* Tooltip */}
                                            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-base-300 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                <div class="font-semibold">{formatPercentage(day.occupancy_rate)}</div>
                                                <div class="text-base-content/70">
                                                    {day.occupied}/{day.available} rooms
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })}
                        </div>
                    ) : (
                        <div class="py-12 text-center text-base-content/50">
                            No occupancy data for the selected period
                        </div>
                    )}
                </div>
            </div>

            {/* Resource Breakdown */}
            <div class="card bg-base-100 shadow">
                <div class="card-body">
                    <h3 class="card-title">Performance by Resource</h3>

                    {reportData.value.by_resource.length > 0 ? (
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Resource</th>
                                        <th class="text-right">Occupancy Rate</th>
                                        <th class="text-right">ADR</th>
                                        <th class="text-right">Revenue</th>
                                        <th>Performance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.value.by_resource.map((resource) => (
                                        <tr key={resource.resource_id}>
                                            <td class="font-medium">{resource.resource_name}</td>
                                            <td class="text-right">
                                                <span class={getOccupancyTextColor(resource.occupancy_rate)}>
                                                    {formatPercentage(resource.occupancy_rate)}
                                                </span>
                                            </td>
                                            <td class="text-right">
                                                {formatReportCurrency(resource.adr, currency.value)}
                                            </td>
                                            <td class="text-right">
                                                {formatReportCurrency(resource.revenue, currency.value)}
                                            </td>
                                            <td>
                                                <div class="w-full bg-base-200 rounded-full h-2">
                                                    <div
                                                        class={`${getOccupancyColor(resource.occupancy_rate)} h-2 rounded-full transition-all`}
                                                        style={{ width: `${Math.min(resource.occupancy_rate, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr class="font-semibold">
                                        <td>Total / Average</td>
                                        <td class="text-right">
                                            {formatPercentage(reportData.value.summary.overall_occupancy_rate)}
                                        </td>
                                        <td class="text-right">
                                            {formatReportCurrency(reportData.value.summary.average_daily_rate, currency.value)}
                                        </td>
                                        <td class="text-right">
                                            {formatReportCurrency(
                                                reportData.value.by_resource.reduce((sum, r) => sum + r.revenue, 0),
                                                currency.value
                                            )}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div class="py-8 text-center text-base-content/50">No resource data available</div>
                    )}
                </div>
            </div>
        </div>
    );
});
