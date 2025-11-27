// @ts-nocheck
import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { DashboardMetrics } from '~/types/report';
import { formatReportCurrency, formatPercentage } from '~/types/report';

export const useLoadDashboard = routeLoader$<DashboardMetrics>(async (requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const result = await apiClient.vendorPortal.reports.getDashboard(token);

        // Return data or default values
        return result.data || {
            revenue: { current_month: 0, previous_month: 0, change_percentage: 0 },
            bookings: { current_month: 0, previous_month: 0, change_percentage: 0 },
            average_booking_value: 0,
            outstanding_invoices: { count: 0, total: 0 },
            occupancy_rate: undefined,
            revenue_trend: [],
            booking_sources: [],
        };
    });
});

export default component$(() => {
    const dashboard = useLoadDashboard();
    const currency = useSignal('USD');

    const reportLinks = [
        {
            title: 'Revenue Report',
            description: 'Detailed revenue analysis by source, resource, and time period',
            href: '/vendor/reports/revenue',
            icon: 'currency',
            color: 'text-success',
        },
        {
            title: 'Payments Report',
            description: 'Payment transactions, methods breakdown, and reconciliation',
            href: '/vendor/reports/payments',
            icon: 'card',
            color: 'text-primary',
        },
        {
            title: 'Occupancy Report',
            description: 'Room occupancy rates, ADR, and RevPAR metrics',
            href: '/vendor/reports/occupancy',
            icon: 'calendar',
            color: 'text-warning',
        },
        {
            title: 'Tax Report',
            description: 'Tax collected breakdown for filing and compliance',
            href: '/vendor/reports/tax',
            icon: 'receipt',
            color: 'text-info',
        },
    ];

    const getChangeIcon = (change: number) => {
        if (change > 0) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-success" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
            );
        } else if (change < 0) {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-error" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
            );
        }
        return null;
    };

    return (
        <div class="p-6">
            {/* Header */}
            <div class="mb-6">
                <h1 class="text-2xl font-bold">Reports & Analytics</h1>
                <p class="text-base-content/70 mt-1">
                    Overview of your property's performance metrics
                </p>
            </div>

            {/* Key Metrics */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Revenue */}
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-figure text-success">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="stat-title">Revenue (This Month)</div>
                    <div class="stat-value text-success">
                        {formatReportCurrency(dashboard.value.revenue.current_month, currency.value)}
                    </div>
                    <div class="stat-desc flex items-center gap-1">
                        {getChangeIcon(dashboard.value.revenue.change_percentage)}
                        <span class={dashboard.value.revenue.change_percentage >= 0 ? 'text-success' : 'text-error'}>
                            {formatPercentage(Math.abs(dashboard.value.revenue.change_percentage))}
                        </span>
                        <span>vs last month</span>
                    </div>
                </div>

                {/* Bookings */}
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-figure text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="stat-title">Bookings (This Month)</div>
                    <div class="stat-value text-primary">{dashboard.value.bookings.current_month}</div>
                    <div class="stat-desc flex items-center gap-1">
                        {getChangeIcon(dashboard.value.bookings.change_percentage)}
                        <span class={dashboard.value.bookings.change_percentage >= 0 ? 'text-success' : 'text-error'}>
                            {formatPercentage(Math.abs(dashboard.value.bookings.change_percentage))}
                        </span>
                        <span>vs last month</span>
                    </div>
                </div>

                {/* Average Booking Value */}
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div class="stat-title">Avg. Booking Value</div>
                    <div class="stat-value text-secondary">
                        {formatReportCurrency(dashboard.value.average_booking_value, currency.value)}
                    </div>
                    <div class="stat-desc">Per booking average</div>
                </div>

                {/* Outstanding Invoices */}
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-figure text-warning">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div class="stat-title">Outstanding Invoices</div>
                    <div class="stat-value text-warning">
                        {formatReportCurrency(dashboard.value.outstanding_invoices.total, currency.value)}
                    </div>
                    <div class="stat-desc">{dashboard.value.outstanding_invoices.count} unpaid invoices</div>
                </div>
            </div>

            {/* Charts Row */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Trend Chart */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h3 class="card-title text-lg">Revenue Trend</h3>
                        <p class="text-sm text-base-content/70 mb-4">Last 6 months</p>

                        {dashboard.value.revenue_trend.length > 0 ? (
                            <div class="h-64 flex items-end gap-2">
                                {dashboard.value.revenue_trend.map((item, index) => {
                                    const maxAmount = Math.max(...dashboard.value.revenue_trend.map(i => i.amount));
                                    const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                                    return (
                                        <div key={index} class="flex-1 flex flex-col items-center gap-2">
                                            <div class="w-full bg-primary/20 rounded-t relative" style={{ height: '200px' }}>
                                                <div
                                                    class="absolute bottom-0 w-full bg-primary rounded-t transition-all"
                                                    style={{ height: `${height}%` }}
                                                ></div>
                                            </div>
                                            <span class="text-xs text-base-content/70">{item.period}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div class="h-64 flex items-center justify-center text-base-content/50">
                                <div class="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p>No revenue data yet</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Sources */}
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h3 class="card-title text-lg">Booking Sources</h3>
                        <p class="text-sm text-base-content/70 mb-4">This month</p>

                        {dashboard.value.booking_sources.length > 0 ? (
                            <div class="space-y-4">
                                {dashboard.value.booking_sources.map((source, index) => {
                                    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success'];
                                    return (
                                        <div key={index}>
                                            <div class="flex justify-between text-sm mb-1">
                                                <span>{source.source}</span>
                                                <span class="text-base-content/70">
                                                    {source.count} ({formatPercentage(source.percentage)})
                                                </span>
                                            </div>
                                            <div class="w-full bg-base-200 rounded-full h-2">
                                                <div
                                                    class={`${colors[index % colors.length]} h-2 rounded-full transition-all`}
                                                    style={{ width: `${source.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div class="h-48 flex items-center justify-center text-base-content/50">
                                <div class="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                    </svg>
                                    <p>No booking source data yet</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Occupancy Rate (if applicable) */}
            {dashboard.value.occupancy_rate !== undefined && (
                <div class="card bg-base-100 shadow mb-8">
                    <div class="card-body">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="card-title text-lg">Current Occupancy Rate</h3>
                                <p class="text-sm text-base-content/70">Based on available inventory</p>
                            </div>
                            <div class="text-right">
                                <div class="text-4xl font-bold text-primary">
                                    {formatPercentage(dashboard.value.occupancy_rate)}
                                </div>
                            </div>
                        </div>
                        <div class="w-full bg-base-200 rounded-full h-4 mt-4">
                            <div
                                class="bg-primary h-4 rounded-full transition-all"
                                style={{ width: `${Math.min(dashboard.value.occupancy_rate, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Links */}
            <div>
                <h2 class="text-lg font-semibold mb-4">Detailed Reports</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportLinks.map((report) => (
                        <a key={report.href} href={report.href} class="card bg-base-100 shadow hover:shadow-lg transition-shadow">
                            <div class="card-body flex-row items-center gap-4">
                                <div class={`p-3 rounded-lg bg-base-200 ${report.color}`}>
                                    {report.icon === 'currency' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    {report.icon === 'card' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    )}
                                    {report.icon === 'calendar' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                    {report.icon === 'receipt' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                                        </svg>
                                    )}
                                </div>
                                <div class="flex-1">
                                    <h3 class="font-semibold">{report.title}</h3>
                                    <p class="text-sm text-base-content/70">{report.description}</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/50" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
});
