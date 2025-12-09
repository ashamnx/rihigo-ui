import { component$, Slot, useSignal, useComputed$, $ } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { Link, useLocation, routeLoader$ } from "@builder.io/qwik-city";
import { useSession } from "~/routes/plugin@auth";
import type { Session } from '@auth/qwik';
import { ToastProvider } from "~/context/toast-context";
import { ToastContainer } from "~/components/toast/ToastContainer";
import { NotificationProvider } from "~/context/notification-context";
import { NotificationBell } from "~/components/notifications/NotificationBell";

export const onRequest: RequestHandler = (event) => {
    const session: Session | null = event.sharedMap.get('session');
    if (!session || new Date(session.expires) < new Date()) {
        throw event.redirect(302, `/auth/sign-in?callbackUrl=${event.url.pathname}`);
    }

    // TODO: Add vendor role check here when role management is implemented
    // For now, we'll allow any authenticated user to access the vendor portal

    // Prevent caching of authenticated pages to avoid user data leakage
    event.headers.set('Cache-Control', 'private, no-store');
};

// Get session token for notification context
export const useSessionData = routeLoader$(async (requestEvent) => {
    const session = requestEvent.sharedMap.get('session') as { accessToken?: string; user?: any } | null;
    return {
        token: session?.accessToken || null,
        isAuthenticated: !!session?.user,
    };
});

// Icon components
const DashboardIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

const CalendarIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
    </svg>
);

const UsersIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);

const BuildingIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
);

const TicketIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
);

const DocumentTextIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const ReceiptIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const CreditCardIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
);

const ReceiptRefundIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M8.25 9.75h4.875a2.625 2.625 0 010 5.25H12M8.25 9.75L10.5 7.5M8.25 9.75L10.5 12m9-7.243V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
    </svg>
);

const TagIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);

const ChartBarIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

const UserGroupIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);

const CogIcon = () => (
    <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

interface NavItem {
    label: string;
    href: string;
    icon: () => any;
    badge?: number;
}

interface NavGroup {
    title: string;
    items: NavItem[];
    collapsible?: boolean;
}

export default component$(() => {
    const session = useSession();
    const sessionData = useSessionData();
    const location = useLocation();
    const isSidebarOpen = useSignal(true);
    const expandedGroups = useSignal<Record<string, boolean>>({
        'Finance': true,
    });

    if (!session.value?.user) {
        throw new Response(null, {
            status: 302,
            headers: { Location: "/auth/sign-in?callbackUrl=/vendor" }
        });
    }

    const currentPath = useComputed$(() => location.url.pathname);

    const isActiveRoute = (href: string) => {
        const path = currentPath.value;
        if (href === '/vendor') {
            return path === '/vendor' || path === '/vendor/';
        }
        return path === href || path.startsWith(href + '/');
    };

    const navigationGroups: NavGroup[] = [
        {
            title: 'Overview',
            items: [
                { label: 'Dashboard', href: '/vendor', icon: DashboardIcon },
            ]
        },
        {
            title: 'Operations',
            items: [
                { label: 'Bookings', href: '/vendor/bookings', icon: CalendarIcon },
                { label: 'Guests', href: '/vendor/guests', icon: UsersIcon },
                { label: 'Resources', href: '/vendor/resources', icon: BuildingIcon },
                { label: 'Activities', href: '/vendor/activities', icon: TicketIcon },
            ]
        },
        {
            title: 'Support',
            items: [
                { label: 'Tickets', href: '/vendor/tickets', icon: TicketIcon },
            ]
        },
        {
            title: 'Finance',
            collapsible: true,
            items: [
                { label: 'Quotations', href: '/vendor/quotations', icon: DocumentTextIcon },
                { label: 'Invoices', href: '/vendor/invoices', icon: ReceiptIcon },
                { label: 'Payments', href: '/vendor/payments', icon: CreditCardIcon },
                { label: 'Refunds', href: '/vendor/refunds', icon: ReceiptRefundIcon },
                { label: 'Discounts', href: '/vendor/discounts', icon: TagIcon },
            ]
        },
        {
            title: 'Analytics',
            items: [
                { label: 'Reports', href: '/vendor/reports', icon: ChartBarIcon },
            ]
        },
        {
            title: 'Management',
            items: [
                { label: 'Staff', href: '/vendor/staff', icon: UserGroupIcon },
                { label: 'Settings', href: '/vendor/settings', icon: CogIcon },
            ]
        }
    ];

    const toggleGroup = $((title: string) => {
        expandedGroups.value = {
            ...expandedGroups.value,
            [title]: !expandedGroups.value[title]
        };
    });

    return (
        <ToastProvider>
            <NotificationProvider token={sessionData.value.token || undefined}>
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

                        {/* Notification Bell */}
                        <NotificationBell isScrolled={false} lang="en-US" />

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
                <div class="flex flex-col w-72 min-h-full bg-base-200 text-base-content">
                    {/* Logo */}
                    <div class="flex h-16 items-center px-4 border-b border-base-300">
                        <Link href="/vendor" class="text-xl font-bold text-primary">RIHIGO</Link>
                        <span class="ml-2 badge badge-sm badge-outline">Vendor</span>
                    </div>

                    {/* Navigation */}
                    <nav class="flex-1 overflow-y-auto p-4">
                        {navigationGroups.map((group) => {
                            const groupTitle = group.title;
                            const groupCollapsible = group.collapsible;
                            return (
                                <div key={groupTitle} class="mb-4">
                                    {groupCollapsible ? (
                                        <button
                                            type="button"
                                            class="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60 hover:text-base-content"
                                            onClick$={() => toggleGroup(groupTitle)}
                                        >
                                            {groupTitle}
                                            <span class={`transform transition-transform ${expandedGroups.value[groupTitle] ? 'rotate-180' : ''}`}>
                                                <ChevronDownIcon />
                                            </span>
                                        </button>
                                    ) : (
                                        <div class="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60">
                                            {groupTitle}
                                        </div>
                                    )}

                                    {(!groupCollapsible || expandedGroups.value[groupTitle]) && (
                                        <ul class="menu menu-sm gap-1 mt-1">
                                            {group.items.map((item) => {
                                                const Icon = item.icon;
                                                const active = isActiveRoute(item.href);
                                                return (
                                                    <li key={item.href}>
                                                        <Link
                                                            href={item.href}
                                                            class={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
                                                                ? 'bg-primary text-primary-content font-medium'
                                                                : 'hover:bg-base-300'
                                                                }`}
                                                        >
                                                            <Icon />
                                                            <span>{item.label}</span>
                                                            {item.badge !== undefined && item.badge > 0 && (
                                                                <span class="badge badge-sm badge-secondary ml-auto">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Vendor User Info */}
                    <div class="border-t border-base-300 p-4">
                        <div class="flex items-center gap-3">
                            <div class="avatar">
                                <div class="w-10 h-10 rounded-full">
                                    <img src={session.value.user.image || "/default-avatar.png"} alt="Vendor" width="40"
                                        height="40" />
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium truncate">{session.value.user.name}</div>
                                <div class="text-xs text-base-content/60 truncate">{session.value.user.email}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <ToastContainer />
      </NotificationProvider>
    </ToastProvider>
  );
});
