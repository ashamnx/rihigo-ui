import { component$, useSignal } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  Form,
  Link,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { authenticatedRequest, apiClient } from '~/utils/api-client';

export const useBookingDetails = routeLoader$(async (requestEvent) => {
    const bookingId = requestEvent.params.id;

    const response = await authenticatedRequest(requestEvent, (token) =>
        apiClient.admin.bookings.getById(bookingId, token)
    );

    if (!response.success || !response.data) {
        return { success: false, error: response.error_message || 'Failed to load booking details' };
    }

    return { success: true, booking: response.data };
});

export const useConfirmVendorStatus = routeAction$(async (data, requestEvent) => {
    const bookingId = data.booking_id as string;
    const action = data.action as 'confirm' | 'reject';
    const notes = data.notes as string | undefined;

    return authenticatedRequest(requestEvent, (token) =>
        apiClient.admin.bookings.confirmVendorStatus(bookingId, { action, notes }, token)
    );
});

export const useProcessRefund = routeAction$(async (data, requestEvent) => {
    const paymentId = data.payment_id as string;
    const amount = parseFloat(data.amount as string);
    const reason = data.reason as string | undefined;
    const notes = data.notes as string | undefined;

    if (!paymentId || isNaN(amount) || amount <= 0) {
        return {
            success: false,
            error_message: 'Invalid refund amount',
        };
    }

    return authenticatedRequest(requestEvent, (token) =>
        apiClient.admin.payments.refund(
            paymentId,
            { amount, reason, notes },
            token
        )
    );
});

