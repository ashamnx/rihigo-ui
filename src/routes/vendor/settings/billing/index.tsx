// @ts-nocheck
import { component$, useSignal, useStore, $, useComputed$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, type DocumentHead } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type { VendorBillingSettings, BillingSettingsInput } from '~/types/billing';
import {
    CURRENCIES,
    PAYMENT_TERMS_OPTIONS,
    QUOTATION_VALIDITY_OPTIONS,
    REMINDER_DAY_OPTIONS,
    DEFAULT_BILLING_SETTINGS,
    generateDocumentNumber,
} from '~/types/billing';

export const useLoadBillingSettings = routeLoader$<VendorBillingSettings>(async (requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const result = await apiClient.vendorPortal.billingSettings.get(token);
        return result.data || DEFAULT_BILLING_SETTINGS;
    });
});

export const useUpdateBillingSettings = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const settings: BillingSettingsInput = {
            // Numbering
            invoice_prefix: data.invoice_prefix as string,
            invoice_next_number: parseInt(data.invoice_next_number as string),
            quotation_prefix: data.quotation_prefix as string,
            quotation_next_number: parseInt(data.quotation_next_number as string),
            receipt_prefix: data.receipt_prefix as string,
            receipt_next_number: parseInt(data.receipt_next_number as string),

            // Defaults
            default_currency: data.default_currency as string,
            default_payment_terms_days: parseInt(data.default_payment_terms_days as string),
            default_quotation_validity_days: parseInt(data.default_quotation_validity_days as string),

            // Tax
            tax_registration_number: data.tax_registration_number as string || undefined,
            is_tax_inclusive_pricing: data.is_tax_inclusive_pricing === 'true',

            // Content
            invoice_header: data.invoice_header as string || undefined,
            invoice_footer: data.invoice_footer as string || undefined,
            payment_instructions: data.payment_instructions as string || undefined,

            // Bank
            bank_name: data.bank_name as string || undefined,
            bank_account_name: data.bank_account_name as string || undefined,
            bank_account_number: data.bank_account_number as string || undefined,
            bank_swift_code: data.bank_swift_code as string || undefined,
            bank_iban: data.bank_iban as string || undefined,

            // Automation
            auto_generate_invoice_on_booking: data.auto_generate_invoice_on_booking === 'true',
            auto_send_invoice_on_generation: data.auto_send_invoice_on_generation === 'true',
            send_payment_reminders: data.send_payment_reminders === 'true',
            reminder_days_before_due: data.reminder_days
                ? (data.reminder_days as string).split(',').map(Number)
                : [],
        };

        const result = await apiClient.vendorPortal.billingSettings.update(settings, token);
        return { success: result.success, error: result.error_message };
    });
});

