import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, useNavigate, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import { StatusBadge } from '~/components/vendor/shared/StatusBadge';
import { ConfirmModal, showModal } from '~/components/vendor/shared/ConfirmModal';
import {
    type VendorBooking,
    type BookingStatus,
    bookingSourceLabels,
    bookingStatusLabels,
    paymentStatusLabels,
    bookingStatusColors,
    paymentStatusColors,
    getNextBookingStatuses,
} from '~/types/booking-vendor';
import { getGuestFullName } from '~/types/guest';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

export const useBookingLoader = routeLoader$(async (requestEvent) => {
    const bookingId = requestEvent.params.id;

    const result = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.bookings.get(bookingId, token);
    });

    if (!result.success || !result.data) {
        return { success: false, error: 'Booking not found', data: null };
    }

    return { success: true, data: result.data as VendorBooking, error: null };
});

export const useUpdateBookingStatus = routeAction$(async (data, requestEvent) => {
    const bookingId = requestEvent.params.id;
    const status = data.status as BookingStatus;
    const notes = data.notes as string | undefined;

    const result = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.bookings.updateStatus(bookingId, { status, notes }, token);
    });

    return { success: result.success, error: result.error_message };
});

export const useDeleteBooking = routeAction$(async (_, requestEvent) => {
    const bookingId = requestEvent.params.id;

    const result = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.bookings.delete(bookingId, token);
    });

    return { success: result.success, error: result.error_message };
});

