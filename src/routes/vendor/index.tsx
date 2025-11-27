import { component$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { authenticatedRequest, apiClient } from "~/utils/api-client";

export const useVendorDashboard = routeLoader$(async (requestEvent) => {
    const [profile, activities, bookings, reports] = await Promise.all([
        authenticatedRequest(requestEvent, (token: string) => apiClient.vendorPortal.getProfile(token)),
        authenticatedRequest(requestEvent, (token: string) => apiClient.vendorPortal.getActivities(token)),
        authenticatedRequest(requestEvent, (token: string) => apiClient.vendorPortal.bookings.list(token, {})),
        authenticatedRequest(requestEvent, (token: string) => apiClient.vendorPortal.reports.getDashboard(token)),
    ]);

    return {
        profile: profile.success ? profile.data : null,
        activities: activities.success ? activities.data?.activities || [] : [],
        bookings: bookings.success ? bookings.data?.bookings || [] : [],
        reports: reports.success ? reports.data : null,
    };
});

export default component$(() => {
    const dashboardData = useVendorDashboard();

    return (
        <div class="space-y-6">
            {/* Page Header */}
            <div>
                <h1 class="text-3xl font-bold">Dashboard</h1>
                <p class="text-base-content/60 mt-1">Welcome back to your vendor portal</p>
            </div>

            {/* Vendor Profile Card */}
            {dashboardData.value.profile && (
                <div class="card bg-primary text-primary-content">
                    <div class="card-body">
                        <h2 class="card-title text-2xl">{dashboardData.value.profile.business_name}</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                                <div class="text-sm opacity-80">Email</div>
                                <div class="font-semibold">{dashboardData.value.profile.email}</div>
                            </div>
                            <div>
                                <div class="text-sm opacity-80">Status</div>
                                <div class="font-semibold capitalize">{dashboardData.value.profile.status}</div>
                            </div>
                            <div>
                                <div class="text-sm opacity-80">Verified</div>
                                <div class="font-semibold">{dashboardData.value.profile.is_verified ? 'Yes' : 'No'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                    </div>
                    <div class="stat-title">Total Activities</div>
                    <div class="stat-value text-primary">{dashboardData.value.activities.length}</div>
                    <div class="stat-desc">
                        <Link href="/vendor/activities" class="link link-primary">Manage activities</Link>
                    </div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                        </svg>
                    </div>
                    <div class="stat-title">Total Bookings</div>
                    <div class="stat-value text-secondary">{dashboardData.value.reports?.total_bookings || 0}</div>
                    <div class="stat-desc">
                        <Link href="/vendor/bookings" class="link link-secondary">View bookings</Link>
                    </div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-accent">
                        <svg class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="stat-title">Total Revenue</div>
                    <div class="stat-value text-accent">${dashboardData.value.reports?.total_revenue || 0}</div>
                    <div class="stat-desc">
                        <Link href="/vendor/reports" class="link link-accent">View reports</Link>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            {dashboardData.value.reports && (
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="card bg-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-sm">Pending</h3>
                            <p class="text-3xl font-bold">{dashboardData.value.reports.pending_bookings || 0}</p>
                        </div>
                    </div>
                    <div class="card bg-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-sm">Confirmed</h3>
                            <p class="text-3xl font-bold">{dashboardData.value.reports.confirmed_bookings || 0}</p>
                        </div>
                    </div>
                    <div class="card bg-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-sm">Cancelled</h3>
                            <p class="text-3xl font-bold">{dashboardData.value.reports.cancelled_bookings || 0}</p>
                        </div>
                    </div>
                    <div class="card bg-base-200">
                        <div class="card-body">
                            <h3 class="card-title text-sm">Completed</h3>
                            <p class="text-3xl font-bold">{dashboardData.value.reports.completed_bookings || 0}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Bookings */}
            <div class="card bg-base-200">
                <div class="card-body">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="card-title">Recent Bookings</h2>
                        <Link href="/vendor/bookings" class="btn btn-sm btn-primary">View All</Link>
                    </div>

                    {dashboardData.value.bookings.length > 0 ? (
                        <div class="overflow-x-auto">
                            <table class="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Booking ID</th>
                                        <th>Activity</th>
                                        <th>Date</th>
                                        <th>People</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.value.bookings.slice(0, 5).map((booking: any) => (
                                        <tr key={booking.id}>
                                            <td class="font-mono text-sm">{booking.id}</td>
                                            <td>{booking.activity_id}</td>
                                            <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                                            <td>{booking.number_of_people}</td>
                                            <td>
                                                <span class={`badge ${
                                                    booking.status === 'confirmed' ? 'badge-success' :
                                                    booking.status === 'pending' ? 'badge-warning' :
                                                    booking.status === 'cancelled' ? 'badge-error' :
                                                    'badge-ghost'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div class="text-center py-8 text-base-content/60">
                            <p>No bookings yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Activities Overview */}
            <div class="card bg-base-200">
                <div class="card-body">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="card-title">Your Activities</h2>
                        <Link href="/vendor/activities" class="btn btn-sm btn-primary">Manage Activities</Link>
                    </div>

                    {dashboardData.value.activities.length > 0 ? (
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dashboardData.value.activities.slice(0, 6).map((activity: any) => (
                                <div key={activity.id} class="card bg-base-100 shadow-sm">
                                    <div class="card-body p-4">
                                        <h3 class="font-semibold">{activity.slug}</h3>
                                        <div class="flex items-center justify-between mt-2">
                                            <span class={`badge ${
                                                activity.status === 'published' ? 'badge-success' :
                                                activity.status === 'draft' ? 'badge-warning' :
                                                'badge-ghost'
                                            }`}>
                                                {activity.status}
                                            </span>
                                            <span class="text-sm text-base-content/60">{activity.id}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div class="text-center py-8 text-base-content/60">
                            <p>No activities yet</p>
                            <Link href="/vendor/activities" class="btn btn-primary btn-sm mt-4">Create Your First Activity</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