export default component$(() => {
    const billingSettings = useLoadBillingSettings();
    const updateAction = useUpdateBillingSettings();

    const activeSection = useSignal<'numbering' | 'defaults' | 'content' | 'bank' | 'automation'>('numbering');

    // Local form state
    const formState = useStore<BillingSettingsInput>(() => ({
        // Numbering
        invoice_prefix: billingSettings.value.invoice_prefix || DEFAULT_BILLING_SETTINGS.invoice_prefix,
        invoice_next_number: billingSettings.value.invoice_next_number || DEFAULT_BILLING_SETTINGS.invoice_next_number,
        quotation_prefix: billingSettings.value.quotation_prefix || DEFAULT_BILLING_SETTINGS.quotation_prefix,
        quotation_next_number: billingSettings.value.quotation_next_number || DEFAULT_BILLING_SETTINGS.quotation_next_number,
        receipt_prefix: billingSettings.value.receipt_prefix || DEFAULT_BILLING_SETTINGS.receipt_prefix,
        receipt_next_number: billingSettings.value.receipt_next_number || DEFAULT_BILLING_SETTINGS.receipt_next_number,

        // Defaults
        default_currency: billingSettings.value.default_currency || DEFAULT_BILLING_SETTINGS.default_currency,
        default_payment_terms_days: billingSettings.value.default_payment_terms_days ?? DEFAULT_BILLING_SETTINGS.default_payment_terms_days,
        default_quotation_validity_days: billingSettings.value.default_quotation_validity_days ?? DEFAULT_BILLING_SETTINGS.default_quotation_validity_days,

        // Tax
        tax_registration_number: billingSettings.value.tax_registration_number,
        is_tax_inclusive_pricing: billingSettings.value.is_tax_inclusive_pricing ?? DEFAULT_BILLING_SETTINGS.is_tax_inclusive_pricing,

        // Content
        invoice_header: billingSettings.value.invoice_header,
        invoice_footer: billingSettings.value.invoice_footer,
        payment_instructions: billingSettings.value.payment_instructions,

        // Bank
        bank_name: billingSettings.value.bank_name,
        bank_account_name: billingSettings.value.bank_account_name,
        bank_account_number: billingSettings.value.bank_account_number,
        bank_swift_code: billingSettings.value.bank_swift_code,
        bank_iban: billingSettings.value.bank_iban,

        // Automation
        auto_generate_invoice_on_booking: billingSettings.value.auto_generate_invoice_on_booking ?? DEFAULT_BILLING_SETTINGS.auto_generate_invoice_on_booking,
        auto_send_invoice_on_generation: billingSettings.value.auto_send_invoice_on_generation ?? DEFAULT_BILLING_SETTINGS.auto_send_invoice_on_generation,
        send_payment_reminders: billingSettings.value.send_payment_reminders ?? DEFAULT_BILLING_SETTINGS.send_payment_reminders,
        reminder_days_before_due: billingSettings.value.reminder_days_before_due || DEFAULT_BILLING_SETTINGS.reminder_days_before_due,
    }));

    // Selected reminder days
    const selectedReminderDays = useStore<Record<number, boolean>>(() => {
        const initial: Record<number, boolean> = {};
        REMINDER_DAY_OPTIONS.forEach((opt) => {
            initial[opt.days] = formState.reminder_days_before_due?.includes(opt.days) || false;
        });
        return initial;
    });

    const toggleReminderDay = $((days: number) => {
        selectedReminderDays[days] = !selectedReminderDays[days];
        formState.reminder_days_before_due = Object.entries(selectedReminderDays)
            .filter(([, selected]) => selected)
            .map(([d]) => parseInt(d))
            .sort((a, b) => b - a);
    });

    // Preview document numbers
    const invoicePreview = useComputed$(() =>
        generateDocumentNumber(formState.invoice_prefix || 'INV', formState.invoice_next_number || 1)
    );
    const quotationPreview = useComputed$(() =>
        generateDocumentNumber(formState.quotation_prefix || 'QUO', formState.quotation_next_number || 1)
    );
    const receiptPreview = useComputed$(() =>
        generateDocumentNumber(formState.receipt_prefix || 'REC', formState.receipt_next_number || 1)
    );

    const sections = [
        { id: 'numbering' as const, name: 'Document Numbering', icon: '123' },
        { id: 'defaults' as const, name: 'Default Values', icon: 'cog' },
        { id: 'content' as const, name: 'Invoice Content', icon: 'document' },
        { id: 'bank' as const, name: 'Bank Details', icon: 'bank' },
        { id: 'automation' as const, name: 'Automation', icon: 'lightning' },
    ];

    return (
        <div class="p-6">
            {/* Header */}
            <div class="mb-6">
                <h1 class="text-2xl font-bold">Billing Settings</h1>
                <p class="text-base-content/70 mt-1">
                    Configure invoice numbering, payment terms, and billing automation
                </p>
            </div>

            {/* Success/Error Messages */}
            {updateAction.value?.success && (
                <div class="alert alert-success mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Billing settings updated successfully</span>
                </div>
            )}

            {updateAction.value?.error && (
                <div class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{updateAction.value.error}</span>
                </div>
            )}

            <div class="flex gap-6">
                {/* Sidebar Navigation */}
                <div class="w-64 shrink-0">
                    <ul class="menu bg-base-100 rounded-box shadow">
                        {sections.map((section) => (
                            <li key={section.id}>
                                <button
                                    class={activeSection.value === section.id ? 'active' : ''}
                                    onClick$={() => (activeSection.value = section.id)}
                                >
                                    {section.id === 'numbering' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                    )}
                                    {section.id === 'defaults' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                    {section.id === 'content' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )}
                                    {section.id === 'bank' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    )}
                                    {section.id === 'automation' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    )}
                                    {section.name}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Payment Methods Link */}
                    <div class="mt-4">
                        <a href="/vendor/settings/payment-methods" class="btn btn-outline w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Payment Methods
                        </a>
                    </div>
                </div>

                {/* Main Content */}
                <div class="flex-1">
                    <Form action={updateAction}>
                        {/* Hidden fields for all values */}
                        <input type="hidden" name="invoice_prefix" value={formState.invoice_prefix} />
                        <input type="hidden" name="invoice_next_number" value={formState.invoice_next_number} />
                        <input type="hidden" name="quotation_prefix" value={formState.quotation_prefix} />
                        <input type="hidden" name="quotation_next_number" value={formState.quotation_next_number} />
                        <input type="hidden" name="receipt_prefix" value={formState.receipt_prefix} />
                        <input type="hidden" name="receipt_next_number" value={formState.receipt_next_number} />
                        <input type="hidden" name="default_currency" value={formState.default_currency} />
                        <input type="hidden" name="default_payment_terms_days" value={formState.default_payment_terms_days} />
                        <input type="hidden" name="default_quotation_validity_days" value={formState.default_quotation_validity_days} />
                        <input type="hidden" name="tax_registration_number" value={formState.tax_registration_number || ''} />
                        <input type="hidden" name="is_tax_inclusive_pricing" value={String(formState.is_tax_inclusive_pricing)} />
                        <input type="hidden" name="invoice_header" value={formState.invoice_header || ''} />
                        <input type="hidden" name="invoice_footer" value={formState.invoice_footer || ''} />
                        <input type="hidden" name="payment_instructions" value={formState.payment_instructions || ''} />
                        <input type="hidden" name="bank_name" value={formState.bank_name || ''} />
                        <input type="hidden" name="bank_account_name" value={formState.bank_account_name || ''} />
                        <input type="hidden" name="bank_account_number" value={formState.bank_account_number || ''} />
                        <input type="hidden" name="bank_swift_code" value={formState.bank_swift_code || ''} />
                        <input type="hidden" name="bank_iban" value={formState.bank_iban || ''} />
                        <input type="hidden" name="auto_generate_invoice_on_booking" value={String(formState.auto_generate_invoice_on_booking)} />
                        <input type="hidden" name="auto_send_invoice_on_generation" value={String(formState.auto_send_invoice_on_generation)} />
                        <input type="hidden" name="send_payment_reminders" value={String(formState.send_payment_reminders)} />
                        <input type="hidden" name="reminder_days" value={formState.reminder_days_before_due?.join(',') || ''} />

                        {/* Document Numbering Section */}
                        {activeSection.value === 'numbering' && (
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h2 class="card-title">Document Numbering</h2>
                                    <p class="text-base-content/70 mb-4">
                                        Configure prefixes and starting numbers for invoices, quotations, and receipts.
                                    </p>

                                    <div class="space-y-6">
                                        {/* Invoice Numbering */}
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Invoice Prefix</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    class="input input-bordered"
                                                    value={formState.invoice_prefix}
                                                    onInput$={(e) => {
                                                        formState.invoice_prefix = (e.target as HTMLInputElement).value;
                                                    }}
                                                />
                                            </div>
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Next Number</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    class="input input-bordered"
                                                    min={1}
                                                    value={formState.invoice_next_number}
                                                    onInput$={(e) => {
                                                        formState.invoice_next_number = parseInt((e.target as HTMLInputElement).value) || 1;
                                                    }}
                                                />
                                            </div>
                                            <div class="bg-base-200 rounded-lg p-3">
                                                <span class="text-sm text-base-content/70">Preview:</span>
                                                <span class="font-mono ml-2">{invoicePreview.value}</span>
                                            </div>
                                        </div>

                                        <div class="divider"></div>

                                        {/* Quotation Numbering */}
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Quotation Prefix</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    class="input input-bordered"
                                                    value={formState.quotation_prefix}
                                                    onInput$={(e) => {
                                                        formState.quotation_prefix = (e.target as HTMLInputElement).value;
                                                    }}
                                                />
                                            </div>
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Next Number</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    class="input input-bordered"
                                                    min={1}
                                                    value={formState.quotation_next_number}
                                                    onInput$={(e) => {
                                                        formState.quotation_next_number = parseInt((e.target as HTMLInputElement).value) || 1;
                                                    }}
                                                />
                                            </div>
                                            <div class="bg-base-200 rounded-lg p-3">
                                                <span class="text-sm text-base-content/70">Preview:</span>
                                                <span class="font-mono ml-2">{quotationPreview.value}</span>
                                            </div>
                                        </div>

                                        <div class="divider"></div>

                                        {/* Receipt Numbering */}
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Receipt Prefix</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    class="input input-bordered"
                                                    value={formState.receipt_prefix}
                                                    onInput$={(e) => {
                                                        formState.receipt_prefix = (e.target as HTMLInputElement).value;
                                                    }}
                                                />
                                            </div>
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Next Number</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    class="input input-bordered"
                                                    min={1}
                                                    value={formState.receipt_next_number}
                                                    onInput$={(e) => {
                                                        formState.receipt_next_number = parseInt((e.target as HTMLInputElement).value) || 1;
                                                    }}
                                                />
                                            </div>
                                            <div class="bg-base-200 rounded-lg p-3">
                                                <span class="text-sm text-base-content/70">Preview:</span>
                                                <span class="font-mono ml-2">{receiptPreview.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Default Values Section */}
                        {activeSection.value === 'defaults' && (
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h2 class="card-title">Default Values</h2>
                                    <p class="text-base-content/70 mb-4">
                                        Set default currency, payment terms, and tax settings.
                                    </p>

                                    <div class="space-y-6">
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Currency */}
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Default Currency</span>
                                                </label>
                                                <select
                                                    class="select select-bordered"
                                                    value={formState.default_currency}
                                                    onChange$={(e) => {
                                                        formState.default_currency = (e.target as HTMLSelectElement).value;
                                                    }}
                                                >
                                                    {CURRENCIES.map((currency) => (
                                                        <option key={currency.code} value={currency.code}>
                                                            {currency.code} - {currency.name} ({currency.symbol})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Payment Terms */}
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Default Payment Terms</span>
                                                </label>
                                                <select
                                                    class="select select-bordered"
                                                    value={formState.default_payment_terms_days}
                                                    onChange$={(e) => {
                                                        formState.default_payment_terms_days = parseInt((e.target as HTMLSelectElement).value);
                                                    }}
                                                >
                                                    {PAYMENT_TERMS_OPTIONS.map((option) => (
                                                        <option key={option.days} value={option.days}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Quotation Validity */}
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Default Quotation Validity</span>
                                                </label>
                                                <select
                                                    class="select select-bordered"
                                                    value={formState.default_quotation_validity_days}
                                                    onChange$={(e) => {
                                                        formState.default_quotation_validity_days = parseInt((e.target as HTMLSelectElement).value);
                                                    }}
                                                >
                                                    {QUOTATION_VALIDITY_OPTIONS.map((option) => (
                                                        <option key={option.days} value={option.days}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Tax Registration Number */}
                                            <div class="form-control">
                                                <label class="label">
                                                    <span class="label-text">Tax Registration Number</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    class="input input-bordered"
                                                    placeholder="e.g., TIN-12345678"
                                                    value={formState.tax_registration_number || ''}
                                                    onInput$={(e) => {
                                                        formState.tax_registration_number = (e.target as HTMLInputElement).value;
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div class="divider"></div>

                                        {/* Tax Inclusive Pricing */}
                                        <div class="form-control">
                                            <label class="label cursor-pointer justify-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    class="toggle toggle-primary"
                                                    checked={formState.is_tax_inclusive_pricing}
                                                    onChange$={(e) => {
                                                        formState.is_tax_inclusive_pricing = (e.target as HTMLInputElement).checked;
                                                    }}
                                                />
                                                <div>
                                                    <span class="label-text font-medium">Tax-Inclusive Pricing</span>
                                                    <p class="text-sm text-base-content/70">
                                                        When enabled, displayed prices include applicable taxes
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Invoice Content Section */}
                        {activeSection.value === 'content' && (
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h2 class="card-title">Invoice Content</h2>
                                    <p class="text-base-content/70 mb-4">
                                        Customize the header, footer, and payment instructions on your invoices.
                                    </p>

                                    <div class="space-y-6">
                                        {/* Invoice Header */}
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Invoice Header / Company Details</span>
                                            </label>
                                            <textarea
                                                class="textarea textarea-bordered h-32"
                                                placeholder="Your company name, address, contact details..."
                                                value={formState.invoice_header || ''}
                                                onInput$={(e) => {
                                                    formState.invoice_header = (e.target as HTMLTextAreaElement).value;
                                                }}
                                            />
                                            <label class="label">
                                                <span class="label-text-alt">This appears at the top of your invoices</span>
                                            </label>
                                        </div>

                                        {/* Payment Instructions */}
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Payment Instructions</span>
                                            </label>
                                            <textarea
                                                class="textarea textarea-bordered h-24"
                                                placeholder="Instructions for how to pay..."
                                                value={formState.payment_instructions || ''}
                                                onInput$={(e) => {
                                                    formState.payment_instructions = (e.target as HTMLTextAreaElement).value;
                                                }}
                                            />
                                        </div>

                                        {/* Invoice Footer */}
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Invoice Footer / Terms & Conditions</span>
                                            </label>
                                            <textarea
                                                class="textarea textarea-bordered h-24"
                                                placeholder="Terms and conditions, thank you message..."
                                                value={formState.invoice_footer || ''}
                                                onInput$={(e) => {
                                                    formState.invoice_footer = (e.target as HTMLTextAreaElement).value;
                                                }}
                                            />
                                            <label class="label">
                                                <span class="label-text-alt">This appears at the bottom of your invoices</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bank Details Section */}
                        {activeSection.value === 'bank' && (
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h2 class="card-title">Bank Details</h2>
                                    <p class="text-base-content/70 mb-4">
                                        Enter your bank account details for wire transfers.
                                    </p>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Bank Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                class="input input-bordered"
                                                placeholder="e.g., Bank of Maldives"
                                                value={formState.bank_name || ''}
                                                onInput$={(e) => {
                                                    formState.bank_name = (e.target as HTMLInputElement).value;
                                                }}
                                            />
                                        </div>

                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Account Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                class="input input-bordered"
                                                placeholder="Account holder name"
                                                value={formState.bank_account_name || ''}
                                                onInput$={(e) => {
                                                    formState.bank_account_name = (e.target as HTMLInputElement).value;
                                                }}
                                            />
                                        </div>

                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Account Number</span>
                                            </label>
                                            <input
                                                type="text"
                                                class="input input-bordered"
                                                placeholder="Account number"
                                                value={formState.bank_account_number || ''}
                                                onInput$={(e) => {
                                                    formState.bank_account_number = (e.target as HTMLInputElement).value;
                                                }}
                                            />
                                        </div>

                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">SWIFT Code</span>
                                            </label>
                                            <input
                                                type="text"
                                                class="input input-bordered"
                                                placeholder="e.g., BMLMMVMV"
                                                value={formState.bank_swift_code || ''}
                                                onInput$={(e) => {
                                                    formState.bank_swift_code = (e.target as HTMLInputElement).value;
                                                }}
                                            />
                                        </div>

                                        <div class="form-control md:col-span-2">
                                            <label class="label">
                                                <span class="label-text">IBAN (Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                class="input input-bordered"
                                                placeholder="International Bank Account Number"
                                                value={formState.bank_iban || ''}
                                                onInput$={(e) => {
                                                    formState.bank_iban = (e.target as HTMLInputElement).value;
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Automation Section */}
                        {activeSection.value === 'automation' && (
                            <div class="card bg-base-100 shadow">
                                <div class="card-body">
                                    <h2 class="card-title">Automation</h2>
                                    <p class="text-base-content/70 mb-4">
                                        Configure automatic invoice generation and payment reminders.
                                    </p>

                                    <div class="space-y-6">
                                        {/* Auto Generate Invoice */}
                                        <div class="form-control">
                                            <label class="label cursor-pointer justify-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    class="toggle toggle-primary"
                                                    checked={formState.auto_generate_invoice_on_booking}
                                                    onChange$={(e) => {
                                                        formState.auto_generate_invoice_on_booking = (e.target as HTMLInputElement).checked;
                                                    }}
                                                />
                                                <div>
                                                    <span class="label-text font-medium">Auto-generate invoice on booking</span>
                                                    <p class="text-sm text-base-content/70">
                                                        Automatically create an invoice when a booking is confirmed
                                                    </p>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Auto Send Invoice */}
                                        <div class="form-control">
                                            <label class="label cursor-pointer justify-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    class="toggle toggle-primary"
                                                    checked={formState.auto_send_invoice_on_generation}
                                                    disabled={!formState.auto_generate_invoice_on_booking}
                                                    onChange$={(e) => {
                                                        formState.auto_send_invoice_on_generation = (e.target as HTMLInputElement).checked;
                                                    }}
                                                />
                                                <div>
                                                    <span class={`label-text font-medium ${!formState.auto_generate_invoice_on_booking ? 'opacity-50' : ''}`}>
                                                        Auto-send invoice on generation
                                                    </span>
                                                    <p class={`text-sm text-base-content/70 ${!formState.auto_generate_invoice_on_booking ? 'opacity-50' : ''}`}>
                                                        Automatically email the invoice to the guest when generated
                                                    </p>
                                                </div>
                                            </label>
                                        </div>

                                        <div class="divider"></div>

                                        {/* Payment Reminders */}
                                        <div class="form-control">
                                            <label class="label cursor-pointer justify-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    class="toggle toggle-primary"
                                                    checked={formState.send_payment_reminders}
                                                    onChange$={(e) => {
                                                        formState.send_payment_reminders = (e.target as HTMLInputElement).checked;
                                                    }}
                                                />
                                                <div>
                                                    <span class="label-text font-medium">Send payment reminders</span>
                                                    <p class="text-sm text-base-content/70">
                                                        Automatically send reminders for unpaid invoices
                                                    </p>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Reminder Days Selection */}
                                        {formState.send_payment_reminders && (
                                            <div class="ml-14 space-y-2">
                                                <label class="label">
                                                    <span class="label-text">Send reminders:</span>
                                                </label>
                                                <div class="flex flex-wrap gap-2">
                                                    {REMINDER_DAY_OPTIONS.map((option) => (
                                                        <label
                                                            key={option.days}
                                                            class={`btn btn-sm ${selectedReminderDays[option.days] ? 'btn-primary' : 'btn-outline'}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                class="hidden"
                                                                checked={selectedReminderDays[option.days]}
                                                                onChange$={() => toggleReminderDay(option.days)}
                                                            />
                                                            {option.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div class="mt-6 flex justify-end">
                            <button type="submit" class="btn btn-primary">
                                Save Settings
                            </button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Billing Settings | Vendor Portal | Rihigo",
    meta: [
        {
            name: "description",
            content: "Configure invoice numbering, payment terms, and billing automation",
        },
    ],
};
