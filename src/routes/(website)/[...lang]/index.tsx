import {component$} from "@builder.io/qwik";
import type {DocumentHead} from "@builder.io/qwik-city";
import {Link, routeLoader$, useLocation} from "@builder.io/qwik-city";
import {apiClient} from "~/utils/api-client";
import {inlineTranslate} from "qwik-speak";
import {ErrorState} from "~/components/error-state/error-state";

export const useHomeData = routeLoader$(async () => {
    try {
        // Fetch featured activities for the home page
        const response = await apiClient.activities.getTop();

        if (!response.success) {
            // Log error server-side only
            if (typeof process !== 'undefined') {
                console.error('Failed to fetch activities:', response.error_message);
            }
            return {
                activities: [],
                error: response.error_message || 'Failed to load activities'
            };
        }

        // PaginatedResponse has a data property that contains the array
        const activities = response?.data || [];

        // Parse images JSON if stored as string
        const parsedActivities = activities.map((activity: any) => ({
            ...activity,
            images: typeof activity.images === 'string' ?
                (activity.images ? JSON.parse(activity.images) : []) :
                (activity.images || [])
        }));

        return {
            activities: parsedActivities,
            error: null
        };
    } catch (error) {
        // Handle network errors
        if (typeof process !== 'undefined') {
            console.error('Network error fetching activities:', error);
        }
        return {
            activities: [],
            error: 'Unable to connect to the server'
        };
    }
});