export default component$(() => {
    const bookingData = useBookingLoader();
    const updateStatusAction = useUpdateBookingStatus();
    const deleteAction = useDeleteBooking();
    const navigate = useNavigate();
    const location = useLocation();

    const isEditMode = location.url.searchParams.get('edit') === 'true';
    const pendingStatus = useSignal<BookingStatus | null>(null);

    // Handle successful actions
    if (updateStatusAction.value?.success) {
        navigate(`/vendor/bookings/${bookingData.value?.data?.id}`, { forceReload: true });
    }
    if (deleteAction.value?.success) {
        navigate('/vendor/bookings');
    }

    if (!bookingData.value?.success || !bookingData.value.data) {
        return (
            <div class="alert alert-error">
                <span>Booking not found</span>
            </div>
        );
    }

    const booking = bookingData.value.data;
    const nextStatuses = getNextBookingStatuses(booking.status);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const handleStatusUpdate = $((status: BookingStatus) => {
        pendingStatus.value = status;
        showModal('status-update-modal');
    });

    const confirmStatusUpdate = $(async () => {
        if (!pendingStatus.value) return;
        const formData = new FormData();
        formData.append('status', pendingStatus.value);
        await updateStatusAction.submit(formData);
    });

    const handleDelete = $(async () => {
        await deleteAction.submit({});
    });

    return (
        <div>
            <PageHeader
                title={`Booking #${booking.booking_number}`}
                subtitle={booking.resource?.name || booking.activity?.title || 'Manual Booking'}
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Bookings', href: '/vendor/bookings' },
                    { label: `#${booking.booking_number}` },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    {!isEditMode && (
                        <>
                            {['pending', 'confirmed'].includes(booking.status) && (
                                <button
                                    type="button"
                                    class="btn btn-error btn-sm btn-outline"
                                    onClick$={() => showModal('delete-booking-modal')}
                                >
                                    Cancel Booking
                                </button>
                            )}
                            <Link
                                href={`/vendor/bookings/${booking.id}?edit=true`}
                                class="btn btn-ghost btn-sm"
                            >
                                Edit
                            </Link>
                        </>
                    )}
                    {isEditMode && (
                        <Link href={`/vendor/bookings/${booking.id}`} class="btn btn-ghost btn-sm">
                            View Mode
                        </Link>
                    )}
                </div>
            </PageHeader>

            {/* Error Messages */}
            {updateStatusAction.value?.success === false && (
                <div class="alert alert-error mb-4">
                    <span>{updateStatusAction.value.error}</span>
                </div>
            )}

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div class="lg:col-span-2 space-y-4">
                    {/* Status & Actions Card */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <div class="flex flex-wrap items-center justify-between gap-4">
                                <div class="flex items-center gap-3">
                                    <span class={`badge badge-lg ${bookingStatusColors[booking.status]}`}>
                                        {bookingStatusLabels[booking.status]}
                                    </span>
                                    <span class={`badge badge-lg ${paymentStatusColors[booking.payment_status]}`}>
                                        {paymentStatusLabels[booking.payment_status]}
                                    </span>
                                </div>
                                {nextStatuses.length > 0 && (
                                    <div class="flex gap-2">
                                        {nextStatuses.map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                class={`btn btn-sm ${status === 'cancelled' || status === 'no_show' ? 'btn-error btn-outline' : 'btn-primary'}`}
                                                onClick$={() => handleStatusUpdate(status)}
                                            >
                                                {status === 'confirmed' && 'Confirm Booking'}
                                                {status === 'checked_in' && 'Check In'}
                                                {status === 'checked_out' && 'Check Out'}
                                                {status === 'cancelled' && 'Cancel'}
                                                {status === 'no_show' && 'No Show'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Guest Information */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Guest Information</h3>
                            {booking.primary_guest ? (
                                <div class="flex items-start gap-4">
                                    <div class="avatar placeholder">
                                        <div class="bg-neutral text-neutral-content w-12 h-12 rounded-full">
                                            <span>
                                                {booking.primary_guest.first_name.charAt(0)}
                                                {booking.primary_guest.last_name.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex-1">
                                        <Link
                                            href={`/vendor/guests/${booking.primary_guest_id}`}
                                            class="font-medium hover:text-primary text-lg"
                                        >
                                            {getGuestFullName(booking.primary_guest)}
                                        </Link>
                                        <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
                                            {booking.primary_guest.email && (
                                                <div class="flex items-center gap-2 text-base-content/70">
                                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                    </svg>
                                                    <span>{booking.primary_guest.email}</span>
                                                </div>
                                            )}
                                            {booking.primary_guest.phone && (
                                                <div class="flex items-center gap-2 text-base-content/70">
                                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                                    </svg>
                                                    <span>{booking.primary_guest.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p class="text-base-content/50">No guest information</p>
                            )}
                            <div class="divider my-2"></div>
                            <div class="flex gap-6 text-sm">
                                <div>
                                    <span class="text-base-content/60">Adults:</span>
                                    <span class="ml-1 font-medium">{booking.adults}</span>
                                </div>
                                <div>
                                    <span class="text-base-content/60">Children:</span>
                                    <span class="ml-1 font-medium">{booking.children}</span>
                                </div>
                                <div>
                                    <span class="text-base-content/60">Infants:</span>
                                    <span class="ml-1 font-medium">{booking.infants}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stay Details */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Stay Details</h3>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <div class="text-base-content/60 text-sm">Check-in</div>
                                    <div class="font-medium">{formatDate(booking.check_in_date)}</div>
                                </div>
                                <div>
                                    <div class="text-base-content/60 text-sm">Check-out</div>
                                    <div class="font-medium">{formatDate(booking.check_out_date)}</div>
                                </div>
                                <div>
                                    <div class="text-base-content/60 text-sm">Duration</div>
                                    <div class="font-medium">{booking.nights_count} night{booking.nights_count !== 1 ? 's' : ''}</div>
                                </div>
                                {/*<div>*/}
                                {/*    <div class="text-base-content/60 text-sm">Service Type</div>*/}
                                {/*    <div class="font-medium capitalize">{booking.service_type.replace('_', ' ')}</div>*/}
                                {/*</div>*/}
                            </div>

                            {(booking.resource || booking.activity) && (
                                <>
                                    <div class="divider my-2"></div>
                                    <div>
                                        <div class="text-base-content/60 text-sm">
                                            {booking.resource ? 'Room/Unit' : 'Activity'}
                                        </div>
                                        <div class="font-medium">
                                            {booking.resource?.name || booking.activity?.title}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Special Requests & Notes */}
                    {(booking.special_requests || booking.internal_notes) && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Notes</h3>
                                {booking.special_requests && (
                                    <div class="mb-4">
                                        <div class="text-base-content/60 text-sm mb-1">Special Requests</div>
                                        <p class="text-sm bg-base-200 rounded-lg p-3">{booking.special_requests}</p>
                                    </div>
                                )}
                                {booking.internal_notes && (
                                    <div>
                                        <div class="text-base-content/60 text-sm mb-1">Internal Notes</div>
                                        <p class="text-sm bg-warning/10 rounded-lg p-3 border border-warning/20">{booking.internal_notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Services */}
                    {booking.services && booking.services.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Additional Services</h3>
                                <div class="overflow-x-auto">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Service</th>
                                                <th>Qty</th>
                                                <th>Unit Price</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {booking.services.map((service) => (
                                                <tr key={service.id}>
                                                    <td>{service.service?.name || 'Service'}</td>
                                                    <td>{service.quantity}</td>
                                                    <td>{formatCurrency(service.unit_price, booking.currency)}</td>
                                                    <td>{formatCurrency(service.total_price, booking.currency)}</td>
                                                    <td>
                                                        <StatusBadge status={service.status} size="xs" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div class="space-y-4">
                    {/* Pricing Summary */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Pricing Summary</h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-base-content/60">Subtotal</span>
                                    <span>{formatCurrency(booking.subtotal, booking.currency)}</span>
                                </div>
                                {booking.taxes > 0 && (
                                    <div class="flex justify-between">
                                        <span class="text-base-content/60">Taxes</span>
                                        <span>{formatCurrency(booking.taxes, booking.currency)}</span>
                                    </div>
                                )}
                                {booking.fees > 0 && (
                                    <div class="flex justify-between">
                                        <span class="text-base-content/60">Fees</span>
                                        <span>{formatCurrency(booking.fees, booking.currency)}</span>
                                    </div>
                                )}
                                <div class="divider my-1"></div>
                                <div class="flex justify-between font-medium text-base">
                                    <span>Total</span>
                                    <span>{formatCurrency(booking.total, booking.currency)}</span>
                                </div>
                                {booking.commission_amount && booking.commission_amount > 0 && (
                                    <>
                                        <div class="flex justify-between text-warning">
                                            <span>Commission</span>
                                            <span>-{formatCurrency(booking.commission_amount, booking.currency)}</span>
                                        </div>
                                        <div class="flex justify-between font-medium">
                                            <span>Net Revenue</span>
                                            <span class="text-success">{formatCurrency(booking.net_revenue, booking.currency)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Payment Actions */}
                            {booking.payment_status !== 'paid' && (
                                <div class="mt-4 space-y-2">
                                    <Link
                                        href={`/vendor/invoices/new?booking_id=${booking.id}`}
                                        class="btn btn-outline btn-sm w-full"
                                    >
                                        Create Invoice
                                    </Link>
                                    <Link
                                        href={`/vendor/payments/new?booking_id=${booking.id}`}
                                        class="btn btn-primary btn-sm w-full"
                                    >
                                        Record Payment
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking Info */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Booking Info</h3>
                            <div class="space-y-3 text-sm">
                                <div>
                                    <div class="text-base-content/60">Source</div>
                                    <div class="font-medium">
                                        {bookingSourceLabels[booking.source_type]}
                                        {booking.source_name && ` - ${booking.source_name}`}
                                    </div>
                                </div>
                                {booking.external_booking_id && (
                                    <div>
                                        <div class="text-base-content/60">External ID</div>
                                        <div class="font-medium font-mono">{booking.external_booking_id}</div>
                                    </div>
                                )}
                                <div>
                                    <div class="text-base-content/60">Created</div>
                                    <div class="font-medium">{formatDateTime(booking.created_at)}</div>
                                </div>
                                <div>
                                    <div class="text-base-content/60">Last Updated</div>
                                    <div class="font-medium">{formatDateTime(booking.updated_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {booking.tags && booking.tags.length > 0 && (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Tags</h3>
                                <div class="flex flex-wrap gap-2">
                                    {booking.tags.map((tag) => (
                                        <span key={tag} class="badge badge-ghost">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Related Documents */}
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-base">Documents</h3>
                            <div class="space-y-2">
                                {booking.invoices && booking.invoices.length > 0 ? (
                                    booking.invoices.map((invoice) => (
                                        <Link
                                            key={invoice.id}
                                            href={`/vendor/invoices/${invoice.id}`}
                                            class="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg transition-colors"
                                        >
                                            <div class="flex items-center gap-2">
                                                <svg class="size-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                </svg>
                                                <span class="text-sm">Invoice #{invoice.invoice_number}</span>
                                            </div>
                                            <StatusBadge status={invoice.status} size="xs" />
                                        </Link>
                                    ))
                                ) : (
                                    <p class="text-sm text-base-content/50">No invoices created</p>
                                )}
                            </div>
                            <div class="divider my-2"></div>
                            <div class="space-y-2">
                                {booking.payments && booking.payments.length > 0 ? (
                                    booking.payments.map((payment) => (
                                        <Link
                                            key={payment.id}
                                            href={`/vendor/payments/${payment.id}`}
                                            class="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg transition-colors"
                                        >
                                            <div class="flex items-center gap-2">
                                                <svg class="size-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                                </svg>
                                                <span class="text-sm">{formatCurrency(payment.amount, payment.currency)}</span>
                                            </div>
                                            <StatusBadge status={payment.status} size="xs" />
                                        </Link>
                                    ))
                                ) : (
                                    <p class="text-sm text-base-content/50">No payments recorded</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            <ConfirmModal
                id="status-update-modal"
                title={`Update Booking Status`}
                message={`Are you sure you want to change the status to "${pendingStatus.value ? bookingStatusLabels[pendingStatus.value] : ''}"?`}
                confirmText="Update Status"
                danger={pendingStatus.value === 'cancelled' || pendingStatus.value === 'no_show'}
                onConfirm$={confirmStatusUpdate}
            />

            {/* Delete Modal */}
            <ConfirmModal
                id="delete-booking-modal"
                title="Cancel Booking"
                message={`Are you sure you want to cancel booking #${booking.booking_number}? This action cannot be undone.`}
                confirmText="Cancel Booking"
                danger={true}
                onConfirm$={handleDelete}
            />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Booking Details | Vendor Portal',
    meta: [
        {
            name: 'robots',
            content: 'noindex, nofollow',
        },
    ],
};
