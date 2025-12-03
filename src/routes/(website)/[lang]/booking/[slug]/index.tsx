import {component$, useSignal, useStore, useComputed$, $, type QRL} from '@builder.io/qwik';
import {Form, routeAction$, routeLoader$, useLocation, useNavigate, type DocumentHead} from '@builder.io/qwik-city';
import {getActivityBySlug} from '~/services/activity-api';
import {inlineTranslate} from 'qwik-speak';
import {useSession} from '~/routes/plugin@auth';
import {
    BOOKING_TYPE_PRESETS,
    getFieldsForConfig,
    mergeBookingConfigs,
    type BookingFieldConfig,
    type BookingType,
    type BookingFieldDefinition,
} from '~/types/booking-fields';
import {authenticatedRequest, apiClient} from '~/utils/api-client';
import type {ActivityPackage} from '~/types/activity';
import {useCurrency, formatPrice} from '~/context/currency-context';

export const head: DocumentHead = {
  title: 'Book Now | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Complete your booking',
    },
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
};

// Helper functions moved outside components
function getNextWeekend(d: Date): Date {
    const day = d.getDay();
    const diff = day === 0 ? 6 : 6 - day;
    return new Date(d.getTime() + diff * 86400000);
}

function formatDateISO(d: Date): string {
    return d.toISOString().split('T')[0];
}

function formatDateDisplay(d: Date): string {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export const useActivityData = routeLoader$(async (requestEvent) => {
    const slug = requestEvent.params.slug;
    const lang = requestEvent.params.lang || 'en';
    const session = requestEvent.sharedMap.get('session');

    // Server-side authentication check
    if (!session || !session.user) {
        const callbackUrl = encodeURIComponent(requestEvent.url.pathname + requestEvent.url.search);
        throw requestEvent.redirect(302, `/${lang}/auth/sign-in?callbackUrl=${callbackUrl}`);
    }

    try {
        const activity = await getActivityBySlug(slug, lang);
        return {
            success: true,
            data: activity,
            error: null
        };
    } catch (error) {
        console.error('Failed to load activity:', error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Activity not found'
        };
    }
});

export const useCreateBooking = routeAction$(async (data, requestEvent) => {
    const lang = requestEvent.params.lang || 'en';

    // Booking date - use booking_date or check_in_date, fallback to tomorrow
    let bookingDate = data.booking_date as string || data.check_in_date as string;
    if (!bookingDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        bookingDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // Build booking data according to API spec
    // Required: activity_id, booking_date, number_of_people, customer_info, payment_method
    // Optional: package_id, display_currency, notes
    const bookingData = {
        activity_id: data.activity_id as string,
        package_id: (data.package_id as string) || undefined,
        booking_date: bookingDate,
        number_of_people: data.number_of_people ? parseInt(data.number_of_people as string) : 1,
        customer_info: {
            name: data.name as string,  // API expects 'name' not 'name'
            email: data.email as string,
            phone: data.phone as string,
        },
        payment_method: data.payment_method as string || 'card',
        notes: (data.notes as string) || (data.special_requests as string) || undefined,
        display_currency: (data.display_currency as string) || undefined,
    };

    const response = await authenticatedRequest(requestEvent, (token) =>
        apiClient.bookings.create(bookingData, token)
    );

    if (!response.success) {
        return {
            success: false,
            error: response.error_message || 'Failed to create booking'
        };
    }

    // Redirect to confirmation page on success
    const bookingId = response.data?.id;
    if (bookingId) {
        throw requestEvent.redirect(302, `/${lang}/bookings/${bookingId}/confirmation`);
    }

    return {
        success: true,
        data: response.data
    };
});

// Step indicator component with labels
const StepIndicator = component$<{currentStep: number; steps: {title: string; key: string}[]}>(
    ({currentStep, steps}) => {
        return (
            <div class="flex items-center justify-center gap-1 sm:gap-2 mb-6">
                {steps.map((step, i) => (
                    <div key={step.key} class="flex items-center">
                        <div class="flex flex-col items-center gap-1">
                            <div class={`flex items-center justify-center size-8 sm:size-10 rounded-full text-sm font-semibold transition-all ${
                                i < currentStep
                                    ? 'bg-success text-success-content'
                                    : i === currentStep
                                        ? 'bg-primary text-primary-content ring-4 ring-primary/20'
                                        : 'bg-base-200 text-base-content/50'
                            }`}>
                                {i < currentStep ? (
                                    <svg class="size-4 sm:size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                    </svg>
                                ) : (
                                    i + 1
                                )}
                            </div>
                            <span class={`text-xs font-medium hidden sm:block ${
                                i <= currentStep ? 'text-base-content' : 'text-base-content/50'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div class={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 mb-4 sm:mb-5 transition-colors ${
                                i < currentStep ? 'bg-success' : 'bg-base-200'
                            }`}/>
                        )}
                    </div>
                ))}
            </div>
        );
    }
);