export default component$(() => {
    const homeData = useHomeData();
    const t = inlineTranslate();
    const loc = useLocation();

    return (
        <>
            {/* Hero Section */}
            <div class="relative">
                <div class="mx-auto max-w-7xl">
                    <div class="relative z-10 pt-14 lg:w-full lg:max-w-2xl">
                        <svg
                            class="absolute inset-y-0 right-8 hidden h-full w-80 translate-x-1/2 transform fill-white lg:block"
                            viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                            <polygon points="0,0 90,0 50,100 0,100"/>
                        </svg>

                        <div class="relative px-6 py-32 sm:py-40 lg:px-8 lg:py-56 lg:pr-0">
                            <div class="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
                                <div class="hidden sm:mb-10 sm:flex">
                                    <div
                                        class="relative rounded-full px-3 py-1 text-sm/6 text-gray-500 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                                        {t('home.hero.badge@@Your Gateway to Paradise')}
                                        <a href={`/${loc.params.lang}/about`}
                                           class="font-semibold whitespace-nowrap text-secondary">
                                            <span class="absolute inset-0" aria-hidden="true"></span>
                                            {t('home.hero.badgeCta@@Learn More')}
                                            <span aria-hidden="true">&rarr;</span>
                                        </a>
                                    </div>
                                </div>
                                <h1 class="text-5xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-7xl">
                                    {t('home.hero.title@@Trip Planning Made Easy')}
                                </h1>
                                <p class="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
                                    {t('home.hero.description@@Plan your perfect Maldives vacation with our easy-to-use trip planner. Explore top activities, find the best accommodations, and create a personalized itinerary.')}
                                </p>
                                <div class="mt-10 flex items-center gap-x-6">
                                    <a href={`/${loc.params.lang}/activities`}
                                       class="rounded-md bg-secondary px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary">
                                        {t('home.hero.cta.primary@@Explore Activities')}
                                    </a>
                                    <a href="#services" class="text-sm/6 font-semibold text-gray-900">
                                        {t('home.hero.cta.secondary@@View Services')}
                                        <span aria-hidden="true">→</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                    <img
                        class="aspect-3/2 object-cover lg:aspect-auto lg:size-full"
                        src="/assets/images/cover.jpeg"
                        alt="Beautiful Maldives beach and ocean view"
                        width="1920"
                        height="1280"
                        loading="eager"
                    />
                </div>
            </div>

            {/* Services Section */}
            <div id="services" class="bg-white py-24 sm:py-32">
                <div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
                    <h2 class="text-center text-base/7 font-semibold text-secondary">
                        {t('home.services.label@@Services')}
                    </h2>
                    <p class="mx-auto mt-2 max-w-lg text-center text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
                        {t('home.services.title@@Everything you need to visit the Maldives')}
                    </p>
                    <p class="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-600">
                        {t('home.services.description@@We provide comprehensive services to make your Maldives journey seamless and unforgettable')}
                    </p>
                    <div class="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
                        {/* Imuga Form Filling */}
                        <div class="relative lg:row-span-2">
                            <div class="absolute inset-px rounded-lg bg-white lg:rounded-l-[2rem]"></div>
                            <div
                                class="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
                                <div class="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                                    <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                                        {t('home.services.imuga.title@@Imuga Form Filling')}
                                    </p>
                                    <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                                        {t('home.services.imuga.description@@We help you fill the Imuga form for your visa application, ensuring a smooth entry process.')}
                                    </p>
                                </div>
                                <div
                                    class="@container relative min-h-[30rem] w-full grow max-lg:mx-auto max-lg:max-w-sm">
                                    <div
                                        class="absolute inset-x-10 top-10 bottom-0 overflow-hidden rounded-t-[12cqw] border-x-[3cqw] border-t-[3cqw] border-gray-700 bg-gray-900 shadow-2xl">
                                        <div
                                            class="size-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <svg class="w-32 h-32 text-white opacity-50" fill="none"
                                                 stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                class="pointer-events-none absolute inset-px rounded-lg ring-1 shadow-sm ring-black/5 lg:rounded-l-[2rem]"></div>
                        </div>
                        {/* Tourist SIM Card */}
                        <div class="relative max-lg:row-start-1">
                            <div class="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]"></div>
                            <div
                                class="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                                <div class="px-8 pt-8 sm:px-10 sm:pt-10">
                                    <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                                        {t('home.services.sim.title@@Tourist SIM Card')}
                                    </p>
                                    <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                                        {t('home.services.sim.description@@Get best eSIM deals from local providers for your Maldives trip. Stay connected throughout your vacation.')}
                                    </p>
                                </div>
                                <div
                                    class="flex flex-1 items-center justify-center px-8 max-lg:pt-10 max-lg:pb-12 sm:px-10 lg:pb-2">
                                    <div
                                        class="w-full max-lg:max-w-xs bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-8 flex items-center justify-center">
                                        <svg class="w-24 h-24 text-white" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div
                                class="pointer-events-none absolute inset-px rounded-lg ring-1 shadow-sm ring-black/5 max-lg:rounded-t-[2rem]"></div>
                        </div>
                        {/* Airport Fast Tracking */}
                        <div class="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
                            <div class="absolute inset-px rounded-lg bg-white"></div>
                            <div
                                class="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)]">
                                <div class="px-8 pt-8 sm:px-10 sm:pt-10">
                                    <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                                        {t('home.services.fastTrack.title@@Airport Fast Tracking')}
                                    </p>
                                    <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                                        {t('home.services.fastTrack.description@@Get fast tracked through immigration and customs at the airport. Save time and start your vacation sooner.')}
                                    </p>
                                </div>
                                <div class="@container flex flex-1 items-center justify-center max-lg:py-6 lg:pb-2">
                                    <div
                                        class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 flex items-center justify-center">
                                        <svg class="w-20 h-20 text-white" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                  d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div
                                class="pointer-events-none absolute inset-px rounded-lg ring-1 shadow-sm ring-black/5"></div>
                        </div>
                        {/* Domestic Transport Booking */}
                        <div class="relative lg:row-span-2">
                            <div
                                class="absolute inset-px rounded-lg bg-white max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
                            <div
                                class="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
                                <div class="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                                    <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                                        {t('home.services.transport.title@@Domestic Transport Booking')}
                                    </p>
                                    <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                                        {t('home.services.transport.description@@Book your domestic transport in Maldives with ease. Speedboats, seaplanes, and ferries all in one place.')}
                                    </p>
                                </div>
                                <div class="relative min-h-[30rem] w-full grow flex items-center justify-center p-10">
                                    <div
                                        class="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                                        <svg class="w-32 h-32 text-white opacity-75" fill="none" stroke="currentColor"
                                             viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div
                                class="pointer-events-none absolute inset-px rounded-lg ring-1 shadow-sm ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activities Section */}
            <div class="bg-gray-50 py-24 sm:py-32">
                <div class="mx-auto max-w-7xl px-6 lg:px-8">
                    <div class="mx-auto max-w-2xl text-center">
                        <h2 class="text-base/7 font-semibold text-secondary">{t('home.activities.label@@Explore')}</h2>
                        <p class="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
                            {t('home.activities.title@@Top Activities in The Maldives')}
                        </p>
                        <p class="mt-6 text-lg text-gray-600">
                            {t('home.activities.description@@Discover amazing experiences and adventures in paradise')}
                        </p>
                    </div>

                    {homeData.value.error ? (
                        <div class="mt-16">
                            <ErrorState
                                title={t('home.activities.error.title@@Unable to load activities')}
                                message={homeData.value.error}
                                variant="warning"
                            />
                        </div>
                    ) : homeData.value.activities.length > 0 ? (
                        <div class="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {homeData.value.activities.map((activity: any) => (
                                <ActivityCard key={activity.id} activity={activity} locale={loc.params.lang}/>
                            ))}
                        </div>
                    ) : (
                        <div class="mt-16 text-center">
                            <div
                                class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <span class="text-4xl">🏝️</span>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">
                                {t('home.activities.noActivities.title@@No activities available yet')}
                            </h3>
                            <p class="text-gray-500">
                                {t('home.activities.noActivities.description@@Amazing activities are coming soon. Check back later!')}
                            </p>
                        </div>
                    )}

                    {/* View All Activities Button */}
                    {homeData.value.activities.length > 0 && (
                        <div class="mt-12 text-center">
                            <Link
                                href={`/${loc.params.lang}/activities`}
                                class="inline-flex items-center gap-2 rounded-md bg-secondary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                            >
                                {t('home.activities.viewAll@@View All Activities')}
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                     aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                          d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                                </svg>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Partners Section - Hidden until real partners are added */}
            {/*
            <div class="bg-white py-24 sm:py-32">
                <div class="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 class="text-center text-base/7 font-semibold text-secondary">
                        {t('home.partners.label@@Partners')}
                    </h2>
                    <p class="mx-auto mt-2 max-w-lg text-center text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
                        {t('home.partners.title@@Trusted by travelers worldwide')}
                    </p>
                    <p class="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-600">
                        {t('home.partners.description@@Join thousands of satisfied customers who have explored the Maldives with us')}
                    </p>
                </div>
            </div>
            */}
        </>
    );
});

