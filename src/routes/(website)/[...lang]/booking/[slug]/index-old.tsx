import {component$, useSignal} from '@builder.io/qwik';
import {Form, routeAction$, routeLoader$, useLocation, useNavigate, z, zod$} from '@builder.io/qwik-city';
import {getActivityBySlug} from '~/services/activity-api';
import {createBooking} from '~/services/booking-api';
import {inlineTranslate} from 'qwik-speak';
import {useSession} from '~/routes/plugin@auth';

export const useActivityData = routeLoader$(async (requestEvent) => {
    const slug = requestEvent.params.slug;
    const lang = requestEvent.params.lang || 'en';

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
    const session = requestEvent.sharedMap.get('session');

    if (!session || !session.user) {
        return {
            success: false,
            error: 'You must be logged in to book an activity'
        };
    }

    try {
        // Get JWT token from session
        const token = session.user.accessToken || '';

        const booking = await createBooking({
            activity_id: data.activity_id as string,
            package_id: data.package_id as string || undefined,
            booking_date: data.booking_date as string,
            number_of_people: parseInt(data.number_of_people as string),
            customer_info: {
                full_name: data.full_name as string,
                email: data.email as string,
                phone: data.phone as string,
                nationality: data.nationality as string || undefined,
                special_requests: data.special_requests as string || undefined,
            },
            payment_method: data.payment_method as string,
            notes: data.notes as string || undefined,
        }, token);

        return {
            success: true,
            data: booking
        };
    } catch (error) {
        console.error('Failed to create booking:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create booking'
        };
    }
}, zod$({
    activity_id: z.string(),
    package_id: z.string().optional(),
    booking_date: z.string(),
    number_of_people: z.string(),
    full_name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(5),
    nationality: z.string().optional(),
    payment_method: z.string(),
    special_requests: z.string().optional(),
    notes: z.string().optional(),
}));