export default component$(() => {
    const bookingData = useBookingDetails();
    const confirmAction = useConfirmVendorStatus();
    const refundAction = useProcessRefund();
    const showRefundModal = useSignal(false);
    const showRejectModal = useSignal(false);

    if (!bookingData.value.success || !bookingData.value.booking) {
        return (
            <div class="p-6">
                <div class="alert alert-error">
                    {bookingData.value.error || 'Booking not found'}
                </div>
                <Link href="/admin/bookings" class="btn btn-primary mt-4">Back to Bookings</Link>
            </div>
        );
    }

    const booking = bookingData.value.booking;
    const canRefund = booking.payment_status === 'paid' && booking.payment_id;
    const vendorStatus = booking.vendor_confirmation_status || 'pending';
    const canConfirm = vendorStatus === 'pending';

    return (
        <div class="p-6">
            {/* Success/Error Alerts */}
            {confirmAction.value?.success && (
                <div class="alert alert-success mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Vendor confirmation status updated successfully</span>
                </div>
            )}

            {confirmAction.value?.success === false && (
                <div class="alert alert-error mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{confirmAction.value.error_message || 'Failed to update vendor status'}</span>
                </div>
            )}

            {refundAction.value?.success && (
                <div class="alert alert-success mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Refund processed successfully</span>
                </div>
            )}

            {refundAction.value?.success === false && (
                <div class="alert alert-error mb-4">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{refundAction.value.error_message || 'Failed to process refund'}</span>
                </div>
            )}

            <div class="flex items-center gap-4 mb-6">
                <Link href="/admin/bookings" class="btn btn-ghost btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </Link>
                <h1 class="text-2xl font-bold">Booking Details</h1>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div class="lg:col-span-2 space-y-6">
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title mb-4">Booking Information</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div class="text-sm opacity-70">Booking ID</div>
                                    <div class="font-mono">{booking.id}</div>
                                </div>
                                <div>
                                    <div class="text-sm opacity-70">Status</div>
                                    <div class={`badge ${booking.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                                        {booking.status}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-sm opacity-70">Date</div>
                                    <div>{new Date(booking.booking_date).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div class="text-sm opacity-70">Guests</div>
                                    <div>{booking.number_of_people} People</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title mb-4">Activity Details</h2>
                            <div>
                                <div class="font-bold text-lg">{booking.activity?.title}</div>
                                {booking.package && <div class="text-sm opacity-70">{booking.package.name}</div>}
                            </div>
                        </div>
                    </div>

                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title mb-4">Guest Information</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div class="text-sm opacity-70">Name</div>
                                    <div>{booking.customer_info.name}</div>
                                </div>
                                <div>
                                    <div class="text-sm opacity-70">Email</div>
                                    <div>{booking.customer_info.email}</div>
                                </div>
                                <div>
                                    <div class="text-sm opacity-70">Phone</div>
                                    <div>{booking.customer_info.phone}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vendor Confirmation Card */}
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title mb-4">Vendor Confirmation</h2>
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-sm opacity-70 mb-1">Vendor Status</div>
                                    <div class={`badge ${
                                        vendorStatus === 'confirmed' ? 'badge-success' :
                                        vendorStatus === 'rejected' ? 'badge-error' :
                                        'badge-warning'
                                    } badge-lg`}>
                                        {vendorStatus.toUpperCase()}
                                    </div>
                                </div>

                                {canConfirm && (
                                    <div class="flex gap-2">
                                        <Form action={confirmAction}>
                                            <input type="hidden" name="booking_id" value={booking.id} />
                                            <input type="hidden" name="action" value="confirm" />
                                            <button
                                                type="submit"
                                                class="btn btn-success btn-sm"
                                                disabled={confirmAction.isRunning}
                                            >
                                                {confirmAction.isRunning ? (
                                                    <span class="loading loading-spinner loading-sm"></span>
                                                ) : (
                                                    <>
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Confirm
                                                    </>
                                                )}
                                            </button>
                                        </Form>
                                        <button
                                            type="button"
                                            class="btn btn-error btn-sm"
                                            onClick$={() => (showRejectModal.value = true)}
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            {booking.vendor_notes && (
                                <div class="mt-4 p-3 bg-gray-50 rounded">
                                    <div class="text-sm opacity-70 mb-1">Vendor Notes</div>
                                    <p class="text-sm">{booking.vendor_notes}</p>
                                </div>
                            )}

                            {vendorStatus === 'confirmed' && booking.payment_status === 'pending' && (
                                <div class="alert alert-info mt-4">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Booking confirmed. Awaiting customer payment.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar / Payment Info */}
                <div class="space-y-6">
                    <div class="card bg-base-100 shadow">
                        <div class="card-body">
                            <h2 class="card-title mb-4">Payment Summary</h2>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>${booking.subtotal.toFixed(2)}</span>
                                </div>

                                {booking.taxes && booking.taxes.length > 0 && (
                                    <div class="divider my-1"></div>
                                )}

                                {booking.taxes?.map((tax: { id: string; name: string; rate: number; amount: number }) => (
                                    <div key={tax.id} class="flex justify-between text-sm opacity-70">
                                        <span>{tax.name} ({tax.rate}%)</span>
                                        <span>${tax.amount.toFixed(2)}</span>
                                    </div>
                                ))}

                                <div class="divider my-1"></div>

                                <div class="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>${booking.total_price.toFixed(2)}</span>
                                </div>
                            </div>

                            <div class="mt-6">
                                <div class="text-sm opacity-70 mb-1">Payment Status</div>
                                <div class={`badge ${booking.payment_status === 'paid' ? 'badge-success' : booking.payment_status === 'refunded' ? 'badge-info' : 'badge-warning'} w-full py-3`}>
                                    {booking.payment_status.toUpperCase()}
                                </div>
                            </div>

                            {booking.payment_id && (
                                <div class="mt-4">
                                    <div class="text-sm opacity-70 mb-1">Payment ID</div>
                                    <div class="font-mono text-xs break-all">{booking.payment_id}</div>
                                </div>
                            )}

                            {canRefund && (
                                <div class="mt-6">
                                    <button
                                        type="button"
                                        class="btn btn-error btn-sm w-full"
                                        onClick$={() => (showRefundModal.value = true)}
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                        Process Refund
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal.value && (
                <dialog class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg mb-4">Reject Booking</h3>

                        <Form action={confirmAction}>
                            <input type="hidden" name="booking_id" value={booking.id} />
                            <input type="hidden" name="action" value="reject" />

                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Reason for rejection (visible to customer)</span>
                                </label>
                                <textarea
                                    name="notes"
                                    class="textarea textarea-bordered h-24"
                                    placeholder="e.g., Fully booked on this date, activity unavailable..."
                                ></textarea>
                            </div>

                            <div class="alert alert-warning mt-4">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>The customer will be notified that their booking was rejected.</span>
                            </div>

                            <div class="modal-action">
                                <button
                                    type="button"
                                    class="btn"
                                    onClick$={() => (showRejectModal.value = false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    class="btn btn-error"
                                    disabled={confirmAction.isRunning}
                                    onClick$={() => (showRejectModal.value = false)}
                                >
                                    {confirmAction.isRunning ? (
                                        <>
                                            <span class="loading loading-spinner loading-sm"></span>
                                            Rejecting...
                                        </>
                                    ) : (
                                        'Reject Booking'
                                    )}
                                </button>
                            </div>
                        </Form>
                    </div>
                    <form method="dialog" class="modal-backdrop">
                        <button type="button" onClick$={() => (showRejectModal.value = false)}>close</button>
                    </form>
                </dialog>
            )}

            {/* Refund Modal */}
            {showRefundModal.value && (
                <dialog class="modal modal-open">
                    <div class="modal-box">
                        <h3 class="font-bold text-lg mb-4">Process Refund</h3>

                        <Form action={refundAction}>
                            <input type="hidden" name="payment_id" value={booking.payment_id || ''} />

                            <div class="space-y-4">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Refund Amount</span>
                                        <span class="label-text-alt">Max: ${booking.total_price.toFixed(2)}</span>
                                    </label>
                                    <div class="input-group">
                                        <span>$</span>
                                        <input
                                            type="number"
                                            name="amount"
                                            step="0.01"
                                            min="0.01"
                                            max={booking.total_price}
                                            value={booking.total_price.toFixed(2)}
                                            class="input input-bordered w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Reason</span>
                                    </label>
                                    <select name="reason" class="select select-bordered w-full">
                                        <option value="">Select a reason</option>
                                        <option value="cancellation">Booking Cancellation</option>
                                        <option value="overcharge">Overcharge</option>
                                        <option value="service_issue">Service Issue</option>
                                        <option value="duplicate">Duplicate Payment</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Notes (optional)</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        class="textarea textarea-bordered h-24"
                                        placeholder="Additional notes about this refund..."
                                    ></textarea>
                                </div>

                                <div class="alert alert-warning">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>This action cannot be undone. The refund will be processed immediately.</span>
                                </div>
                            </div>

                            <div class="modal-action">
                                <button
                                    type="button"
                                    class="btn"
                                    onClick$={() => (showRefundModal.value = false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    class="btn btn-error"
                                    disabled={refundAction.isRunning}
                                    onClick$={() => (showRefundModal.value = false)}
                                >
                                    {refundAction.isRunning ? (
                                        <>
                                            <span class="loading loading-spinner loading-sm"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        'Process Refund'
                                    )}
                                </button>
                            </div>
                        </Form>
                    </div>
                    <form method="dialog" class="modal-backdrop">
                        <button type="button" onClick$={() => (showRefundModal.value = false)}>close</button>
                    </form>
                </dialog>
            )}
        </div>
    );
});

export const head: DocumentHead = {
  title: 'Booking Details | Admin | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Manage activity bookings',
    },
  ],
};
