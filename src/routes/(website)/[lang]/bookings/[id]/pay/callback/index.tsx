import { component$, useVisibleTask$, useSignal } from '@builder.io/qwik';
import { routeLoader$, Link, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import { inlineTranslate } from 'qwik-speak';
import { authenticatedRequest, apiClient } from '~/utils/api-client';

export const usePaymentStatus = routeLoader$(async (requestEvent) => {
    const bookingId = requestEvent.params.id;

    // Get params from BML redirect: transactionId, state, signature
    const transactionId = requestEvent.url.searchParams.get('transactionId');
    const state = requestEvent.url.searchParams.get('state');
    const signature = requestEvent.url.searchParams.get('signature');

    if (!transactionId) {
        return {
            success: false,
            payment: null,
            booking: null,
            state: null,
            error: 'Missing transaction reference',
        };
    }

    // Check payment status with backend (passes transactionId for verification)
    const statusResponse = await authenticatedRequest(requestEvent, (token) =>
        apiClient.bmlPayments.getStatus(transactionId, token)
    );

    // Also get booking for display
    const bookingResponse = await authenticatedRequest(requestEvent, (token) =>
        apiClient.bookings.getById(bookingId, token)
    );

    return {
        success: statusResponse.success,
        payment: statusResponse.data,
        booking: bookingResponse.data,
        transactionId,
        state,
        signature,
        error: statusResponse.error_message,
    };
});

export default component$(() => {
    const paymentStatus = usePaymentStatus();
    const location = useLocation();
    const t = inlineTranslate();
    const lang = location.params.lang || 'en';
    const bookingId = location.params.id;

    const countdown = useSignal(5);

    const payment = paymentStatus.value.payment;
    const bmlState = paymentStatus.value.state;

    // Check both API status and BML state param
    const isSuccess = payment?.status === 'completed' || bmlState === 'CONFIRMED';
    const isFailed = payment?.status === 'failed' || payment?.status === 'cancelled' || bmlState === 'DECLINED' || bmlState === 'CANCELLED';
    const isProcessing = !isSuccess && !isFailed;

    // Auto-redirect on success
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
        if (isSuccess) {
            const timer = setInterval(() => {
                countdown.value -= 1;
                if (countdown.value <= 0) {
                    window.location.href = `/${lang}/bookings/${bookingId}/confirmation`;
                }
            }, 1000);

            cleanup(() => clearInterval(timer));
        }
    });

    // Error state - missing payment reference
    if (!paymentStatus.value.success && paymentStatus.value.error) {
        return (
            <div class="min-h-screen bg-gray-50 flex items-center justify-center">
                <div class="text-center max-w-md mx-auto px-4">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                        <svg class="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fill-rule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">
                        {t('callback.errorTitle@@Payment Error')}
                    </h1>
                    <p class="text-gray-600 mb-6">{paymentStatus.value.error}</p>
                    <Link href={`/${lang}/bookings/${bookingId}/confirmation`} class="btn btn-primary">
                        {t('callback.backToBooking@@Back to Booking')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
            <div class="text-center max-w-md mx-auto px-4">
                {/* Success State */}
                {isSuccess && (
                    <>
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                            <svg class="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            {t('callback.successTitle@@Payment Successful!')}
                        </h1>
                        <p class="text-gray-600 mb-4">
                            {t('callback.successMessage@@Your payment has been processed successfully.')}
                        </p>

                        {/* Transaction Details */}
                        <div class="bg-white rounded-lg shadow-sm p-4 mb-6 text-left">
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">
                                        {t('callback.transactionRef@@Transaction Ref')}
                                    </span>
                                    <span class="font-mono font-semibold">
                                        {payment?.transaction_reference || paymentStatus.value.transactionId}
                                    </span>
                                </div>
                                {payment?.amount && (
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">{t('callback.amount@@Amount')}</span>
                                        <span class="font-semibold text-green-600">
                                            {payment.currency === 'USD' ? '$' : payment.currency}
                                            {payment.amount.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {payment?.paid_at && (
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">{t('callback.paidAt@@Paid At')}</span>
                                        <span>{new Date(payment.paid_at).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p class="text-sm text-gray-500 mb-4">
                            {t('callback.redirecting@@Redirecting to confirmation page in')}{' '}
                            <span class="font-bold">{countdown.value}</span>{' '}
                            {t('callback.seconds@@seconds...')}
                        </p>

                        <Link href={`/${lang}/bookings/${bookingId}/confirmation`} class="btn btn-primary">
                            {t('callback.viewBooking@@View Booking')}
                        </Link>
                    </>
                )}

                {/* Failed State */}
                {isFailed && (
                    <>
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                            <svg class="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            {t('callback.failedTitle@@Payment Failed')}
                        </h1>
                        <p class="text-gray-600 mb-4">
                            {payment?.error_message ||
                                t(
                                    'callback.failedMessage@@Your payment could not be processed. Please try again.'
                                )}
                        </p>

                        {payment?.transaction_reference && (
                            <div class="bg-gray-100 rounded-lg p-3 mb-6 text-sm">
                                <span class="text-gray-600">
                                    {t('callback.reference@@Reference')}:{' '}
                                </span>
                                <span class="font-mono">{payment.transaction_reference}</span>
                            </div>
                        )}

                        <div class="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href={`/${lang}/bookings/${bookingId}/pay`} class="btn btn-primary">
                                {t('callback.tryAgain@@Try Again')}
                            </Link>
                            <Link
                                href={`/${lang}/bookings/${bookingId}/confirmation`}
                                class="btn btn-outline"
                            >
                                {t('callback.backToBooking@@Back to Booking')}
                            </Link>
                        </div>
                    </>
                )}

                {/* Processing State */}
                {isProcessing && (
                    <>
                        <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                            <span class="loading loading-spinner loading-lg text-blue-600"></span>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">
                            {t('callback.processingTitle@@Verifying Payment')}
                        </h1>
                        <p class="text-gray-600 mb-6">
                            {t(
                                'callback.processingMessage@@Please wait while we verify your payment with the bank...'
                            )}
                        </p>

                        {payment?.transaction_reference && (
                            <div class="bg-gray-100 rounded-lg p-3 mb-6 text-sm">
                                <span class="text-gray-600">
                                    {t('callback.reference@@Reference')}:{' '}
                                </span>
                                <span class="font-mono">{payment.transaction_reference}</span>
                            </div>
                        )}

                        <p class="text-sm text-gray-500">
                            {t(
                                'callback.processingNote@@This usually takes a few seconds. Do not close this page.'
                            )}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Payment Status | Rihigo',
    meta: [
        {
            name: 'description',
            content: 'Payment verification status',
        },
        {
            name: 'robots',
            content: 'noindex, nofollow',
        },
    ],
};
