import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";

// Fetch dashboard stats
export const useDashboardStats = routeLoader$(async (requestEvent) => {
    const stats = {
        activities: { total: 0, published: 0, draft: 0 },
        bookings: { total: 0, pending: 0, confirmed: 0, revenue: 0 },
        vendors: { total: 0, active: 0 },
        users: { total: 0 }
    };

    try {
        // Fetch activities count using apiClient
        const activitiesResponse = await authenticatedRequest(requestEvent, async (token) => {
            return await apiClient.activities.listAdmin(1, 1, token);
        });
        if (activitiesResponse?.pagination_data) {
            stats.activities.total = activitiesResponse.pagination_data.total_count || 0;
        }

        // Fetch bookings count
        const bookingsResponse = await authenticatedRequest(requestEvent, async (token) => {
            return await apiClient.bookings.list(1, 100, token);
        });
        if (bookingsResponse?.data) {
            const bookings = bookingsResponse.data as Array<{ status: string; payment_status: string; total_price: number }>;
            stats.bookings.total = bookings.length;
            stats.bookings.pending = bookings.filter(b => b.status === 'pending').length;
            stats.bookings.confirmed = bookings.filter(b => b.status === 'confirmed').length;
            stats.bookings.revenue = bookings
                .filter(b => b.payment_status === 'paid')
                .reduce((sum, b) => sum + (b.total_price || 0), 0);
        }

        // Fetch vendors count
        const vendorsResponse = await authenticatedRequest(requestEvent, async (token) => {
            return await apiClient.vendors.list(1, 1, token);
        });
        if (vendorsResponse?.pagination_data) {
            stats.vendors.total = vendorsResponse.pagination_data.total_count || 0;
        }

    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
    }

    return stats;
});

export default component$(() => {
    const stats = useDashboardStats();

    const quickActions = [
        { label: 'New Activity', href: '/admin/activities/new', icon: 'plus', color: 'primary' },
        { label: 'New Vendor', href: '/admin/vendors/new', icon: 'vendor', color: 'secondary' },
        { label: 'New Category', href: '/admin/categories/new', icon: 'tag', color: 'accent' },
        { label: 'View Bookings', href: '/admin/bookings', icon: 'calendar', color: 'info' },
    ];

    return (
        <div class="space-y-6">
            {/* Header */}
            <div>
                <h1 class="text-2xl font-bold">Dashboard</h1>
                <p class="text-base-content/60 mt-1">Welcome to the Rihigo admin panel</p>
            </div>

            {/* Stats Grid */}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Activities */}
                <div class="bg-base-200 rounded-xl p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-base-content/60 text-sm">Activities</p>
                            <p class="text-3xl font-bold mt-1">{stats.value.activities.total}</p>
                        </div>
                        <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg class="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                            </svg>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center gap-2 text-sm">
                        <Link href="/admin/activities" class="text-primary hover:underline">
                            View all
                        </Link>
                    </div>
                </div>

                {/* Bookings */}
                <div class="bg-base-200 rounded-xl p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-base-content/60 text-sm">Bookings</p>
                            <p class="text-3xl font-bold mt-1">{stats.value.bookings.total}</p>
                        </div>
                        <div class="size-12 rounded-lg bg-info/10 flex items-center justify-center">
                            <svg class="size-6 text-info" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                            </svg>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center gap-3 text-sm">
                        <span class="text-warning">{stats.value.bookings.pending} pending</span>
                        <span class="text-base-content/30">|</span>
                        <span class="text-success">{stats.value.bookings.confirmed} confirmed</span>
                    </div>
                </div>

                {/* Revenue */}
                <div class="bg-base-200 rounded-xl p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-base-content/60 text-sm">Revenue</p>
                            <p class="text-3xl font-bold mt-1">${stats.value.bookings.revenue.toLocaleString()}</p>
                        </div>
                        <div class="size-12 rounded-lg bg-success/10 flex items-center justify-center">
                            <svg class="size-6 text-success" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div class="mt-3 text-sm text-base-content/60">
                        From paid bookings
                    </div>
                </div>

                {/* Vendors */}
                <div class="bg-base-200 rounded-xl p-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-base-content/60 text-sm">Vendors</p>
                            <p class="text-3xl font-bold mt-1">{stats.value.vendors.total}</p>
                        </div>
                        <div class="size-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                            <svg class="size-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                            </svg>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center gap-2 text-sm">
                        <Link href="/admin/vendors" class="text-primary hover:underline">
                            Manage vendors
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            class="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-xl hover:bg-base-300 transition-colors group"
                        >
                            <div class={`size-10 rounded-lg bg-${action.color}/10 flex items-center justify-center group-hover:bg-${action.color}/20 transition-colors`}>
                                {action.icon === 'plus' && (
                                    <svg class={`size-5 text-${action.color}`} fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                )}
                                {action.icon === 'vendor' && (
                                    <svg class={`size-5 text-${action.color}`} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
                                    </svg>
                                )}
                                {action.icon === 'tag' && (
                                    <svg class={`size-5 text-${action.color}`} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
                                    </svg>
                                )}
                                {action.icon === 'calendar' && (
                                    <svg class={`size-5 text-${action.color}`} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                                    </svg>
                                )}
                            </div>
                            <span class="text-sm font-medium">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity Section */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Management Links */}
                <div class="bg-base-200 rounded-xl p-5">
                    <h3 class="font-semibold mb-4">Content Management</h3>
                    <div class="space-y-2">
                        <Link href="/admin/activities" class="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors">
                            <div class="flex items-center gap-3">
                                <svg class="size-5 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                                </svg>
                                <span>Activities</span>
                            </div>
                            <svg class="size-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                        <Link href="/admin/categories" class="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors">
                            <div class="flex items-center gap-3">
                                <svg class="size-5 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                </svg>
                                <span>Categories</span>
                            </div>
                            <svg class="size-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                        <Link href="/admin/faqs" class="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors">
                            <div class="flex items-center gap-3">
                                <svg class="size-5 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                </svg>
                                <span>FAQs</span>
                            </div>
                            <svg class="size-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Geography Links */}
                <div class="bg-base-200 rounded-xl p-5">
                    <h3 class="font-semibold mb-4">Geography</h3>
                    <div class="space-y-2">
                        <Link href="/admin/atolls" class="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors">
                            <div class="flex items-center gap-3">
                                <svg class="size-5 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                                </svg>
                                <span>Atolls</span>
                            </div>
                            <svg class="size-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                        <Link href="/admin/islands" class="flex items-center justify-between p-3 rounded-lg hover:bg-base-300 transition-colors">
                            <div class="flex items-center gap-3">
                                <svg class="size-5 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                </svg>
                                <span>Islands</span>
                            </div>
                            <svg class="size-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Dashboard | Admin | Rihigo",
    meta: [
        {
            name: "description",
            content: "Rihigo admin dashboard",
        },
    ],
};
