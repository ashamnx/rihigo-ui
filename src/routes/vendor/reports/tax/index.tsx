// @ts-nocheck
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { TaxReportData, DateRangePreset } from '~/types/report';
import {
    DATE_RANGE_PRESETS,
    getDateRangeFromPreset,
    formatReportCurrency,
} from '~/types/report';

export const useLoadTaxReport = routeLoader$<TaxReportData>(async (requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const url = new URL(requestEvent.url);
        const from_date = url.searchParams.get('from_date') || getDateRangeFromPreset('this_month').from;
        const to_date = url.searchParams.get('to_date') || getDateRangeFromPreset('this_month').to;

        const result = await apiClient.vendorPortal.reports.getTax({ from_date, to_date }, token);

        return result.data || {
            summary: {
                total_taxable_amount: 0,
                total_tax_collected: 0,
            },
            by_tax_type: [],
            invoices: [],
        };
    });
});

export const useExportReport = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async () => {
        return { success: true, message: 'Export started.' };
    });
});

export default component$(() => {
    const reportData = useLoadTaxReport();
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

    // Get unique tax codes from invoices
    const taxCodes = [...new Set(reportData.value.by_tax_type.map((t) => t.tax_code))];

    return (
        <div class="p-6">
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <div class="flex items-center gap-2 text-sm breadcrumbs mb-2">
                        <a href="/vendor/reports" class="link link-hover">Reports</a>
                        <span>/</span>
                        <span>Tax</span>
                    </div>
                    <h1 class="text-2xl font-bold">Tax Report</h1>
                    <p class="text-base-content/70 mt-1">
                        Tax collected breakdown for filing and compliance
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
                                <span class="label-text">Tax Period</span>
                            </label>
                            <select
                                class="select select-bordered"
                                value={datePreset.value}
                                onChange$={(e) => applyDatePreset((e.target as HTMLSelectElement).value as DateRangePreset)}
                            >
                                {DATE_RANGE_PRESETS.filter(p =>
                                    ['this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year', 'custom'].includes(p.value)
                                ).map((preset) => (
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
                            href={`/vendor/reports/tax?from_date=${filters.from_date}&to_date=${filters.to_date}`}
                            class="btn btn-primary"
                        >
                            Generate Report
                        </a>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Total Taxable Amount</div>
                    <div class="stat-value text-primary">
                        {formatReportCurrency(reportData.value.summary.total_taxable_amount, currency.value)}
                    </div>
                    <div class="stat-desc">
                        {filters.from_date} to {filters.to_date}
                    </div>
                </div>
                <div class="stat bg-base-100 rounded-box shadow">
                    <div class="stat-title">Total Tax Collected</div>
                    <div class="stat-value text-success">
                        {formatReportCurrency(reportData.value.summary.total_tax_collected, currency.value)}
                    </div>
                    <div class="stat-desc">
                        All tax types combined
                    </div>
                </div>
            </div>

            {/* Tax Breakdown by Type */}
            <div class="card bg-base-100 shadow mb-6">
                <div class="card-body">
                    <h3 class="card-title">Tax Breakdown by Type</h3>

                    {reportData.value.by_tax_type.length > 0 ? (
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Tax Type</th>
                                        <th>Code</th>
                                        <th class="text-right">Taxable Amount</th>
                                        <th class="text-right">Tax Collected</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.value.by_tax_type.map((tax, index) => (
                                        <tr key={index}>
                                            <td class="font-medium">{tax.tax_name}</td>
                                            <td>
                                                <span class="badge badge-outline">{tax.tax_code}</span>
                                            </td>
                                            <td class="text-right">
                                                {formatReportCurrency(tax.taxable_amount, currency.value)}
                                            </td>
                                            <td class="text-right font-semibold">
                                                {formatReportCurrency(tax.tax_amount, currency.value)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr class="font-bold bg-base-200">
                                        <td colspan={2}>Total</td>
                                        <td class="text-right">
                                            {formatReportCurrency(reportData.value.summary.total_taxable_amount, currency.value)}
                                        </td>
                                        <td class="text-right">
                                            {formatReportCurrency(reportData.value.summary.total_tax_collected, currency.value)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div class="py-8 text-center text-base-content/50">
                            No tax data for the selected period
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Invoice Listing */}
            <div class="card bg-base-100 shadow">
                <div class="card-body">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="card-title">Tax Collected by Invoice</h3>
                        <span class="text-sm text-base-content/70">
                            {reportData.value.invoices.length} invoices
                        </span>
                    </div>

                    {reportData.value.invoices.length > 0 ? (
                        <div class="overflow-x-auto">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Date</th>
                                        <th>Guest / Company</th>
                                        <th class="text-right">Taxable Amount</th>
                                        {taxCodes.map((code) => (
                                            <th key={code} class="text-right">{code}</th>
                                        ))}
                                        <th class="text-right">Total Tax</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.value.invoices.map((invoice) => (
                                        <tr key={invoice.invoice_number}>
                                            <td>
                                                <a href={`/vendor/invoices/${invoice.invoice_number}`} class="link link-primary">
                                                    {invoice.invoice_number}
                                                </a>
                                            </td>
                                            <td>{new Date(invoice.date).toLocaleDateString()}</td>
                                            <td>
                                                <div>{invoice.guest_name}</div>
                                                {invoice.company_name && (
                                                    <div class="text-xs text-base-content/70">{invoice.company_name}</div>
                                                )}
                                            </td>
                                            <td class="text-right">
                                                {formatReportCurrency(invoice.taxable_amount, currency.value)}
                                            </td>
                                            {taxCodes.map((code) => {
                                                const tax = invoice.taxes.find((t) => t.code === code);
                                                return (
                                                    <td key={code} class="text-right">
                                                        {tax ? formatReportCurrency(tax.amount, currency.value) : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td class="text-right font-semibold">
                                                {formatReportCurrency(invoice.total_tax, currency.value)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr class="font-bold bg-base-200">
                                        <td colspan={3}>Total</td>
                                        <td class="text-right">
                                            {formatReportCurrency(
                                                reportData.value.invoices.reduce((sum, inv) => sum + inv.taxable_amount, 0),
                                                currency.value
                                            )}
                                        </td>
                                        {taxCodes.map((code) => {
                                            const total = reportData.value.invoices.reduce((sum, inv) => {
                                                const tax = inv.taxes.find((t) => t.code === code);
                                                return sum + (tax?.amount || 0);
                                            }, 0);
                                            return (
                                                <td key={code} class="text-right">
                                                    {formatReportCurrency(total, currency.value)}
                                                </td>
                                            );
                                        })}
                                        <td class="text-right">
                                            {formatReportCurrency(
                                                reportData.value.invoices.reduce((sum, inv) => sum + inv.total_tax, 0),
                                                currency.value
                                            )}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div class="py-8 text-center text-base-content/50">
                            No invoices for the selected period
                        </div>
                    )}
                </div>
            </div>

            {/* Filing Info */}
            <div class="alert alert-info mt-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <h4 class="font-semibold">Tax Filing Reminder</h4>
                    <p class="text-sm">
                        TGST returns are due monthly by the 28th of the following month.
                        Green Tax is collected per tourist night and remitted quarterly.
                        Export this report in CSV format for your tax filing.
                    </p>
                </div>
            </div>
        </div>
    );
});
