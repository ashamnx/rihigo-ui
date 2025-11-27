// @ts-nocheck
import { component$, useSignal, useStore, $, useComputed$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { authenticatedRequest } from '~/utils/auth';
import type {
    TaxRate,
    VendorTaxSetting,
    TaxExemption,
    TaxExemptionInput,
    TaxCalculationInput,
    TaxCalculationResult,
    TaxExemptionType,
} from '~/types/tax';
import type { ServiceType } from '~/types/resource';
import {
    formatTaxRate,
    taxRateTypeLabels,
    taxExemptionTypeLabels,
    MALDIVES_TAX_RATES,
} from '~/types/tax';

interface TaxSettingsData {
    taxRates: TaxRate[];
    vendorSettings: VendorTaxSetting[];
    exemptions: TaxExemption[];
}

export const useLoadTaxSettings = routeLoader$<TaxSettingsData>(async (requestEvent) => {
    const ratesResult = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.taxes.getRates(token);
    });

    const settingsResult = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.taxes.getSettings(token);
    });

    // Default Maldives tax rates if none returned
    const defaultRates: TaxRate[] = [
        {
            id: 'tgst',
            name: MALDIVES_TAX_RATES.TGST.name,
            code: MALDIVES_TAX_RATES.TGST.code,
            rate: MALDIVES_TAX_RATES.TGST.rate,
            rate_type: MALDIVES_TAX_RATES.TGST.rate_type,
            applies_to: ['accommodation', 'activity', 'transfer', 'tour'],
            applies_to_foreigners_only: false,
            effective_from: '2023-01-01',
            is_active: true,
            is_inclusive: false,
            show_on_invoice: true,
            sort_order: 1,
        },
        {
            id: 'green_tax',
            name: MALDIVES_TAX_RATES.GREEN_TAX.name,
            code: MALDIVES_TAX_RATES.GREEN_TAX.code,
            rate: MALDIVES_TAX_RATES.GREEN_TAX.rate,
            rate_type: MALDIVES_TAX_RATES.GREEN_TAX.rate_type,
            applies_to: ['accommodation'],
            applies_to_foreigners_only: true,
            effective_from: '2023-01-01',
            is_active: true,
            is_inclusive: false,
            show_on_invoice: true,
            sort_order: 2,
        },
        {
            id: 'service_charge',
            name: MALDIVES_TAX_RATES.SERVICE_CHARGE.name,
            code: MALDIVES_TAX_RATES.SERVICE_CHARGE.code,
            rate: MALDIVES_TAX_RATES.SERVICE_CHARGE.rate,
            rate_type: MALDIVES_TAX_RATES.SERVICE_CHARGE.rate_type,
            applies_to: ['accommodation', 'activity', 'transfer', 'tour'],
            applies_to_foreigners_only: false,
            effective_from: '2023-01-01',
            is_active: true,
            is_inclusive: false,
            show_on_invoice: true,
            sort_order: 3,
        },
    ];

    return {
        taxRates: ratesResult.data?.tax_rates || defaultRates,
        vendorSettings: settingsResult.data?.settings || [],
        exemptions: settingsResult.data?.exemptions || [],
    };
});

export const useUpdateTaxSettings = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const settings = JSON.parse(data.settings as string);
        const result = await apiClient.vendorPortal.taxes.updateSettings(settings, token);
        return { success: result.success, error: result.error_message };
    });
});

export const useCalculateTax = routeAction$(async (data, requestEvent) => {
    return await authenticatedRequest(requestEvent, async (token: string) => {
        const input: TaxCalculationInput = {
            service_type: data.service_type as ServiceType,
            amount: parseFloat(data.amount as string),
            guest_nationality: data.guest_nationality as string || undefined,
            is_foreigner: data.is_foreigner === 'true',
            nights: data.nights ? parseInt(data.nights as string) : undefined,
            guests: data.guests ? parseInt(data.guests as string) : undefined,
            promo_code: data.promo_code as string || undefined,
        };
        const result = await apiClient.vendorPortal.taxes.calculate(input, token);
        return { success: result.success, data: result.data, error: result.error_message };
    });
});

