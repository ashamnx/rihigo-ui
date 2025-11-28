import {component$, useStore} from '@builder.io/qwik';
import {Form, routeAction$, routeLoader$, useLocation, useNavigate, type DocumentHead} from '@builder.io/qwik-city';
import {getActivityBySlug} from '~/services/activity-api';
import {inlineTranslate} from 'qwik-speak';
import {useSession} from '~/routes/plugin@auth';
import {DynamicFormField} from '~/components/booking/DynamicFormField';
import {
    BOOKING_TYPE_PRESETS,
    getFieldsForConfig,
    mergeBookingConfigs,
    type BookingFieldConfig,
    type BookingType,
} from '~/types/booking-fields';
import {authenticatedRequest, apiClient} from '~/utils/api-client';

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
    // Extract all form data including custom fields
    const customFields: Record<string, any> = {};
    const standardFieldNames = new Set([
        'activity_id', 'package_id', 'booking_date', 'check_in_date', 'check_out_date',
        'number_of_people', 'full_name', 'email', 'phone', 'nationality',
        'special_requests', 'notes', 'payment_method'
    ]);

    // Collect custom fields
    Object.entries(data).forEach(([key, value]) => {
        if (!standardFieldNames.has(key)) {
            customFields[key] = value;
        }
    });

    // For digital products, use tomorrow's date if booking_date is not provided
    let bookingDate = data.booking_date as string || data.check_in_date as string;
    if (!bookingDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        bookingDate = tomorrow.toISOString();
    }

    const bookingData = {
        activity_id: data.activity_id as string,
        package_id: data.package_id as string || undefined,
        booking_date: bookingDate,
        number_of_people: data.number_of_people ? parseInt(data.number_of_people as string) : 1,
        customer_info: {
            full_name: data.full_name as string,
            email: data.email as string,
            phone: data.phone as string,
            nationality: data.nationality as string || undefined,
            special_requests: data.special_requests as string || undefined,
            ...customFields,
        },
        payment_method: data.payment_method as string,
        notes: data.notes as string || undefined,
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

    return {
        success: true,
        data: response.data
    };
});