export default component$(() => {
    const activityDataResponse = useActivityData();
    const location = useLocation();
    const nav = useNavigate();
    const session = useSession();
    const t = inlineTranslate();
    const createBookingAction = useCreateBooking();

    const lang = location.params.lang || 'en';
    const packageId = location.url.searchParams.get('package');

    const selectedDate = useSignal<string>('');
    const numberOfPeople = useSignal<number>(1);

    // Redirect to login if not authenticated
    if (!session.value) {
        if (typeof window !== 'undefined') {
            window.location.href = `/${lang}/auth/signin?callbackUrl=${encodeURIComponent(location.url.pathname)}`;
        }
        return <div>Redirecting to login...</div>;
    }

    // Handle error state
    if (!activityDataResponse.value.success || !activityDataResponse.value.data) {
        return (
            <div class="min-h-screen bg-gray-50">
                <div class="container mx-auto px-4 py-12">
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

    // Get price information
    const getPrice = () => {
        if (selectedPackage) {
            const price = selectedPackage.prices?.find(p => p.currency_code === 'USD');
            return price ? price.amount * numberOfPeople.value : 0;
        }
        return activity.base_price * numberOfPeople.value;
    };

    // Calculate minimum date (tomorrow)
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // Handle form submission success
    if (createBookingAction.value?.success) {
        const booking = createBookingAction.value.data;
        if (typeof window !== 'undefined') {
            window.location.href = `/${lang}/bookings/${booking?.id}/confirmation`;
        }
    }

    return (
        <div class="min-h-screen bg-gray-50">
            {/* Header */}
            <div class="bg-white border-b border-gray-200">
                <div class="container mx-auto px-4 py-4">
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

            <div class="container mx-auto px-4 py-8">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div class="lg:col-span-2">
                        <Form action={createBookingAction} class="bg-white rounded-lg shadow-md p-6">
                            <input type="hidden" name="activity_id" value={activity.id}/>
                            {packageId && <input type="hidden" name="package_id" value={packageId}/>}

                            {/* Step 1: Booking Details */}
                            <div class="space-y-6">
                                <h2 class="text-xl font-bold text-gray-800 mb-4">
                                    {t('booking.details.title@@Booking Details')}
                                </h2>

                                {/* Date Selection */}
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text font-semibold">{t('booking.date@@Select Date')}</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="booking_date"
                                        min={getMinDate()}
                                        value={selectedDate.value}
                                        onInput$={(e) => selectedDate.value = (e.target as HTMLInputElement).value}
                                        class="input input-bordered"
                                        required
                                    />
                                </div>

                                {/* Number of People */}
                                <div class="form-control">
                                    <label class="label">
                                        <span
                                            class="label-text font-semibold">{t('booking.people@@Number of People')}</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="number_of_people"
                                        min="1"
                                        max={selectedPackage?.options_config?.max_pax || activity.max_participants || 10}
                                        value={numberOfPeople.value}
                                        onInput$={(e) => numberOfPeople.value = parseInt((e.target as HTMLInputElement).value) || 1}
                                        class="input input-bordered"
                                        required
                                    />
                                </div>

                                <div class="divider"></div>

                                {/* Guest Information */}
                                <h2 class="text-xl font-bold text-gray-800 mb-4">
                                    {t('booking.guestInfo.title@@Guest Information')}
                                </h2>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{t('booking.fullName@@Full Name')}</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={session.value.user?.name || ''}
                                            class="input input-bordered"
                                            required
                                        />
                                    </div>

                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{t('booking.email@@Email')}</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={session.value.user?.email || ''}
                                            class="input input-bordered"
                                            required
                                        />
                                    </div>

                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">{t('booking.phone@@Phone Number')}</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            class="input input-bordered"
                                            placeholder="+1234567890"
                                            required
                                        />
                                    </div>

                                    <div class="form-control">
                                        <label class="label">
                                            <span
                                                class="label-text">{t('booking.nationality@@Nationality (Optional)')}</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nationality"
                                            class="input input-bordered"
                                        />
                                    </div>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span
                                            class="label-text">{t('booking.specialRequests@@Special Requests (Optional)')}</span>
                                    </label>
                                    <textarea
                                        name="special_requests"
                                        class="textarea textarea-bordered h-24"
                                        placeholder={t('booking.specialRequestsPlaceholder@@Any dietary restrictions, accessibility needs, etc.')}
                                    ></textarea>
                                </div>

                                <div class="divider"></div>

                                {/* Payment Method */}
                                <h2 class="text-xl font-bold text-gray-800 mb-4">
                                    {t('booking.payment.title@@Payment Method')}
                                </h2>

                                <div class="form-control">
                                    <label class="label cursor-pointer justify-start gap-4">
                                        <input type="radio" name="payment_method" value="pay_on_arrival" class="radio"
                                               checked/>
                                        <div>
                                            <span
                                                class="label-text font-semibold">{t('booking.payOnArrival@@Pay on Arrival')}</span>
                                            <p class="text-sm text-gray-500">{t('booking.payOnArrivalDesc@@Pay when you arrive at the activity location')}</p>
                                        </div>
                                    </label>
                                </div>

                                <div class="form-control">
                                    <label class="label cursor-pointer justify-start gap-4">
                                        <input type="radio" name="payment_method" value="bank_transfer" class="radio"/>
                                        <div>
                                            <span
                                                class="label-text font-semibold">{t('booking.bankTransfer@@Bank Transfer')}</span>
                                            <p class="text-sm text-gray-500">{t('booking.bankTransferDesc@@We will send you bank details via email')}</p>
                                        </div>
                                    </label>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span
                                            class="label-text">{t('booking.notes@@Additional Notes (Optional)')}</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        class="textarea textarea-bordered h-20"
                                    ></textarea>
                                </div>

                                {/* Error Display */}
                                {createBookingAction.value?.error && (
                                    <div class="alert alert-error">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6"
                                             fill="none" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        <span>{createBookingAction.value.error}</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div class="flex justify-end">
                                    <button
                                        type="submit"
                                        class="btn btn-primary btn-lg"
                                        disabled={!selectedDate.value || createBookingAction.isRunning}
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
                            <h3 class="text-lg font-bold text-gray-800 mb-4">{t('booking.summary@@Booking Summary')}</h3>

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

                                {/* Booking Details */}
                                {selectedDate.value && (
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-600">{t('booking.summary.date@@Date')}</span>
                                        <span
                                            class="font-semibold">{new Date(selectedDate.value).toLocaleDateString()}</span>
                                    </div>
                                )}

                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600">{t('booking.summary.people@@People')}</span>
                                    <span class="font-semibold">{numberOfPeople.value}</span>
                                </div>

                                <div class="divider my-2"></div>

                                {/* Price Breakdown */}
                                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">
                    ${(getPrice() / numberOfPeople.value).toFixed(2)} × {numberOfPeople.value}
                  </span>
                                    <span class="font-semibold">${getPrice().toFixed(2)}</span>
                                </div>

                                <div class="divider my-2"></div>

                                {/* Total */}
                                <div class="flex justify-between items-center">
                                    <span class="text-lg font-bold">{t('booking.summary.total@@Total')}</span>
                                    <span class="text-2xl font-bold text-secondary">${getPrice().toFixed(2)}</span>
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
                                            <p class="font-semibold">{t('booking.cancellationPolicy@@Free Cancellation')}</p>
                                            <p class="text-xs mt-1">{t('booking.cancellationPolicyDesc@@Cancel up to 24 hours before for a full refund')}</p>
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
