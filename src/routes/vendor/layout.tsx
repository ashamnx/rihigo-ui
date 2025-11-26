import { component$, Slot, useSignal } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { useSession } from "~/routes/plugin@auth";
import type { Session } from '@auth/qwik';

export const onRequest: RequestHandler = (event) => {
    const session: Session | null = event.sharedMap.get('session');
    if (!session || new Date(session.expires) < new Date()) {
        throw event.redirect(302, `/auth/sign-in?callbackUrl=${event.url.pathname}`);
    }

    // TODO: Add vendor role check here when role management is implemented
    // For now, we'll allow any authenticated user to access the vendor portal

    event.cacheControl({
        staleWhileRevalidate: 60 * 60 * 24 * 7,
        maxAge: 5,
    });
};

export default component$(() => {
    const session = useSession();
    const isSidebarOpen = useSignal(true);

    if (!session.value?.user) {
        throw new Response(null, {
            status: 302,
            headers: { Location: "/auth/sign-in?callbackUrl=/vendor" }
        });
    }

    const vendorNav = [
        {
            label: 'Dashboard',
            link: '/vendor',
            icon: (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            )
        },
        {
            label: 'Activities',
            link: '/vendor/activities',
            icon: (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            )
        },
        {
            label: 'Bookings',
            link: '/vendor/bookings',
            icon: (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                </svg>
            )
        },
        {
            label: 'Staff',
            link: '/vendor/staff',
            icon: (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            )
        },
        {
            label: 'Reports',
            link: '/vendor/reports',
            icon: (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
            )
        }
    ];

    return (
        <div class="drawer lg:drawer-open" data-theme="light">
            <input
                id="vendor-drawer"
                type="checkbox"
                class="drawer-toggle"
                checked={isSidebarOpen.value}
                onChange$={() => isSidebarOpen.value = !isSidebarOpen.value}
            />

            {/* Drawer content */}
            <div class="drawer-content flex flex-col min-h-screen bg-base-100">
                {/* Navbar */}
                <div class="navbar bg-base-100 sticky top-0 z-30 shadow-sm border-b border-base-200">
                    <div class="flex-none lg:hidden">
                        <label for="vendor-drawer" class="btn btn-square btn-ghost drawer-button">
                            <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </label>
                    </div>
                    <div class="flex-1">
                        <span class="text-lg font-semibold">Vendor Portal</span>
                    </div>
                    <div class="flex-none gap-2">
                        {/* Vendor badge */}
                        <div class="badge badge-primary">Vendor</div>

                        {/* View Site */}
                        <Link href="/" class="btn btn-ghost btn-sm" target="_blank">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Site
                        </Link>

                        {/* Profile dropdown */}
                        <div class="dropdown dropdown-end">
                            <div tabIndex={0} role="button" class="btn btn-ghost btn-circle avatar">
                                <div class="w-10 rounded-full">
                                    <img
                                        src={session.value.user.image || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                                        alt="User avatar" width="40" height="40" />
                                </div>
                            </div>
                            <ul tabIndex={0}
                                class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                                <li class="menu-title">
                                    <span>{session.value.user.name}</span>
                                    <span class="text-xs opacity-60">{session.value.user.email}</span>
                                </li>
                                <li><Link href="/profile">My Profile</Link></li>
                                <div class="divider my-1"></div>
                                <li>
                                    <form action="/auth/signout" method="post">
                                        <button type="submit" class="w-full text-left">
                                            Sign Out
                                        </button>
                                    </form>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <main class="flex-1 p-6">
                    <Slot />
                </main>

                {/* Footer */}
                <footer class="footer footer-center p-4 bg-base-200 text-base-content">
                    <aside>
                        <p>&copy; {new Date().getFullYear()} Rihigo Vendor Portal. All rights reserved.</p>
                    </aside>
                </footer>
            </div>

            {/* Drawer sidebar */}
            <div class="drawer-side z-40">
                <label for="vendor-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
                <div class="menu p-4 w-72 min-h-full bg-base-200 text-base-content">
                    <div class="flex h-16 items-center mb-4">
                        <Link href="/vendor" class="text-xl font-bold text-primary">RIHIGO VENDOR</Link>
                    </div>
                    <ul class="menu menu-lg">
                        {vendorNav.map((item, index) => (
                            <li key={index}>
                                <Link href={item.link} class="flex items-center gap-3">
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Vendor User Info */}
                    <div class="mt-auto pt-4 border-t border-base-300">
                        <div class="flex items-center gap-3 p-2">
                            <div class="avatar">
                                <div class="w-8 h-8 rounded-full">
                                    <img src={session.value.user.image || "/default-avatar.png"} alt="Vendor" width="32"
                                        height="32" />
                                </div>
                            </div>
                            <div class="flex-1">
                                <div class="text-sm font-medium">{session.value.user.name?.split(' ')[0]}</div>
                                <div class="text-xs opacity-60">Vendor</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