const ActivityCard = component$<{ activity: any; locale: string }>(({activity, locale}) => {
    const t = inlineTranslate();

    // Get the first image or use placeholder
    const image = activity.images && activity.images.length > 0
        ? activity.images[0]
        : '/assets/images/cover.jpeg';

    // Truncate description
    const truncatedDescription = activity.seo_metadata.description && activity.seo_metadata.description.length > 120
        ? activity.seo_metadata.description.substring(0, 120) + '...'
        : activity.seo_metadata.description;

    // Create activity URL with current locale
    const activityUrl = `/${locale}/activities/${activity.slug}`;

    return (
        <Link
            href={activityUrl}>
            <div
                class="group relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-lg hover:ring-gray-300 transition-all duration-200">
                {/* Activity Image */}
                <div class="aspect-[4/3] overflow-hidden rounded-t-2xl bg-gray-100 relative">
                    <img
                        src={image}
                        alt={activity.title || 'Maldives activity'}
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        width="400"
                        height="300"
                        loading="lazy"
                        decoding="async"
                    />
                    {/* Category Badge */}
                    {activity.category && (
                        <div
                            class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                            {activity.category}
                        </div>
                    )}
                    {/* Rating Badge */}
                    {activity.rating && (
                        <div
                            class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                            <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            {activity.rating}
                        </div>
                    )}
                </div>

                {/* Activity Content */}
                <div class="p-6">
                    <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-secondary transition-colors">
                        {activity.seo_metadata.title}
                    </h3>

                    {activity.location && (
                        <div class="flex items-center gap-1 text-sm text-gray-500 mb-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            {activity.location}
                        </div>
                    )}

                    <p class="text-gray-600 mb-4 leading-relaxed">
                        {truncatedDescription || 'Discover this amazing activity in the Maldives'}
                    </p>

                    {/* Activity Details */}
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-4 text-sm text-gray-500">
                            {activity.duration && (
                                <div class="flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    {activity.duration}
                                </div>
                            )}
                            {activity.reviews_count && activity.reviews_count > 0 && (
                                <div class="flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                    {activity.reviews_count} reviews
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Price and CTA */}
                    <div class="flex items-center justify-between">
                        <div class="text-left">
                            <p class="text-2xl font-bold text-gray-900">
                                {activity.base_price}
                                <span class="text-base font-normal text-gray-500"></span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});

export const head: DocumentHead = {
    title: "Rihigo - Your Complete Maldives Travel Guide & Trip Planner",
    meta: [
        {
            name: "description",
            content: "Plan your perfect Maldives vacation with Rihigo. Explore top activities, book tours, find accommodations, and get expert travel services including Imuga form assistance, eSIM cards, and airport fast-track.",
        },
        {
            name: "keywords",
            content: "Maldives travel, Maldives activities, Maldives trip planner, Maldives tours, Imuga form, Maldives eSIM, Maldives vacation, island hopping Maldives, water sports Maldives",
        },
        // Open Graph meta tags
        {
            property: "og:title",
            content: "Rihigo - Your Complete Maldives Travel Guide",
        },
        {
            property: "og:description",
            content: "Discover amazing activities and plan your dream Maldives vacation. From snorkeling to island hopping, we help you create unforgettable memories.",
        },
        {
            property: "og:type",
            content: "website",
        },
        {
            property: "og:url",
            content: "https://rihigo.com",
        },
        {
            property: "og:image",
            content: "https://rihigo.com/assets/images/og-image.jpg",
        },
        {
            property: "og:locale",
            content: "en_US",
        },
        {
            property: "og:locale:alternate",
            content: "it_IT",
        },
        // Twitter Card meta tags
        {
            name: "twitter:card",
            content: "summary_large_image",
        },
        {
            name: "twitter:title",
            content: "Rihigo - Your Complete Maldives Travel Guide",
        },
        {
            name: "twitter:description",
            content: "Plan your perfect Maldives vacation with our comprehensive travel guide. Explore activities, book tours, and get expert travel assistance.",
        },
        {
            name: "twitter:image",
            content: "https://rihigo.com/assets/images/og-image.jpg",
        },
        // Additional SEO meta tags
        {
            name: "robots",
            content: "index, follow",
        },
        {
            name: "author",
            content: "Rihigo",
        },
    ],
};
