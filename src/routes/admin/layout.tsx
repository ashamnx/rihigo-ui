import { component$, Slot } from "@builder.io/qwik";
import { RequestHandler, routeAction$, z, zod$ } from "@builder.io/qwik-city";
import { Link, useLocation, Form } from "@builder.io/qwik-city";
import { useSession, useSignOut } from "~/routes/plugin@auth";
import type { Session } from '@auth/qwik';
import { authenticatedRequest } from "~/utils/auth";
import { apiClient } from "~/utils/api-client";
import { OwnerType, PrivacyLevel } from "~/types/media";

export const onRequest: RequestHandler = (event) => {
    const session = event.sharedMap.get('session') as (Session & { user?: { role?: string } }) | null;

    // Check authentication
    if (!session || new Date(session.expires) < new Date()) {
        throw event.redirect(302, `/auth/sign-in?callbackUrl=${event.url.pathname}`);
    }

    // Check admin role - redirect non-admins to home page
    if (session.user?.role !== 'admin') {
        throw event.redirect(302, '/');
    }

    // Prevent caching of authenticated pages to avoid user data leakage
    event.headers.set('Cache-Control', 'private, no-store');
};

// Navigation items organized by section
const navSections = [
    {
        title: 'Overview',
        items: [
            { label: 'Dashboard', link: '/admin', icon: 'dashboard' },
        ]
    },
    {
        title: 'Content',
        items: [
            { label: 'Activities', link: '/admin/activities', icon: 'activities' },
            { label: 'Media', link: '/admin/media', icon: 'media' },
            { label: 'Categories', link: '/admin/categories', icon: 'categories' },
            { label: 'FAQs', link: '/admin/faqs', icon: 'faqs' },
        ]
    },
    {
        title: 'Business',
        items: [
            { label: 'Vendors', link: '/admin/vendors', icon: 'vendors' },
            { label: 'Bookings', link: '/admin/bookings', icon: 'bookings' },
            { label: 'Support Tickets', link: '/admin/tickets', icon: 'tickets' },
        ]
    },
    {
        title: 'Immigration',
        items: [
            { label: 'Declarations', link: '/admin/imuga/declarations', icon: 'declarations' },
            { label: 'Requests', link: '/admin/imuga/requests', icon: 'requests' },
        ]
    },
    {
        title: 'Geography',
        items: [
            { label: 'Atolls', link: '/admin/atolls', icon: 'atolls' },
            { label: 'Islands', link: '/admin/islands', icon: 'islands' },
        ]
    },
    {
        title: 'System',
        items: [
            { label: 'Notifications', link: '/admin/notifications', icon: 'notifications' },
            { label: 'Users', link: '/admin/users', icon: 'users' },
            { label: 'Tax Rules', link: '/admin/taxes', icon: 'taxes' },
            { label: 'Settings', link: '/admin/settings', icon: 'settings' },
        ]
    }
];

// Icon component for cleaner code
const NavIcon = ({ name }: { name: string }) => {
    const icons: Record<string, any> = {
        dashboard: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
        ),
        activities: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25m11.142 0l-5.571 3-5.571-3" />
            </svg>
        ),
        categories: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
        ),
        vendors: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
        ),
        atolls: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
        ),
        islands: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
        ),
        bookings: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
            </svg>
        ),
        tickets: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
        ),
        users: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        ),
        faqs: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
        ),
        media: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
        ),
        taxes: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
        ),
        settings: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        notifications: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
        ),
        declarations: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
        requests: (
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
        ),
    };
    return icons[name] || null;
};

// Route action to create media record (Step 2: After client uploads to Cloudflare R2)
export const useCreateMediaRecord = routeAction$(
  async (data, requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
      // Presigned uploads go to R2, so always use cloudflare_r2
      const storageProvider = 'cloudflare_r2';

      // Construct CDN URL for public files
      // R2 public bucket URL format: https://pub-{hash}.r2.dev/{key}
      // or custom domain if configured
      let cdnUrl: string | undefined;
      if (data.privacy_level === 'public' || !data.privacy_level) {
        const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
        if (r2PublicUrl) {
          cdnUrl = `${r2PublicUrl}/${data.storage_key}`;
        }
      }

      // Create media record
      const result = await apiClient.media.create(
        {
          filename: data.storage_key.split('/').pop() || data.original_filename,
          original_filename: data.original_filename,
          mime_type: data.content_type,
          file_size: data.file_size,
          storage_provider: storageProvider,
          storage_key: data.storage_key,
          cdn_url: cdnUrl,
          privacy_level: (data.privacy_level as PrivacyLevel) || 'public',
          owner_type: (data.owner_type as OwnerType) || 'activity',
          owner_id: data.owner_id || 'general',
          tags: data.tags ? JSON.parse(data.tags) : undefined,
          metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
        },
        token
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          error_message: result.error_message || 'Failed to create media record',
        };
      }

      return {
        success: true,
        data: result.data,
        message: 'File uploaded successfully',
      };
    });
  },
  zod$({
    original_filename: z.string(),
    content_type: z.string(),
    file_size: z.number(),
    storage_key: z.string(),
    privacy_level: z.string().optional(),
    owner_type: z.string().optional(),
    owner_id: z.string().optional(),
    tags: z.string().optional(),
    metadata: z.string().optional(),
  })
);