// Package selection card
const PackageCard = component$<{
    pkg: ActivityPackage;
    lang: string;
    isSelected: boolean;
    onSelect$: QRL<() => void>;
}>(({pkg, lang, isSelected, onSelect$}) => {
    const {selectedCurrency, currencies} = useCurrency();
    const config = pkg.options_config as any;
    const pricingTiers = config?.pricingTiers || [];
    const dbPrice = pkg.prices?.[0];
    const priceUsd = pricingTiers[0]?.price ?? dbPrice?.amount ?? 0;
    const title = pkg.translations?.[lang]?.name || config?.title || pkg.name_internal;
    const description = pkg.translations?.[lang]?.description || config?.description || '';
    const inclusions = config?.inclusions || [];
    const duration = config?.duration || config?.bookingOptions?.duration;

    return (
        <button
            type="button"
            onClick$={onSelect$}
            class={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-base-200 hover:border-primary/50 hover:bg-base-50'
            }`}
        >
            <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-base-content">{title}</h4>
                        {pkg.is_recommended && (
                            <span class="badge badge-primary badge-sm">Recommended</span>
                        )}
                    </div>
                    {description && (
                        <p class="text-sm text-base-content/60 mt-1 line-clamp-2">{description}</p>
                    )}
                    <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-base-content/70">
                        {duration && (
                            <span class="flex items-center gap-1">
                                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                {duration} min
                            </span>
                        )}
                        {inclusions.length > 0 && (
                            <span class="flex items-center gap-1">
                                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                {inclusions.length} inclusions
                            </span>
                        )}
                    </div>
                </div>
                <div class="text-right flex-shrink-0">
                    <div class="text-lg font-bold text-primary">{formatPrice(priceUsd, selectedCurrency.value, currencies.value)}</div>
                    <div class="text-xs text-base-content/50">{selectedCurrency.value}</div>
                </div>
            </div>
            {/* Selection indicator */}
            <div class={`mt-3 flex items-center gap-2 text-sm ${isSelected ? 'text-primary' : 'text-base-content/40'}`}>
                <div class={`size-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-current'
                }`}>
                    {isSelected && (
                        <svg class="size-3 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                    )}
                </div>
                {isSelected ? 'Selected' : 'Select this package'}
            </div>
        </button>
    );
});

// Guest counter component
const GuestCounter = component$<{
    value: number;
    onIncrement$: QRL<() => void>;
    onDecrement$: QRL<() => void>;
    min?: number;
    max?: number;
    label?: string;
}>(({value, onIncrement$, onDecrement$, min = 1, max = 20, label = 'Guests'}) => {
    return (
        <div class="flex items-center justify-between p-4 bg-base-100 rounded-xl border border-base-200">
            <span class="font-medium text-base-content">{label}</span>
            <div class="flex items-center gap-3">
                <button
                    type="button"
                    onClick$={onDecrement$}
                    disabled={value <= min}
                    class="btn btn-circle btn-sm btn-outline"
                >
                    <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                    </svg>
                </button>
                <span class="text-xl font-bold min-w-[2ch] text-center">{value}</span>
                <button
                    type="button"
                    onClick$={onIncrement$}
                    disabled={value >= max}
                    class="btn btn-circle btn-sm btn-outline"
                >
                    <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                </button>
            </div>
        </div>
    );
});

// Quick date selector
const QuickDatePicker = component$<{
    value: string;
    onSelectToday$: QRL<() => void>;
    onSelectTomorrow$: QRL<() => void>;
    onSelectWeekend$: QRL<() => void>;
    onInputChange$: QRL<(val: string) => void>;
    name: string;
    todayStr: string;
    tomorrowStr: string;
    weekendStr: string;
}>(({value, onSelectToday$, onSelectTomorrow$, onSelectWeekend$, onInputChange$, name, todayStr, tomorrowStr, weekendStr}) => {
    return (
        <div class="space-y-3">
            {/* Quick select chips */}
            <div class="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick$={onSelectToday$}
                    class={`btn btn-sm ${value === todayStr ? 'btn-primary' : 'btn-outline'}`}
                >
                    Today
                </button>
                <button
                    type="button"
                    onClick$={onSelectTomorrow$}
                    class={`btn btn-sm ${value === tomorrowStr ? 'btn-primary' : 'btn-outline'}`}
                >
                    Tomorrow
                </button>
                <button
                    type="button"
                    onClick$={onSelectWeekend$}
                    class={`btn btn-sm ${value === weekendStr ? 'btn-primary' : 'btn-outline'}`}
                >
                    This Weekend
                </button>
            </div>
            {/* Calendar input */}
            <div class="relative">
                <input
                    type="date"
                    name={name}
                    value={value}
                    min={todayStr}
                    onInput$={(e) => onInputChange$((e.target as HTMLInputElement).value)}
                    class="input input-bordered w-full pl-10"
                    required
                />
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            </div>
            {value && (
                <p class="text-sm text-base-content/60">
                    Selected: <span class="font-medium">{formatDateDisplay(new Date(value + 'T00:00:00'))}</span>
                </p>
            )}
        </div>
    );
});

// Text input field component
const TextInputField = component$<{
    field: BookingFieldDefinition;
    value: string;
    onInput$: QRL<(val: string) => void>;
    error?: string;
}>(({field, value, onInput$, error}) => {
    const isValid = value && !error;
    return (
        <div class="form-control">
            <label class="label pb-1">
                <span class="label-text font-medium">
                    {field.label}
                    {field.required && <span class="text-error ml-0.5">*</span>}
                </span>
                {isValid && (
                    <svg class="size-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                )}
            </label>
            <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                class={`input input-bordered w-full ${error ? 'input-error' : isValid ? 'input-success' : ''}`}
                value={value || ''}
                onInput$={(e) => onInput$((e.target as HTMLInputElement).value)}
                minLength={field.validation?.minLength}
                maxLength={field.validation?.maxLength}
                pattern={field.validation?.pattern}
            />
            {field.helpText && <span class="text-xs text-base-content/50 mt-1">{field.helpText}</span>}
            {error && <span class="text-xs text-error mt-1">{error}</span>}
        </div>
    );
});

// Textarea field component
const TextareaField = component$<{
    field: BookingFieldDefinition;
    value: string;
    onInput$: QRL<(val: string) => void>;
    error?: string;
}>(({field, value, onInput$, error}) => {
    return (
        <div class="form-control">
            <label class="label pb-1">
                <span class="label-text font-medium">
                    {field.label}
                    {field.required && <span class="text-error ml-0.5">*</span>}
                </span>
            </label>
            <textarea
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                class={`textarea textarea-bordered w-full ${error ? 'textarea-error' : ''}`}
                value={value || ''}
                onInput$={(e) => onInput$((e.target as HTMLTextAreaElement).value)}
                rows={3}
            />
            {field.helpText && <span class="text-xs text-base-content/50 mt-1">{field.helpText}</span>}
            {error && <span class="text-xs text-error mt-1">{error}</span>}
        </div>
    );
});

// Select field component
const SelectField = component$<{
    field: BookingFieldDefinition;
    value: string;
    onInput$: QRL<(val: string) => void>;
    error?: string;
}>(({field, value, onInput$, error}) => {
    return (
        <div class="form-control">
            <label class="label pb-1">
                <span class="label-text font-medium">
                    {field.label}
                    {field.required && <span class="text-error ml-0.5">*</span>}
                </span>
            </label>
            <select
                name={field.name}
                required={field.required}
                class={`select select-bordered w-full ${error ? 'select-error' : ''}`}
                value={value || ''}
                onChange$={(e) => onInput$((e.target as HTMLSelectElement).value)}
            >
                <option value="" disabled>{field.placeholder || `Select ${field.label}`}</option>
                {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            {field.helpText && <span class="text-xs text-base-content/50 mt-1">{field.helpText}</span>}
            {error && <span class="text-xs text-error mt-1">{error}</span>}
        </div>
    );
});

// Checkbox field component
const CheckboxField = component$<{
    field: BookingFieldDefinition;
    value: boolean;
    onInput$: QRL<(val: boolean) => void>;
}>(({field, value, onInput$}) => {
    return (
        <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
                <input
                    type="checkbox"
                    name={field.name}
                    class="checkbox checkbox-primary"
                    checked={value || false}
                    onChange$={(e) => onInput$((e.target as HTMLInputElement).checked)}
                />
                <span class="label-text">{field.label}</span>
            </label>
            {field.helpText && <span class="text-xs text-base-content/50 mt-1">{field.helpText}</span>}
        </div>
    );
});

export default component$(() => {
    const activityDataResponse = useActivityData();
    const location = useLocation();
    const nav = useNavigate();
    const session = useSession();
    const t = inlineTranslate();
    const createBookingAction = useCreateBooking();
    const {selectedCurrency, currencies} = useCurrency();

    const lang = location.params.lang || 'en';
    const urlPackageId = location.url.searchParams.get('package');

    // State management
    const currentStep = useSignal(0);
    const selectedPackageId = useSignal<string | null>(urlPackageId);
    const formValues = useStore<Record<string, any>>({
        number_of_people: 1,
        payment_method: 'card',
    });

    // Handle error state
    if (!activityDataResponse.value.success || !activityDataResponse.value.data) {
        return (
            <div class="min-h-screen bg-base-100 flex items-center justify-center p-4">
                <div class="text-center max-w-md">
                    <div class="size-20 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
                        <svg class="size-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-base-content mb-2">{t('booking.error.title@@Activity Not Found')}</h1>
                    <p class="text-base-content/60 mb-6">{activityDataResponse.value.error}</p>
                    <a href={`/${lang}/activities`} class="btn btn-primary">
                        {t('booking.error.backToActivities@@Back to Activities')}
                    </a>
                </div>
            </div>
        );
    }

    const activity = activityDataResponse.value.data;
    const packages = activity.packages || [];
    const hasMultiplePackages = packages.length > 1;
    const title = activity.translations?.[lang]?.title || activity.slug;

    // Auto-select single package
    if (packages.length === 1 && !selectedPackageId.value) {
        selectedPackageId.value = packages[0].id;
    }

    const selectedPackage = packages.find(p => p.id === selectedPackageId.value);

    // Get booking configuration
    const bookingType = (activity.booking_type || 'standard') as BookingType;
    const baseConfig = BOOKING_TYPE_PRESETS[bookingType];
    const activityConfig = activity.booking_field_config as BookingFieldConfig | undefined;
    const finalConfig = mergeBookingConfigs(baseConfig, activityConfig);

    // Determine what's shown in the select step
    const needsPackageSelection = hasMultiplePackages && !urlPackageId;
    const needsDateSelection = !finalConfig.hide_fields?.includes('booking_date') &&
                               !finalConfig.hide_fields?.includes('check_in_date');
    const needsGuestSelection = !finalConfig.hide_fields?.includes('number_of_people');

    // 3 steps: Select (package + date + guests) -> Details -> Confirm
    const steps: {title: string; key: string}[] = [
        {title: t('booking.steps.select@@Select'), key: 'select'},
        {title: t('booking.steps.details@@Details'), key: 'details'},
        {title: t('booking.steps.confirm@@Confirm'), key: 'confirm'},
    ];

    const totalSteps = steps.length;

    // Initialize form values with defaults
    if (session.value?.user) {
        if (!formValues.name) formValues.name = session.value.user.name || '';
        if (!formValues.email) formValues.email = session.value.user.email || '';
    }

    // Get all form fields
    const allFields = getFieldsForConfig(finalConfig);

    // Separate contact fields from other fields
    const contactFields = allFields.filter(f =>
        ['name', 'email', 'phone', 'nationality'].includes(f.name)
    );
    const otherFields = allFields.filter(f =>
        !['name', 'email', 'phone', 'nationality', 'booking_date', 'check_in_date', 'check_out_date', 'number_of_people'].includes(f.name)
    );

    // Price calculations - computed outside to avoid function in render
    const packageConfig = selectedPackage?.options_config as any;
    const pricingTiers = packageConfig?.pricingTiers || [];
    const dbPrice = selectedPackage?.prices?.[0];
    const baseUnitPrice = pricingTiers[0]?.price ?? dbPrice?.amount ?? activity.base_price ?? 0;

    const unitPrice = useComputed$(() => baseUnitPrice);
    const totalPrice = useComputed$(() => baseUnitPrice * (formValues.number_of_people || 1));

    // Package details
    const packageTitle = selectedPackage
        ? (selectedPackage.translations?.[lang]?.name || packageConfig?.title || selectedPackage.name_internal)
        : '';

    // Navigation handlers
    const goNext = $(() => {
        if (currentStep.value < totalSteps - 1) {
            currentStep.value++;
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });

    const goBack = $(() => {
        if (currentStep.value > 0) {
            currentStep.value--;
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    });

    const canProceed = useComputed$(() => {
        const step = steps[currentStep.value];
        switch (step?.key) {
            case 'select':
                // Must have package (if needed), date (if needed), and guests >= 1
                const packageOk = !needsPackageSelection || !!selectedPackageId.value;
                const dateOk = !needsDateSelection || !!(formValues.booking_date || formValues.check_in_date);
                const guestsOk = formValues.number_of_people >= 1;
                return packageOk && dateOk && guestsOk;
            case 'details':
                return !!(formValues.name && formValues.email && formValues.phone);
            case 'confirm':
                return true;
            default:
                return true;
        }
    });

    const currentStepKey = steps[currentStep.value]?.key;

    // Calculate date strings for quick date picker
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const weekend = getNextWeekend(today);
    const todayStr = formatDateISO(today);
    const tomorrowStr = formatDateISO(tomorrow);
    const weekendStr = formatDateISO(weekend);

    return (
        <div class="min-h-screen bg-base-200/50">
            {/* Header */}
            <div class="bg-base-100 border-b border-base-200 sticky top-0 z-50">
                <div class="container mx-auto max-w-4xl px-4 py-3">
                    <div class="flex items-center gap-4">
                        <button
                            type="button"
                            onClick$={() => nav(`/${lang}/activities/${activity.slug}`)}
                            class="btn btn-ghost btn-sm btn-circle"
                        >
                            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                        <div class="flex-1 min-w-0">
                            <h1 class="text-lg font-bold text-base-content truncate">{title}</h1>
                            <p class="text-sm text-base-content/60">{steps[currentStep.value]?.title}</p>
                        </div>
                        {/* Price badge - always visible */}
                        <div class="text-right">
                            <div class="text-lg font-bold text-primary">{formatPrice(totalPrice.value, selectedCurrency.value, currencies.value)}</div>
                            <div class="text-xs text-base-content/50">Total ({selectedCurrency.value})</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step indicator */}
            <div class="container mx-auto max-w-4xl px-4 pt-6">
                <StepIndicator currentStep={currentStep.value} steps={steps} />
            </div>

            {/* Main content */}
            <div class="container mx-auto max-w-4xl px-4 pb-32">
                <Form action={createBookingAction}>
                    {/* Hidden inputs for all form values - required for form submission */}
                    <input type="hidden" name="activity_id" value={activity.id}/>
                    <input type="hidden" name="package_id" value={selectedPackageId.value || ''}/>
                    <input type="hidden" name="number_of_people" value={formValues.number_of_people}/>
                    <input type="hidden" name="payment_method" value={formValues.payment_method}/>
                    <input type="hidden" name="booking_date" value={formValues.booking_date || ''}/>
                    <input type="hidden" name="check_in_date" value={formValues.check_in_date || ''}/>
                    <input type="hidden" name="check_out_date" value={formValues.check_out_date || ''}/>
                    <input type="hidden" name="name" value={formValues.name || ''}/>
                    <input type="hidden" name="email" value={formValues.email || ''}/>
                    <input type="hidden" name="phone" value={formValues.phone || ''}/>
                    <input type="hidden" name="nationality" value={formValues.nationality || ''}/>
                    <input type="hidden" name="special_requests" value={formValues.special_requests || ''}/>
                    <input type="hidden" name="notes" value={formValues.notes || ''}/>
                    <input type="hidden" name="display_currency" value={selectedCurrency.value || 'USD'}/>

                    {/* Step: Select (Package + Date merged) */}
                    {currentStepKey === 'select' && (
                        <div class="space-y-6">
                            <div class="text-center mb-6">
                                <h2 class="text-2xl font-bold text-base-content">{t('booking.select.title@@Select Your Options')}</h2>
                                <p class="text-base-content/60 mt-1">{t('booking.select.subtitle@@Choose your package and date')}</p>
                            </div>

                            {/* Package Selection (if multiple packages) */}
                            {needsPackageSelection && (
                                <div class="space-y-4">
                                    <h3 class="font-semibold text-base-content flex items-center gap-2">
                                        <svg class="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                        </svg>
                                        {t('booking.select.package@@Package')}
                                    </h3>
                                    <div class="space-y-3">
                                        {packages.map((pkg) => (
                                            <PackageCard
                                                key={pkg.id}
                                                pkg={pkg}
                                                lang={lang}
                                                isSelected={selectedPackageId.value === pkg.id}
                                                onSelect$={$(() => { selectedPackageId.value = pkg.id; })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Date Selection */}
                            {needsDateSelection && (
                                <div class="space-y-4">
                                    <h3 class="font-semibold text-base-content flex items-center gap-2">
                                        <svg class="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                        {bookingType === 'accommodation'
                                            ? t('booking.select.dates@@Dates')
                                            : t('booking.select.date@@Date')}
                                    </h3>
                                    <div class="bg-base-100 rounded-2xl p-6 shadow-sm">
                                        {bookingType === 'accommodation' ? (
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label class="label"><span class="label-text font-medium">{t('booking.select.checkIn@@Check-in')}</span></label>
                                                    <input
                                                        type="date"
                                                        name="check_in_date"
                                                        value={formValues.check_in_date || ''}
                                                        min={todayStr}
                                                        onInput$={(e) => formValues.check_in_date = (e.target as HTMLInputElement).value}
                                                        class="input input-bordered w-full"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label class="label"><span class="label-text font-medium">{t('booking.select.checkOut@@Check-out')}</span></label>
                                                    <input
                                                        type="date"
                                                        name="check_out_date"
                                                        value={formValues.check_out_date || ''}
                                                        min={formValues.check_in_date || todayStr}
                                                        onInput$={(e) => formValues.check_out_date = (e.target as HTMLInputElement).value}
                                                        class="input input-bordered w-full"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <QuickDatePicker
                                                value={formValues.booking_date || ''}
                                                onSelectToday$={$(() => formValues.booking_date = todayStr)}
                                                onSelectTomorrow$={$(() => formValues.booking_date = tomorrowStr)}
                                                onSelectWeekend$={$(() => formValues.booking_date = weekendStr)}
                                                onInputChange$={$((val: string) => formValues.booking_date = val)}
                                                name="booking_date"
                                                todayStr={todayStr}
                                                tomorrowStr={tomorrowStr}
                                                weekendStr={weekendStr}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Guests Selection */}
                            {needsGuestSelection && (
                                <div class="space-y-4">
                                    <h3 class="font-semibold text-base-content flex items-center gap-2">
                                        <svg class="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                        </svg>
                                        {t('booking.select.guests@@Guests')}
                                    </h3>
                                    <div class="bg-base-100 rounded-2xl p-6 shadow-sm">
                                        <GuestCounter
                                            value={formValues.number_of_people}
                                            onIncrement$={$(() => {
                                                if (formValues.number_of_people < (activity.max_participants || 20)) {
                                                    formValues.number_of_people++;
                                                }
                                            })}
                                            onDecrement$={$(() => {
                                                if (formValues.number_of_people > 1) {
                                                    formValues.number_of_people--;
                                                }
                                            })}
                                            min={1}
                                            max={activity.max_participants || 20}
                                            label={bookingType === 'accommodation' ? t('booking.select.guestsLabel@@Guests') : t('booking.select.peopleLabel@@People')}
                                        />
                                        {/* Price breakdown */}
                                        <div class="mt-6 pt-4 border-t border-base-200">
                                            <div class="flex justify-between items-center text-base-content/70">
                                                <span>{formatPrice(unitPrice.value, selectedCurrency.value, currencies.value)} x {formValues.number_of_people} {formValues.number_of_people === 1 ? t('booking.select.person@@person') : t('booking.select.people@@people')}</span>
                                                <span class="font-semibold text-base-content">{formatPrice(totalPrice.value, selectedCurrency.value, currencies.value)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step: Details (Contact Info + Custom Fields) */}
                    {currentStepKey === 'details' && (
                        <div class="space-y-6">
                            <div class="text-center mb-6">
                                <h2 class="text-2xl font-bold text-base-content">{t('booking.details.title@@Your Details')}</h2>
                                <p class="text-base-content/60 mt-1">{t('booking.details.subtitle@@We\'ll use this to confirm your booking')}</p>
                            </div>

                            {/* Contact Information */}
                            <div class="bg-base-100 rounded-2xl p-6 shadow-sm">
                                <h3 class="font-semibold text-base-content mb-4 flex items-center gap-2">
                                    <svg class="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                    Contact Information
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {contactFields.map((field) => {
                                        if (field.type === 'text' || field.type === 'email' || field.type === 'tel') {
                                            return (
                                                <TextInputField
                                                    key={field.name}
                                                    field={field}
                                                    value={formValues[field.name] || ''}
                                                    onInput$={$((val: string) => formValues[field.name] = val)}
                                                />
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>

                            {/* Custom/Other Fields */}
                            {otherFields.length > 0 && (
                                <div class="bg-base-100 rounded-2xl p-6 shadow-sm">
                                    <h3 class="font-semibold text-base-content mb-4 flex items-center gap-2">
                                        <svg class="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                        Additional Information
                                    </h3>
                                    <div class="grid grid-cols-1 gap-4">
                                        {otherFields.map((field) => {
                                            if (field.type === 'textarea') {
                                                return (
                                                    <TextareaField
                                                        key={field.name}
                                                        field={field}
                                                        value={formValues[field.name] || ''}
                                                        onInput$={$((val: string) => formValues[field.name] = val)}
                                                    />
                                                );
                                            }
                                            if (field.type === 'select') {
                                                return (
                                                    <SelectField
                                                        key={field.name}
                                                        field={field}
                                                        value={formValues[field.name] || ''}
                                                        onInput$={$((val: string) => formValues[field.name] = val)}
                                                    />
                                                );
                                            }
                                            if (field.type === 'checkbox') {
                                                return (
                                                    <CheckboxField
                                                        key={field.name}
                                                        field={field}
                                                        value={formValues[field.name] || false}
                                                        onInput$={$((val: boolean) => formValues[field.name] = val)}
                                                    />
                                                );
                                            }
                                            if (field.type === 'text' || field.type === 'email' || field.type === 'tel') {
                                                return (
                                                    <TextInputField
                                                        key={field.name}
                                                        field={field}
                                                        value={formValues[field.name] || ''}
                                                        onInput$={$((val: string) => formValues[field.name] = val)}
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step: Confirm & Pay */}
                    {currentStepKey === 'confirm' && (
                        <div class="space-y-6">
                            <div class="text-center mb-6">
                                <h2 class="text-2xl font-bold text-base-content">{t('booking.confirm.title@@Review & Confirm')}</h2>
                                <p class="text-base-content/60 mt-1">{t('booking.confirm.subtitle@@Make sure everything looks right')}</p>
                            </div>

                            {/* Booking Summary Card */}
                            <div class="bg-base-100 rounded-2xl p-6 shadow-sm">
                                <h3 class="font-semibold text-base-content mb-4">{t('booking.confirm.summary@@Booking Summary')}</h3>

                                {/* Activity & Package */}
                                <div class="flex gap-4 pb-4 border-b border-base-200">
                                    {activity.images && (
                                        <div class="size-20 rounded-lg overflow-hidden flex-shrink-0 bg-base-200">
                                            <img
                                                src={Array.isArray(activity.images) ? activity.images[0] : activity.images}
                                                alt={title}
                                                class="size-full object-cover"
                                                width={80}
                                                height={80}
                                            />
                                        </div>
                                    )}
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-semibold text-base-content">{title}</h4>
                                        {packageTitle && (
                                            <p class="text-sm text-primary font-medium">{packageTitle}</p>
                                        )}
                                        <div class="flex flex-wrap gap-2 mt-2">
                                            {(formValues.booking_date || formValues.check_in_date) && (
                                                <span class="badge badge-outline badge-sm">
                                                    {formatDateDisplay(new Date((formValues.booking_date || formValues.check_in_date) + 'T00:00:00'))}
                                                </span>
                                            )}
                                            <span class="badge badge-outline badge-sm">
                                                {formValues.number_of_people} {formValues.number_of_people === 1 ? 'person' : 'people'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div class="py-4 space-y-2">
                                    <div class="flex justify-between text-sm text-base-content/70">
                                        <span>{formatPrice(unitPrice.value, selectedCurrency.value, currencies.value)} x {formValues.number_of_people}</span>
                                        <span>{formatPrice(totalPrice.value, selectedCurrency.value, currencies.value)}</span>
                                    </div>
                                    <div class="flex justify-between text-lg font-bold text-base-content pt-2 border-t border-base-200">
                                        <span>Total</span>
                                        <span class="text-primary">{formatPrice(totalPrice.value, selectedCurrency.value, currencies.value)} {selectedCurrency.value}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Summary */}
                            <div class="bg-base-100 rounded-2xl p-6 shadow-sm">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="font-semibold text-base-content">Contact Details</h3>
                                    <button
                                        type="button"
                                        onClick$={() => {
                                            const detailsStepIndex = steps.findIndex(s => s.key === 'details');
                                            if (detailsStepIndex >= 0) currentStep.value = detailsStepIndex;
                                        }}
                                        class="btn btn-ghost btn-xs"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div class="space-y-2 text-sm">
                                    <div class="flex items-center gap-2">
                                        <svg class="size-4 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                        </svg>
                                        <span>{formValues.name}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <svg class="size-4 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                        </svg>
                                        <span>{formValues.email}</span>
                                    </div>
                                    {formValues.phone && (
                                        <div class="flex items-center gap-2">
                                            <svg class="size-4 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                            </svg>
                                            <span>{formValues.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div class="bg-base-100 rounded-2xl p-6 shadow-sm">
                                <h3 class="font-semibold text-base-content mb-4">{t('booking.paymentMethod.title@@Payment Method')}</h3>
                                <div class="space-y-3">
                                    <label class="flex items-start gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5 transition-all">
                                        <input
                                            type="radio"
                                            name="payment_method_select"
                                            value="card"
                                            class="radio radio-primary mt-0.5"
                                            checked={true}
                                            onChange$={() => formValues.payment_method = 'card'}
                                        />
                                        <div class="flex-1">
                                            <span class="font-semibold text-base-content">{t('booking.paymentMethod.card@@Card')}</span>
                                            <p class="text-sm text-base-content/60 mt-0.5">{t('booking.paymentMethod.cardDescription@@Pay securely with your credit or debit card')}</p>
                                        </div>
                                        <svg class="size-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                                        </svg>
                                    </label>
                                </div>
                            </div>

                            {/* Trust Indicators */}
                            <div class="bg-success/10 rounded-2xl p-4">
                                <div class="flex items-start gap-3">
                                    <svg class="size-6 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                    </svg>
                                    <div>
                                        <p class="font-semibold text-success">Free Cancellation</p>
                                        <p class="text-sm text-base-content/70 mt-0.5">
                                            Cancel up to 24 hours before for a full refund
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Error Display */}
                            {createBookingAction.value?.error && (
                                <div role="alert" class="alert alert-error">
                                    <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                    </svg>
                                    <span>{createBookingAction.value.error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fixed Bottom Navigation - inside Form for proper submission */}
                    <div class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 p-4 shadow-lg z-50">
                        <div class="container mx-auto max-w-4xl">
                            <div class="flex items-center gap-4">
                                {/* Back button */}
                                {currentStep.value > 0 && (
                                    <button
                                        type="button"
                                        onClick$={goBack}
                                        class="btn btn-ghost"
                                    >
                                        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                        </svg>
                                        Back
                                    </button>
                                )}

                                <div class="flex-1"/>

                                {/* Price summary on mobile */}
                                <div class="text-right mr-2 lg:hidden">
                                    <div class="text-xs text-base-content/60">Total</div>
                                    <div class="font-bold text-primary">{formatPrice(totalPrice.value, selectedCurrency.value, currencies.value)}</div>
                                </div>

                                {/* Next/Submit button */}
                                {currentStepKey !== 'confirm' ? (
                                    <button
                                        type="button"
                                        onClick$={goNext}
                                        disabled={!canProceed.value}
                                        class="btn btn-primary min-w-[120px]"
                                    >
                                        Continue
                                        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={createBookingAction.isRunning}
                                        class="btn btn-primary min-w-[160px]"
                                    >
                                        {createBookingAction.isRunning ? (
                                            <>
                                                <span class="loading loading-spinner loading-sm"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                Confirm Booking
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
});