export default component$(() => {
    const activityDataResponse = useActivityData();
    const location = useLocation();
    const nav = useNavigate();
    const session = useSession();
    const t = inlineTranslate();
    const createBookingAction = useCreateBooking();

    const lang = location.params.lang || 'en';
    const packageId = location.url.searchParams.get('package');

    // Form values store for conditional field logic
    const formValues = useStore<Record<string, any>>({});

    // Handle error state
    if (!activityDataResponse.value.success || !activityDataResponse.value.data) {
        return (
            <div class="min-h-screen bg-gray-50">
                <div class="container mx-auto py-3 max-w-7xl px-6 lg:px-8">
                    <div class="text-center">
                        <h1 class="text-2xl font-bold text-gray-800 mb-4">{t('booking.error.title@@Activity Not Found')}</h1>
                        <p class="text-gray-600 mb-6">{activityDataResponse.value.error}</p>
                        <a href={`/${lang}/activities`} class="btn btn-primary">
                            {t('booking.error.backToActivities@@Back to Activities')}
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const activity = activityDataResponse.value.data;
    const selectedPackage = activity.packages?.find(p => p.id === packageId);
    const title = activity.translations?.[lang]?.title || activity.slug;

    // Debug price data
    console.log('Activity base_price:', activity.base_price);
    console.log('Activity packages:', activity.packages);
    console.log('Selected package:', selectedPackage);
    console.log('Package ID from URL:', packageId);

    // Get booking configuration
    const bookingType = (activity.booking_type || 'standard') as BookingType;
    const baseConfig = BOOKING_TYPE_PRESETS[bookingType];
    const activityConfig = activity.booking_field_config as BookingFieldConfig | undefined;
    const finalConfig = mergeBookingConfigs(baseConfig, activityConfig);

    // Debug logging
    console.log('Booking Type:', bookingType);
    console.log('Base Config:', baseConfig);
    console.log('Activity Config:', activityConfig);
    console.log('Final Config:', finalConfig);

    // Get all fields to display
    const allFields = getFieldsForConfig(finalConfig);
    console.log('All Fields:', allFields.map(f => f.name));

    // Initialize form values with defaults
    if (session.value?.user) {
        formValues.full_name = formValues.full_name || session.value.user.name || '';
        formValues.email = formValues.email || session.value.user.email || '';
    }

    // Get price information
    const getPrice = () => {
        const numPeople = formValues.number_of_people || 1;
        if (selectedPackage) {
            const price = selectedPackage.prices?.find(p => p.currency_code === 'USD');
            return price ? price.amount * numPeople : 0;
        }
        return (activity.base_price || 0) * numPeople;
    };

    // Handle form submission success
    if (createBookingAction.value?.success) {
        const booking = createBookingAction.value.data;
        if (typeof window !== 'undefined') {
            window.location.href = `/${lang}/bookings/${booking?.id}/confirmation`;
        }
    }

    // Group fields if configured
    const fieldGroups = finalConfig.field_groups || [{
        title: 'Booking Information',
        fields: allFields.map(f => f.name)
    }];

    return (
        <div class="min-h-screen bg-gray-50">
            {/* Header */}
            <div class="bg-white border-b border-gray-200">
                <div class="container mx-auto py-3 max-w-7xl px-6 lg:px-8">
                    <div class="flex items-center justify-between">
                        <h1 class="text-2xl font-bold text-gray-800">{t('booking.title@@Complete Your Booking')}</h1>
                        <button
                            onClick$={() => nav(`/${lang}/activities/${activity.slug}`)}
                            class="btn btn-ghost btn-sm"
                        >
                            {t('booking.cancel@@Cancel')}
                        </button>
                    </div>
                </div>
            </div>

            <div class="container mx-auto py-3 max-w-7xl px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div class="lg:col-span-2">
                        <Form action={createBookingAction} class="bg-white rounded-lg shadow-md p-6">
                            <input type="hidden" name="activity_id" value={activity.id}/>
                            {packageId && <input type="hidden" name="package_id" value={packageId}/>}

                            {/* Dynamic Fields Grouped */}
                            <div class="space-y-8">
                                {fieldGroups.map((group, groupIdx) => {
                                    const groupFields = allFields.filter(f => group.fields.includes(f.name));

                                    if (groupFields.length === 0) return null;

                                    return (
                                        <div key={groupIdx}>
                                            <h2 class="text-xl font-bold text-gray-800 mb-4">
                                                {group.title}
                                            </h2>
                                            {group.description && (
                                                <p class="text-sm text-gray-600 mb-4">{group.description}</p>
                                            )}

                                            {/* Grid layout for fields */}
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {groupFields.map((field) => (
                                                    <DynamicFormField
                                                        key={field.name}
                                                        field={field}
                                                        formValues={formValues}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Payment Method - Always show */}
                                {!finalConfig.hide_fields?.includes('payment_method') && (
                                    <>
                                        <div class="divider"></div>

                                        <div>
                                            <h2 class="text-xl font-bold text-gray-800 mb-4">
                                                {t('booking.payment.title@@Payment Method')}
                                            </h2>

                                            <div class="space-y-3">
                                                <div class="form-control">
                                                    <label class="label cursor-pointer justify-start gap-4">
                                                        <input type="radio" name="payment_method" value="pay_on_arrival"
                                                               class="radio" checked/>
                                                        <div>
                                                            <span class="label-text font-semibold">
                                                                {t('booking.payOnArrival@@Pay on Arrival')}
                                                            </span>
                                                            <p class="text-sm text-gray-500">
                                                                {t('booking.payOnArrivalDesc@@Pay when you arrive at the activity location')}
                                                            </p>
                                                        </div>
                                                    </label>
                                                </div>

                                                <div class="form-control">
                                                    <label class="label cursor-pointer justify-start gap-4">
                                                        <input type="radio" name="payment_method" value="bank_transfer"
                                                               class="radio"/>
                                                        <div>
                                                            <span class="label-text font-semibold">
                                                                {t('booking.bankTransfer@@Bank Transfer')}
                                                            </span>
                                                            <p class="text-sm text-gray-500">
                                                                {t('booking.bankTransferDesc@@We will send you bank details via email')}
                                                            </p>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Error Display */}
                                {createBookingAction.value?.error && (
                                    <div role="alert" class="alert alert-error shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6"
                                             fill="none" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        <div>
                                            <h3 class="font-bold">{t('booking.error.title@@Booking Error')}</h3>
                                            <div class="text-sm">{createBookingAction.value.error}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div class="flex justify-end">
                                    <button
                                        type="submit"
                                        class="btn btn-primary btn-lg"
                                        disabled={createBookingAction.isRunning}
                                    >
                                        {createBookingAction.isRunning ? (
                                            <>
                                                <span class="loading loading-spinner"></span>
                                                {t('booking.processing@@Processing...')}
                                            </>
                                        ) : (
                                            t('booking.confirmBooking@@Confirm Booking')
                                        )}
                                    </button>
                                </div>
                            </div>
                        </Form>
                    </div>

                    {/* Booking Summary Sidebar */}
                    <div class="lg:col-span-1">
                        <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h3 class="text-lg font-bold text-gray-800 mb-4">
                                {t('booking.summary@@Booking Summary')}
                            </h3>

                            {/* Activity Info */}
                            <div class="space-y-4">
                                <div>
                                    <h4 class="font-semibold text-gray-900">{title}</h4>
                                    {selectedPackage && (
                                        <p class="text-sm text-gray-600">
                                            {selectedPackage.translations?.[lang]?.name || selectedPackage.name_internal}
                                        </p>
                                    )}
                                </div>

                                <div class="divider my-2"></div>

                                {/* Booking Type Badge */}
                                <div class="flex items-center gap-2">
                                    <span class="badge badge-outline capitalize">{bookingType.replace('_', ' ')}</span>
                                </div>

                                {/* Dynamic Summary Fields */}
                                {formValues.booking_date && (
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-600">{t('booking.summary.date@@Date')}</span>
                                        <span class="font-semibold">
                                            {new Date(formValues.booking_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}

                                {formValues.check_in_date && formValues.check_out_date && (
                                    <>
                                        <div class="flex justify-between text-sm">
                                            <span class="text-gray-600">Check-in</span>
                                            <span class="font-semibold">
                                                {new Date(formValues.check_in_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div class="flex justify-between text-sm">
                                            <span class="text-gray-600">Check-out</span>
                                            <span class="font-semibold">
                                                {new Date(formValues.check_out_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </>
                                )}

                                {formValues.number_of_people && (
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-600">
                                            {bookingType === 'accommodation' ? 'Guests' : 'People'}
                                        </span>
                                        <span class="font-semibold">{formValues.number_of_people}</span>
                                    </div>
                                )}

                                <div class="divider my-2"></div>

                                {/* Price */}
                                {formValues.number_of_people && (
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-600">
                                            ${(getPrice() / formValues.number_of_people).toFixed(2)} × {formValues.number_of_people}
                                        </span>
                                        <span class="font-semibold">${getPrice().toFixed(2)}</span>
                                    </div>
                                )}

                                <div class="divider my-2"></div>

                                {/* Total */}
                                <div class="flex justify-between items-center">
                                    <span class="text-lg font-bold">{t('booking.summary.total@@Total')}</span>
                                    <span class="text-2xl font-bold text-primary">${getPrice().toFixed(2)}</span>
                                </div>

                                {/* Cancellation Policy */}
                                <div class="mt-6 p-3 bg-blue-50 rounded-lg">
                                    <div class="flex items-start gap-2 text-sm text-blue-800">
                                        <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor"
                                             viewBox="0 0 20 20">
                                            <path fill-rule="evenodd"
                                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                  clip-rule="evenodd"/>
                                        </svg>
                                        <div>
                                            <p class="font-semibold">
                                                {t('booking.cancellationPolicy@@Free Cancellation')}
                                            </p>
                                            <p class="text-xs mt-1">
                                                {t('booking.cancellationPolicyDesc@@Cancel up to 24 hours before for a full refund')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
