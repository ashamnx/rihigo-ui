import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { getBookingById } from '~/services/booking-api';

export const useBookingDetails = routeLoader$(async (requestEvent) => {
    const session = requestEvent.sharedMap.get('session');
    if (!session || !session.user) {
        throw requestEvent.redirect(302, '/auth/sign-in');
    }

    const bookingId = requestEvent.params.id;
    try {
        const booking = await getBookingById(bookingId, session.user.accessToken);
        return { success: true, booking };
    } catch (error) {
        return { success: false, error: 'Failed to load booking details' };
    }
});

export default component$(() => {
    const bookingData = useBookingDetails();

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

    return (
        <div class="p-6">
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

                                {booking.taxes?.map(tax => (
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
                                <div class={`badge ${booking.payment_status === 'paid' ? 'badge-success' : 'badge-warning'} w-full py-3`}>
                                    {booking.payment_status.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
