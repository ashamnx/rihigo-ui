import {component$, useSignal, useOnWindow, $, type QRL} from '@builder.io/qwik';
import {Link} from "@builder.io/qwik-city";
import { LocaleSelector } from '~/components/locale-selector/locale-selector';
import {inlineTranslate, localizePath, useSpeakLocale} from 'qwik-speak';
import { useSession } from "~/routes/plugin@auth";
import { NavLink } from "~/components/nav/nav-link";
import { NotificationBell } from "~/components/notifications/NotificationBell";

export interface HeaderProps {
    hasHero?: boolean;
}

export const Header = component$<HeaderProps>(({ hasHero = true }) => {
    const t = inlineTranslate();
    const locale = useSpeakLocale();
    const session = useSession();
    // TODO: Implement proper admin role check from session
    const userEmail = session.value?.user?.email;
    const isUserAdmin = userEmail ? userEmail.endsWith('@rihigo.mv') : false;
    const isMobileMenuOpen = useSignal(false);
    const isScrolled = useSignal(false);

    useOnWindow('scroll', $(() => {
        isScrolled.value = window.scrollY > 50;
    }));

    // Show solid header when scrolled OR when page has no hero
    const showSolidHeader = isScrolled.value || !hasHero;

    const getPath = localizePath();

    const nav = [
        {
            label: t('app.nav.services'),
            link: '/services/',
            children: [
                {
                    label: 'Imuga',
                    link: '/services/imuga/',
                    description: `We help you fill out the imuga form`
                },
                {
                    label: 'e-Sim',
                    link: '/services/e-sim/',
                    description: `We can get you the best e-sim deals from local service providers`
                }
            ]
        },
        {
            label: t('app.nav.explore'),
            link: '/activities/'
        },
        {
            label: t('app.nav.aboutUs'),
            link: '/about-us/'
        },
        {
            label: t('app.nav.help'),
            link: '/support/'
        },
    ];

    return (
        <header class={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${showSolidHeader ? 'bg-white shadow-md' : 'bg-transparent'}`}>
            <nav class="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
                <div class="flex lg:flex-1">
                    <Link href={`/${locale.lang || "en-US"}`} class="-m-1.5 p-1.5">
                        <span class="sr-only">Rihigo</span>
                        <img
                            src="/assets/logo.svg"
                            alt="Rihigo Logo"
                            class={`h-8 transition-all duration-300 ${showSolidHeader ? '' : 'brightness-0 invert'}`}
                            height="32"
                        />
                    </Link>
                </div>
                <div class="flex items-center gap-2 lg:hidden">
                    {/* Mobile Notification Bell - only show when authenticated */}
                    {session.value?.user && (
                        <NotificationBell isScrolled={showSolidHeader} lang={locale.lang || "en-US"} />
                    )}
                    <button type="button"
                            class={`-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 transition-colors ${showSolidHeader ? 'text-gray-700' : 'text-white'}`}
                            onClick$={() => isMobileMenuOpen.value = true}>
                        <span class="sr-only">Open main menu</span>
                        <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                             aria-hidden="true" data-slot="icon">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                        </svg>
                    </button>
                </div>
                <div class="hidden lg:flex lg:gap-x-12">
                    {nav.map((item, index) => item.children ?
                        (<NestedNav item={item} key={index} isScrolled={showSolidHeader} />)
                        : (<NavLink href={`/${locale.lang || "en-US"}${item.link}`}
                                    activeClass="text-primary"
                                 class={`text-sm/6 font-semibold transition-colors duration-300 hover:text-primary ${showSolidHeader ? 'text-gray-900' : 'text-white'}`}
                                 key={index}>{item.label}</NavLink>)
                    )}
                </div>
                <div class="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
                    <LocaleSelector isScrolled={showSolidHeader} />

                    {session.value?.user ? (
                        /* Authenticated User */
                        <div class="flex items-center gap-3">
                            {/* Admin Badge */}
                            {isUserAdmin && (
                                <Link href="/admin" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium hover:bg-blue-200">
                                    Admin
                                </Link>
                            )}

                            {/* Notification Bell */}
                            <NotificationBell isScrolled={showSolidHeader} lang={locale.lang || "en-US"} />

                            {/* Profile Dropdown */}
                            <div class="dropdown dropdown-end">
                                <div tabIndex={0} role="button" class="btn btn-ghost btn-sm avatar">
                                    <div class="w-8 rounded-full">
                                        <img src={session.value.user.image || '/default-avatar.png'} alt="Profile" width="32" height="32" />
                                    </div>
                                </div>
                                <ul tabIndex={0} class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                                    <li class="menu-title">
                                        <span>{session.value.user.name}</span>
                                        <span class="text-xs opacity-60">{session.value.user.email}</span>
                                    </li>
                                    <div class="divider my-1"></div>
                                    <li onClick$={() => (document.activeElement as HTMLElement).blur()}><Link href={`/${locale.lang}/profile`}>{t('app.nav.profile') || 'My Profile'}</Link></li>
                                    <li onClick$={() => (document.activeElement as HTMLElement).blur()}><Link href={`/${locale.lang}/bookings`}>{t('app.nav.bookings') || 'My Bookings'}</Link></li>
                                    {isUserAdmin && (
                                        <li onClick$={() => (document.activeElement as HTMLElement).blur()}><Link href="/admin">{t('app.nav.admin') || 'Admin Panel'}</Link></li>
                                    )}
                                    <div class="divider my-1"></div>
                                    <li>
                                        <form action="/auth/signout" method="post">
                                            <button type="submit" class="w-full text-left">
                                                {t('app.nav.signOut') || 'Sign Out'}
                                            </button>
                                        </form>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        /* Not Authenticated */
                        <div class="flex items-center gap-2">
                            <Link
                                href={getPath('/auth/sign-in', locale.lang || "en-US")}
                                class={`text-sm/6 font-semibold px-5 py-2 rounded-lg transition-all duration-300 ${
                                    showSolidHeader
                                        ? 'bg-primary text-white hover:bg-primary/90'
                                        : 'bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 border border-white/30'
                                }`}
                            >
                                {t('app.nav.login') || 'Sign In'}
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
            {/* Mobile menu */}
            {isMobileMenuOpen.value && (
                <div class="lg:hidden" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div
                        class="fixed inset-0 z-40 bg-black/25"
                        onClick$={() => isMobileMenuOpen.value = false}
                    ></div>
                    {/* Drawer */}
                    <div class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                        <div class="flex items-center justify-between">
                            <Link href={`/${locale.lang || "en-US"}`} class="-m-1.5 p-1.5" onClick$={() => isMobileMenuOpen.value = false}>
                                <span class="sr-only">Rihigo</span>
                                <img src="/assets/logo.svg" alt="Rihigo Logo" class="h-8"/>
                            </Link>
                            <button
                                type="button"
                                class="-m-2.5 rounded-md p-2.5 text-gray-700"
                                onClick$={() => isMobileMenuOpen.value = false}
                            >
                                <span class="sr-only">Close menu</span>
                                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                                     aria-hidden="true" data-slot="icon">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="mt-6 flow-root">
                            <div class="-my-6 divide-y divide-gray-500/10">
                                <div class="space-y-2 py-6">
                                    {nav.map((item, index) => item.children ? (
                                        <MobileNestedNav
                                            key={index}
                                            item={item}
                                            locale={locale.lang || "en-US"}
                                            onNavigate$={() => isMobileMenuOpen.value = false}
                                        />
                                    ) : (
                                        <Link
                                            key={index}
                                            href={`/${locale.lang || "en-US"}${item.link}`}
                                            class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                            onClick$={() => isMobileMenuOpen.value = false}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                                <div class="py-6">
                                    <div class="flex items-center gap-4 px-3 py-2.5">
                                        <LocaleSelector />
                                    </div>
                                    {session.value?.user ? (
                                        <>
                                            <div class="px-3 py-2.5 border-b border-gray-200 mb-2">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-10 h-10 rounded-full overflow-hidden">
                                                        <img src={session.value.user.image || '/default-avatar.png'} alt="Profile" width="40" height="40" />
                                                    </div>
                                                    <div>
                                                        <p class="font-semibold text-gray-900">{session.value.user.name}</p>
                                                        <p class="text-sm text-gray-500">{session.value.user.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/${locale.lang}/profile`}
                                                class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                                onClick$={() => isMobileMenuOpen.value = false}
                                            >
                                                {t('app.nav.profile') || 'My Profile'}
                                            </Link>
                                            <Link
                                                href={`/${locale.lang}/bookings`}
                                                class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                                onClick$={() => isMobileMenuOpen.value = false}
                                            >
                                                {t('app.nav.bookings') || 'My Bookings'}
                                            </Link>
                                            {isUserAdmin && (
                                                <Link
                                                    href="/admin"
                                                    class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                                    onClick$={() => isMobileMenuOpen.value = false}
                                                >
                                                    {t('app.nav.admin') || 'Admin Panel'}
                                                </Link>
                                            )}
                                            <form action="/auth/signout" method="post" class="mt-2">
                                                <button
                                                    type="submit"
                                                    class="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base/7 font-semibold text-red-600 hover:bg-gray-50"
                                                >
                                                    {t('app.nav.signOut') || 'Sign Out'}
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <div class="space-y-2">
                                            <Link
                                                href={getPath('/auth/sign-in', locale.lang || "en-US")}
                                                class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-white bg-primary text-center hover:bg-primary/80"
                                                onClick$={() => isMobileMenuOpen.value = false}
                                            >
                                                {t('app.nav.login') || 'Sign In'}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
});

const NestedNav = component$(({item, isScrolled}: {item: any, isScrolled: boolean}) => {
    const isExpanded = useSignal(false);

    return (
        <div class="relative z-20">
            <button type="button" class={`flex items-center gap-x-1 text-sm/6 font-semibold cursor-pointer transition-colors duration-300 hover:text-primary ${isScrolled ? 'text-gray-900' : 'text-white'}`}
                    aria-expanded={isExpanded.value}
                    aria-haspopup="true"
                    onClick$={() => isExpanded.value = !isExpanded.value}
            >
                {item.label}
                <svg class={`size-5 flex-none transition-colors ${isScrolled ? 'text-gray-400' : 'text-white/70'}`} viewBox="0 0 20 20" fill="currentColor"
                     aria-hidden="true" data-slot="icon">
                    <path fill-rule="evenodd"
                          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          clip-rule="evenodd"/>
                </svg>
            </button>
            {
                isExpanded.value && (
                    <div
                        class="absolute top-full -left-8 z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white ring-1 shadow-lg ring-gray-900/5">
                        <div class="p-4">
                            {
                                item.children.map((child: any, index: number) => (
                                    <div class="group relative flex gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50"
                                         key={index}
                                         onClick$={() => isExpanded.value = false}>
                                        <div
                                            class="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                                            <svg class="size-6 text-gray-600 group-hover:text-primary" fill="none"
                                                 viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                                                 aria-hidden="true" data-slot="icon">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                      d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"/>
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                      d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"/>
                                            </svg>
                                        </div>
                                        <div class="flex-auto">
                                            <NavLink href="#" class="block font-semibold text-gray-900">
                                                {child.label}
                                                <span class="absolute inset-0"></span>
                                            </NavLink>
                                            <p class="mt-1 text-gray-600">{child.description}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )
            }
        </div>
    )
})

interface MobileNestedNavProps {
    item: {
        label: string;
        link: string;
        children: Array<{
            label: string;
            link: string;
            description?: string;
        }>;
    };
    locale: string;
    onNavigate$: QRL<() => void>;
}

const MobileNestedNav = component$<MobileNestedNavProps>(({item, locale, onNavigate$}) => {
    const isExpanded = useSignal(false);

    return (
        <div class="-mx-3">
            <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                aria-expanded={isExpanded.value}
                onClick$={() => isExpanded.value = !isExpanded.value}
            >
                {item.label}
                <svg
                    class={`size-5 flex-none transition-transform duration-200 ${isExpanded.value ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fill-rule="evenodd"
                        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
            {isExpanded.value && (
                <div class="mt-2 space-y-2">
                    {item.children.map((child, index) => (
                        <Link
                            key={index}
                            href={`/${locale}${child.link}`}
                            class="block rounded-lg py-2 pr-3 pl-6 text-sm/7 font-semibold text-gray-900 hover:bg-gray-50"
                            onClick$={onNavigate$}
                        >
                            {child.label}
                            {child.description && (
                                <span class="block text-xs font-normal text-gray-500 mt-0.5">{child.description}</span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
})