export default component$(() => {
    const session = useSession();
    const signOut = useSignOut();
    const location = useLocation();

    if (!session.value?.user) {
        throw new Response(null, {
            status: 302,
            headers: { Location: "/auth/sign-in?callbackUrl=/admin" }
        });
    }

    const isActive = (link: string) => {
        if (link === '/admin') {
            return location.url.pathname === '/admin' || location.url.pathname === '/admin/';
        }
        return location.url.pathname.startsWith(link);
    };

    return (
        <div class="drawer lg:drawer-open" data-theme="dark">
            <input id="admin-drawer" type="checkbox" class="drawer-toggle" />

            {/* Main content area */}
            <div class="drawer-content flex flex-col min-h-screen bg-base-100">
                {/* Top navbar */}
                <nav class="navbar bg-base-100 border-b border-base-300 sticky top-0 z-30 px-4">
                    <div class="flex-none lg:hidden">
                        <label for="admin-drawer" class="btn btn-square btn-ghost btn-sm">
                            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </label>
                    </div>

                    <div class="flex-1">
                        <span class="font-medium text-base-content/70 text-sm">Admin</span>
                    </div>

                    <div class="flex-none flex items-center gap-2">
                        <Link href="/" class="btn btn-ghost btn-sm gap-1" target="_blank">
                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            <span class="hidden sm:inline">View Site</span>
                        </Link>

                        <div class="dropdown dropdown-end">
                            <div tabIndex={0} role="button" class="btn btn-ghost btn-circle avatar btn-sm">
                                <div class="w-8 rounded-full ring-1 ring-base-300">
                                    <img
                                        src={session.value.user.image || "https://api.dicebear.com/7.x/initials/svg?seed=" + session.value.user.name}
                                        alt="Avatar"
                                        width="32"
                                        height="32"
                                    />
                                </div>
                            </div>
                            <ul tabIndex={0} class="dropdown-content menu menu-sm bg-base-200 rounded-box z-50 mt-3 w-56 p-2 shadow-lg">
                                <li class="menu-title px-2 py-1">
                                    <span class="font-medium">{session.value.user.name}</span>
                                    <span class="text-xs opacity-60 font-normal">{session.value.user.email}</span>
                                </li>
                                <div class="divider my-1"></div>
                                <li><Link href="/profile">Profile</Link></li>
                                <li><Link href="/admin/settings">Settings</Link></li>
                                <div class="divider my-1"></div>
                                <li>
                                    <Form action={signOut}>
                                        <input type="hidden" name="redirectTo" value="/" />
                                        <button type="submit" class="text-error flex items-center gap-2" disabled={signOut.isRunning}>
                                            {signOut.isRunning && <span class="loading loading-spinner loading-xs"></span>}
                                            {signOut.isRunning ? 'Signing out...' : 'Sign Out'}
                                        </button>
                                    </Form>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>

                {/* Page content */}
                <main class="flex-1 p-4 lg:p-6 overflow-auto">
                    <Slot />
                </main>
            </div>

            {/* Sidebar */}
            <div class="drawer-side z-40">
                <label for="admin-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
                <aside class="w-64 min-h-screen bg-base-200 flex flex-col">
                    {/* Logo */}
                    <div class="p-4 border-b border-base-300">
                        <Link href="/admin" class="flex items-center gap-2">
                            <div class="size-8 rounded-lg bg-primary flex items-center justify-center">
                                <span class="text-primary-content font-bold text-sm">R</span>
                            </div>
                            <span class="font-semibold">Rihigo Admin</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav class="flex-1 overflow-y-auto p-3">
                        {navSections.map((section) => (
                            <div key={section.title} class="mb-4">
                                <h3 class="text-xs font-medium text-base-content/50 uppercase tracking-wider px-3 mb-2">
                                    {section.title}
                                </h3>
                                <ul class="space-y-0.5">
                                    {section.items.map((item) => (
                                        <li key={item.link}>
                                            <Link
                                                href={item.link}
                                                class={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                    isActive(item.link)
                                                        ? 'bg-primary text-primary-content font-medium'
                                                        : 'text-base-content/70 hover:bg-base-300 hover:text-base-content'
                                                }`}
                                            >
                                                <NavIcon name={item.icon} />
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>

                    {/* User info at bottom */}
                    <div class="p-3 border-t border-base-300">
                        <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-base-300/50">
                            <div class="avatar">
                                <div class="w-8 rounded-full">
                                    <img
                                        src={session.value.user.image || "https://api.dicebear.com/7.x/initials/svg?seed=" + session.value.user.name}
                                        alt="Avatar"
                                        width="32"
                                        height="32"
                                    />
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium truncate">{session.value.user.name}</div>
                                <div class="text-xs text-base-content/50">Administrator</div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
});