export default component$(() => {
    const taxSettings = useLoadTaxSettings();
    const updateSettingsAction = useUpdateTaxSettings();
    const calculateAction = useCalculateTax();

    const activeTab = useSignal<'rates' | 'exemptions' | 'calculator'>('rates');
    const showExemptionModal = useSignal(false);
    const editingExemption = useSignal<TaxExemption | null>(null);

    // Local state for vendor settings (toggle/override)
    const localSettings = useStore<Record<string, { enabled: boolean; override?: number }>>(() => {
        const initial: Record<string, { enabled: boolean; override?: number }> = {};
        taxSettings.value.taxRates.forEach((rate) => {
            const vendorSetting = taxSettings.value.vendorSettings.find(
                (s) => s.tax_rate_id === rate.id
            );
            initial[rate.id] = {
                enabled: vendorSetting?.is_enabled ?? rate.is_active,
                override: vendorSetting?.override_rate,
            };
        });
        return initial;
    });

    // Exemption form state
    const exemptionForm = useStore<TaxExemptionInput>({
        tax_rate_id: '',
        exemption_type: 'guest_nationality',
        conditions: {},
        is_active: true,
    });

    // Calculator form state
    const calculatorForm = useStore<{
        service_type: ServiceType;
        amount: number;
        is_foreigner: boolean;
        nights: number;
        guests: number;
        guest_nationality: string;
        promo_code: string;
    }>({
        service_type: 'accommodation',
        amount: 100,
        is_foreigner: true,
        nights: 1,
        guests: 2,
        guest_nationality: '',
        promo_code: '',
    });

    const toggleTaxEnabled = $((taxId: string) => {
        if (localSettings[taxId]) {
            localSettings[taxId].enabled = !localSettings[taxId].enabled;
        }
    });

    const setOverrideRate = $((taxId: string, rate: number | undefined) => {
        if (localSettings[taxId]) {
            localSettings[taxId].override = rate;
        }
    });

    const saveSettings = $(async () => {
        const settings = Object.entries(localSettings).map(([taxId, setting]) => ({
            tax_rate_id: taxId,
            is_enabled: setting.enabled,
            override_rate: setting.override,
        }));

        // Create a form element and submit
        const form = document.createElement('form');
        form.method = 'post';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'settings';
        input.value = JSON.stringify(settings);
        form.appendChild(input);
        document.body.appendChild(form);
        form.requestSubmit();
        document.body.removeChild(form);
    });

    const openExemptionModal = $((exemption?: TaxExemption) => {
        if (exemption) {
            editingExemption.value = exemption;
            exemptionForm.tax_rate_id = exemption.tax_rate_id;
            exemptionForm.exemption_type = exemption.exemption_type;
            exemptionForm.conditions = { ...exemption.conditions };
            exemptionForm.valid_from = exemption.valid_from;
            exemptionForm.valid_to = exemption.valid_to;
            exemptionForm.is_active = exemption.is_active;
        } else {
            editingExemption.value = null;
            exemptionForm.tax_rate_id = taxSettings.value.taxRates[0]?.id || '';
            exemptionForm.exemption_type = 'guest_nationality';
            exemptionForm.conditions = {};
            exemptionForm.valid_from = undefined;
            exemptionForm.valid_to = undefined;
            exemptionForm.is_active = true;
        }
        showExemptionModal.value = true;
    });

    const hasUnsavedChanges = useComputed$(() => {
        for (const rate of taxSettings.value.taxRates) {
            const vendorSetting = taxSettings.value.vendorSettings.find(
                (s) => s.tax_rate_id === rate.id
            );
            const local = localSettings[rate.id];
            if (!local) continue;

            const originalEnabled = vendorSetting?.is_enabled ?? rate.is_active;
            const originalOverride = vendorSetting?.override_rate;

            if (local.enabled !== originalEnabled || local.override !== originalOverride) {
                return true;
            }
        }
        return false;
    });

    const serviceTypes: ServiceType[] = ['accommodation', 'activity', 'transfer', 'tour', 'rental'];

    return (
        <div class="p-6">
            {/* Header */}
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Tax Configuration</h1>
                    <p class="text-base-content/70 mt-1">
                        Manage tax rates, exemptions, and settings for your property
                    </p>
                </div>
                {hasUnsavedChanges.value && activeTab.value === 'rates' && (
                    <button class="btn btn-primary" onClick$={saveSettings}>
                        Save Changes
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div class="tabs tabs-boxed mb-6 w-fit">
                <button
                    class={`tab ${activeTab.value === 'rates' ? 'tab-active' : ''}`}
                    onClick$={() => (activeTab.value = 'rates')}
                >
                    Tax Rates
                </button>
                <button
                    class={`tab ${activeTab.value === 'exemptions' ? 'tab-active' : ''}`}
                    onClick$={() => (activeTab.value = 'exemptions')}
                >
                    Exemptions
                </button>
                <button
                    class={`tab ${activeTab.value === 'calculator' ? 'tab-active' : ''}`}
                    onClick$={() => (activeTab.value = 'calculator')}
                >
                    Calculator
                </button>
            </div>

            {/* Success/Error Messages */}
            {updateSettingsAction.value?.success && (
                <div class="alert alert-success mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tax settings updated successfully</span>
                </div>
            )}

            {updateSettingsAction.value?.error && (
                <div class="alert alert-error mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{updateSettingsAction.value.error}</span>
                </div>
            )}

            {/* Tax Rates Tab */}
            {activeTab.value === 'rates' && (
                <div class="space-y-4">
                    {/* Info Alert */}
                    <div class="alert alert-info">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p class="font-semibold">Maldives Tax Regulations</p>
                            <p class="text-sm">These tax rates are based on Maldives tourism regulations. TGST and Service Charge are mandatory for tourism services.</p>
                        </div>
                    </div>

                    {/* Tax Rate Cards */}
                    <div class="grid gap-4">
                        {taxSettings.value.taxRates.map((rate) => {
                            const setting = localSettings[rate.id];
                            return (
                                <div key={rate.id} class="card bg-base-100 shadow">
                                    <div class="card-body">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-3">
                                                    <h3 class="card-title text-lg">{rate.name}</h3>
                                                    <span class="badge badge-outline">{rate.code}</span>
                                                    {rate.applies_to_foreigners_only && (
                                                        <span class="badge badge-warning badge-sm">Foreign Tourists Only</span>
                                                    )}
                                                </div>
                                                <p class="text-base-content/70 mt-1">
                                                    {taxRateTypeLabels[rate.rate_type]} - Applies to: {rate.applies_to.join(', ')}
                                                </p>
                                            </div>

                                            <div class="flex items-center gap-4">
                                                {/* Rate Display/Override */}
                                                <div class="text-right">
                                                    <p class="text-sm text-base-content/70">Rate</p>
                                                    <div class="flex items-center gap-2">
                                                        {setting?.override !== undefined ? (
                                                            <>
                                                                <span class="text-lg font-bold text-primary">
                                                                    {formatTaxRate(setting.override, rate.rate_type, 'USD')}
                                                                </span>
                                                                <span class="text-sm text-base-content/50 line-through">
                                                                    {formatTaxRate(rate.rate, rate.rate_type, 'USD')}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span class="text-lg font-bold">
                                                                {formatTaxRate(rate.rate, rate.rate_type, 'USD')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Enable/Disable Toggle */}
                                                <div class="form-control">
                                                    <label class="label cursor-pointer gap-2">
                                                        <span class="label-text">Enabled</span>
                                                        <input
                                                            type="checkbox"
                                                            class="toggle toggle-primary"
                                                            checked={setting?.enabled}
                                                            onChange$={() => toggleTaxEnabled(rate.id)}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Override Rate Option */}
                                        {setting?.enabled && (
                                            <div class="mt-4 pt-4 border-t border-base-300">
                                                <div class="flex items-center gap-4">
                                                    <div class="form-control w-48">
                                                        <label class="label">
                                                            <span class="label-text">Override Rate (optional)</span>
                                                        </label>
                                                        <div class="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                class="input input-bordered input-sm w-24"
                                                                placeholder={String(rate.rate)}
                                                                value={setting.override ?? ''}
                                                                step={rate.rate_type === 'percentage' ? '0.1' : '1'}
                                                                onInput$={(e) => {
                                                                    const value = (e.target as HTMLInputElement).value;
                                                                    setOverrideRate(
                                                                        rate.id,
                                                                        value ? parseFloat(value) : undefined
                                                                    );
                                                                }}
                                                            />
                                                            <span class="text-sm text-base-content/70">
                                                                {rate.rate_type === 'percentage' ? '%' : 'USD'}
                                                            </span>
                                                            {setting.override !== undefined && (
                                                                <button
                                                                    class="btn btn-ghost btn-xs"
                                                                    onClick$={() => setOverrideRate(rate.id, undefined)}
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div class="flex items-center gap-4 ml-auto text-sm text-base-content/70">
                                                        <span>
                                                            {rate.is_inclusive ? 'Inclusive' : 'Exclusive'} tax
                                                        </span>
                                                        <span>
                                                            {rate.show_on_invoice ? 'Shown on invoice' : 'Hidden on invoice'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Save Button (sticky at bottom if changes) */}
                    {hasUnsavedChanges.value && (
                        <div class="sticky bottom-4 flex justify-end">
                            <Form action={updateSettingsAction}>
                                <input
                                    type="hidden"
                                    name="settings"
                                    value={JSON.stringify(
                                        Object.entries(localSettings).map(([taxId, setting]) => ({
                                            tax_rate_id: taxId,
                                            is_enabled: setting.enabled,
                                            override_rate: setting.override,
                                        }))
                                    )}
                                />
                                <button type="submit" class="btn btn-primary btn-lg shadow-lg">
                                    Save Tax Settings
                                </button>
                            </Form>
                        </div>
                    )}
                </div>
            )}

            {/* Exemptions Tab */}
            {activeTab.value === 'exemptions' && (
                <div class="space-y-4">
                    {/* Header */}
                    <div class="flex items-center justify-between">
                        <p class="text-base-content/70">
                            Configure tax exemptions for specific guest nationalities, booking types, or promo codes.
                        </p>
                        <button class="btn btn-primary" onClick$={() => openExemptionModal()}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                            </svg>
                            Add Exemption
                        </button>
                    </div>

                    {/* Exemptions List */}
                    {taxSettings.value.exemptions.length === 0 ? (
                        <div class="card bg-base-100 shadow">
                            <div class="card-body items-center text-center py-12">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <h3 class="text-lg font-semibold">No Exemptions Configured</h3>
                                <p class="text-base-content/70">
                                    Create exemptions to automatically waive taxes for specific conditions.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Tax</th>
                                        <th>Type</th>
                                        <th>Conditions</th>
                                        <th>Validity</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taxSettings.value.exemptions.map((exemption) => {
                                        const taxRate = taxSettings.value.taxRates.find(
                                            (r) => r.id === exemption.tax_rate_id
                                        );
                                        return (
                                            <tr key={exemption.id}>
                                                <td>
                                                    <div class="font-medium">{taxRate?.name || 'Unknown'}</div>
                                                    <div class="text-sm text-base-content/70">{taxRate?.code}</div>
                                                </td>
                                                <td>
                                                    <span class="badge badge-outline">
                                                        {taxExemptionTypeLabels[exemption.exemption_type]}
                                                    </span>
                                                </td>
                                                <td>
                                                    {exemption.exemption_type === 'guest_nationality' &&
                                                        exemption.conditions.nationalities?.join(', ')}
                                                    {exemption.exemption_type === 'booking_type' &&
                                                        exemption.conditions.booking_types?.join(', ')}
                                                    {exemption.exemption_type === 'promo_code' &&
                                                        exemption.conditions.promo_codes?.join(', ')}
                                                </td>
                                                <td>
                                                    {exemption.valid_from || exemption.valid_to ? (
                                                        <div class="text-sm">
                                                            {exemption.valid_from && (
                                                                <div>From: {new Date(exemption.valid_from).toLocaleDateString()}</div>
                                                            )}
                                                            {exemption.valid_to && (
                                                                <div>To: {new Date(exemption.valid_to).toLocaleDateString()}</div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span class="text-base-content/50">Always</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span class={`badge ${exemption.is_active ? 'badge-success' : 'badge-ghost'}`}>
                                                        {exemption.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div class="flex gap-2">
                                                        <button
                                                            class="btn btn-ghost btn-xs"
                                                            onClick$={() => openExemptionModal(exemption)}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button class="btn btn-ghost btn-xs text-error">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Calculator Tab */}
            {activeTab.value === 'calculator' && (
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calculator Form */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h3 class="card-title">Tax Calculator</h3>
                            <p class="text-base-content/70 text-sm mb-4">
                                Preview how taxes will be calculated for a booking.
                            </p>

                            <Form action={calculateAction} class="space-y-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Service Type</span>
                                    </label>
                                    <select
                                        name="service_type"
                                        class="select select-bordered"
                                        value={calculatorForm.service_type}
                                        onChange$={(e) => {
                                            calculatorForm.service_type = (e.target as HTMLSelectElement).value as ServiceType;
                                        }}
                                    >
                                        {serviceTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Base Amount (USD)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        class="input input-bordered"
                                        value={calculatorForm.amount}
                                        onInput$={(e) => {
                                            calculatorForm.amount = parseFloat((e.target as HTMLInputElement).value) || 0;
                                        }}
                                    />
                                </div>

                                <div class="form-control">
                                    <label class="label cursor-pointer justify-start gap-3">
                                        <input
                                            type="checkbox"
                                            name="is_foreigner"
                                            class="checkbox"
                                            checked={calculatorForm.is_foreigner}
                                            value="true"
                                            onChange$={(e) => {
                                                calculatorForm.is_foreigner = (e.target as HTMLInputElement).checked;
                                            }}
                                        />
                                        <span class="label-text">Foreign Tourist</span>
                                    </label>
                                </div>

                                {calculatorForm.service_type === 'accommodation' && (
                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Nights</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="nights"
                                                class="input input-bordered"
                                                value={calculatorForm.nights}
                                                min={1}
                                                onInput$={(e) => {
                                                    calculatorForm.nights = parseInt((e.target as HTMLInputElement).value) || 1;
                                                }}
                                            />
                                        </div>
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">Guests</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="guests"
                                                class="input input-bordered"
                                                value={calculatorForm.guests}
                                                min={1}
                                                onInput$={(e) => {
                                                    calculatorForm.guests = parseInt((e.target as HTMLInputElement).value) || 1;
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Promo Code (optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="promo_code"
                                        class="input input-bordered"
                                        placeholder="Enter promo code"
                                        value={calculatorForm.promo_code}
                                        onInput$={(e) => {
                                            calculatorForm.promo_code = (e.target as HTMLInputElement).value;
                                        }}
                                    />
                                </div>

                                <button type="submit" class="btn btn-primary w-full">
                                    Calculate Taxes
                                </button>
                            </Form>
                        </div>
                    </div>

                    {/* Calculator Results */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h3 class="card-title">Calculation Result</h3>

                            {calculateAction.value?.success && calculateAction.value.data ? (
                                <div class="space-y-4">
                                    {/* Tax Breakdown */}
                                    <div class="space-y-2">
                                        {(calculateAction.value.data as TaxCalculationResult).taxes?.map((tax, index) => (
                                            <div key={index} class="flex justify-between items-center py-2 border-b border-base-300">
                                                <div>
                                                    <span class="font-medium">{tax.tax_name}</span>
                                                    <span class="text-sm text-base-content/70 ml-2">
                                                        ({formatTaxRate(tax.rate, tax.rate_type, 'USD')})
                                                    </span>
                                                </div>
                                                <span class={tax.is_inclusive ? 'text-base-content/70' : ''}>
                                                    ${tax.amount.toFixed(2)}
                                                    {tax.is_inclusive && <span class="text-xs ml-1">(incl.)</span>}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div class="bg-base-200 rounded-lg p-4 space-y-2">
                                        <div class="flex justify-between">
                                            <span>Taxable Amount</span>
                                            <span>${(calculateAction.value.data as TaxCalculationResult).taxable_amount?.toFixed(2)}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Total Tax</span>
                                            <span>${(calculateAction.value.data as TaxCalculationResult).total_tax?.toFixed(2)}</span>
                                        </div>
                                        <div class="divider my-1"></div>
                                        <div class="flex justify-between text-lg font-bold">
                                            <span>Total with Tax</span>
                                            <span>${(calculateAction.value.data as TaxCalculationResult).total_with_tax?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : calculateAction.value?.error ? (
                                <div class="alert alert-error">
                                    <span>{calculateAction.value.error}</span>
                                </div>
                            ) : (
                                <div class="flex flex-col items-center justify-center py-12 text-base-content/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p>Enter values and click Calculate to see the tax breakdown</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Exemption Modal */}
            {showExemptionModal.value && (
                <div class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg mb-4">
                            {editingExemption.value ? 'Edit Exemption' : 'Add Tax Exemption'}
                        </h3>

                        <div class="space-y-4">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Tax Rate</span>
                                </label>
                                <select
                                    class="select select-bordered"
                                    value={exemptionForm.tax_rate_id}
                                    onChange$={(e) => {
                                        exemptionForm.tax_rate_id = (e.target as HTMLSelectElement).value;
                                    }}
                                >
                                    <option value="">Select a tax</option>
                                    {taxSettings.value.taxRates.map((rate) => (
                                        <option key={rate.id} value={rate.id}>
                                            {rate.name} ({rate.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Exemption Type</span>
                                </label>
                                <select
                                    class="select select-bordered"
                                    value={exemptionForm.exemption_type}
                                    onChange$={(e) => {
                                        exemptionForm.exemption_type = (e.target as HTMLSelectElement).value as TaxExemptionType;
                                        exemptionForm.conditions = {};
                                    }}
                                >
                                    <option value="guest_nationality">Guest Nationality</option>
                                    <option value="booking_type">Booking Type</option>
                                    <option value="promo_code">Promo Code</option>
                                </select>
                            </div>

                            {/* Conditions based on type */}
                            {exemptionForm.exemption_type === 'guest_nationality' && (
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Nationalities (comma-separated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        class="input input-bordered"
                                        placeholder="MV, IN, LK"
                                        value={exemptionForm.conditions.nationalities?.join(', ') || ''}
                                        onInput$={(e) => {
                                            const value = (e.target as HTMLInputElement).value;
                                            exemptionForm.conditions.nationalities = value
                                                .split(',')
                                                .map((s) => s.trim())
                                                .filter(Boolean);
                                        }}
                                    />
                                    <label class="label">
                                        <span class="label-text-alt">Use country codes (e.g., MV for Maldives)</span>
                                    </label>
                                </div>
                            )}

                            {exemptionForm.exemption_type === 'booking_type' && (
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Booking Types</span>
                                    </label>
                                    <div class="flex flex-wrap gap-2">
                                        {['corporate', 'group', 'government', 'staff'].map((type) => (
                                            <label key={type} class="label cursor-pointer gap-2">
                                                <input
                                                    type="checkbox"
                                                    class="checkbox checkbox-sm"
                                                    checked={exemptionForm.conditions.booking_types?.includes(type)}
                                                    onChange$={(e) => {
                                                        if (!exemptionForm.conditions.booking_types) {
                                                            exemptionForm.conditions.booking_types = [];
                                                        }
                                                        if ((e.target as HTMLInputElement).checked) {
                                                            exemptionForm.conditions.booking_types.push(type);
                                                        } else {
                                                            exemptionForm.conditions.booking_types = exemptionForm.conditions.booking_types.filter(
                                                                (t) => t !== type
                                                            );
                                                        }
                                                    }}
                                                />
                                                <span class="label-text capitalize">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {exemptionForm.exemption_type === 'promo_code' && (
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Promo Codes (comma-separated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        class="input input-bordered"
                                        placeholder="TAXFREE, EXEMPT2024"
                                        value={exemptionForm.conditions.promo_codes?.join(', ') || ''}
                                        onInput$={(e) => {
                                            const value = (e.target as HTMLInputElement).value;
                                            exemptionForm.conditions.promo_codes = value
                                                .split(',')
                                                .map((s) => s.trim().toUpperCase())
                                                .filter(Boolean);
                                        }}
                                    />
                                </div>
                            )}

                            <div class="grid grid-cols-2 gap-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Valid From</span>
                                    </label>
                                    <input
                                        type="date"
                                        class="input input-bordered"
                                        value={exemptionForm.valid_from || ''}
                                        onInput$={(e) => {
                                            exemptionForm.valid_from = (e.target as HTMLInputElement).value || undefined;
                                        }}
                                    />
                                </div>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Valid To</span>
                                    </label>
                                    <input
                                        type="date"
                                        class="input input-bordered"
                                        value={exemptionForm.valid_to || ''}
                                        onInput$={(e) => {
                                            exemptionForm.valid_to = (e.target as HTMLInputElement).value || undefined;
                                        }}
                                    />
                                </div>
                            </div>

                            <div class="form-control">
                                <label class="label cursor-pointer justify-start gap-3">
                                    <input
                                        type="checkbox"
                                        class="toggle toggle-primary"
                                        checked={exemptionForm.is_active}
                                        onChange$={(e) => {
                                            exemptionForm.is_active = (e.target as HTMLInputElement).checked;
                                        }}
                                    />
                                    <span class="label-text">Active</span>
                                </label>
                            </div>
                        </div>

                        <div class="modal-action">
                            <button class="btn btn-ghost" onClick$={() => (showExemptionModal.value = false)}>
                                Cancel
                            </button>
                            <button class="btn btn-primary">
                                {editingExemption.value ? 'Save Changes' : 'Add Exemption'}
                            </button>
                        </div>
                    </div>
                    <div class="modal-backdrop" onClick$={() => (showExemptionModal.value = false)}></div>
                </div>
            )}
        </div>
    );
});
