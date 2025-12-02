import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$, useLocation, Link, type DocumentHead } from '@builder.io/qwik-city';
import { getActivityBySlug } from '~/services/activity-api';
import { PageRenderer } from '~/components/page-builder/PageRenderer';
import { ErrorState } from '~/components/error-state/error-state';
import { inlineTranslate } from 'qwik-speak';
import {
    generateActivitySchema,
    generateBreadcrumbSchema,
    generateHreflangLinks,
} from '~/utils/seo';
import { structuredDataScript } from '~/components/seo/StructuredData';

export const useActivityData = routeLoader$(async (requestEvent) => {
    const slug = requestEvent.params.slug;
    const lang = requestEvent.params.lang || 'en';

    try {
        const activity = await getActivityBySlug(slug, lang);
        return {
            success: true,
            data: activity,
            error: null
        };
    } catch (error) {
        console.error('Failed to load activity:', error);
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Activity not found'
        };
    }
});

// Section definitions for navigation
const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'packages', label: 'Packages' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'location', label: 'Location' },
];

export default component$(() => {
    const activityDataResponse = useActivityData();
    const location = useLocation();
    const t = inlineTranslate();
    const lang = location.params.lang || 'en';
    const selectedPackage = useSignal<string | null>(null);
    const activeSection = useSignal('overview');
    const isScrolled = useSignal(false);

    // Track scroll for sticky header effect
    useVisibleTask$(() => {
        const handleScroll = () => {
            isScrolled.value = window.scrollY > 100;
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    });

    // Handle error state
    if (!activityDataResponse.value.success || !activityDataResponse.value.data) {
        return (
            <div class="min-h-screen bg-base-100">
                <div class="container mx-auto py-16 max-w-7xl px-4 sm:px-6 lg:px-8">
                    <ErrorState
                        title={t('activity.error.title@@Activity Not Found')}
                        message={activityDataResponse.value.error || t('activity.error.message@@The activity you\'re looking for doesn\'t exist or has been removed.')}
                    >
                        <Link href={`/${lang}/activities`} class="btn btn-primary">
                            {t('activity.error.backToActivities@@Back to Activities')}
                        </Link>
                    </ErrorState>
                </div>
            </div>
        );
    }

    const activity = activityDataResponse.value.data;
    const title = activity.translations?.[lang]?.title || activity.seo_metadata.title || activity.slug;
    const description = activity.translations?.[lang]?.description || activity.seo_metadata.description || '';

    // Get images from activity
    const images = Array.isArray(activity.images) ? activity.images :
                   typeof activity.images === 'string' && activity.images ? JSON.parse(activity.images) : [];
    const mainImage = images[0] || '/assets/images/cover.jpeg';

    // Filter available sections based on content
    const availableSections = sections.filter(section => {
        if (section.id === 'gallery') return images.length > 1;
        if (section.id === 'location') return !!activity.island;
        if (section.id === 'packages') return activity.packages && activity.packages.length > 0;
        return true;
    });

    return (
        <div class="min-h-screen bg-base-100">
            {/* Hero Section */}
            <div class="relative h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
                <img
                    src={mainImage}
                    alt={title}
                    class="w-full h-full object-cover"
                    width="1920"
                    height="600"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                {/* Hero Content */}
                <div class="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                    <div class="container mx-auto max-w-7xl">
                        {/* Breadcrumb */}
                        <nav class="mb-4" aria-label="Breadcrumb">
                            <ol class="flex items-center gap-2 text-sm text-white/70" itemScope itemType="https://schema.org/BreadcrumbList">
                                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                    <Link href={`/${lang}`} class="hover:text-white transition-colors" itemProp="item">
                                        <span itemProp="name">{t('breadcrumb.home@@Home')}</span>
                                    </Link>
                                    <meta itemProp="position" content="1" />
                                </li>
                                <li class="text-white/50">/</li>
                                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                    <Link href={`/${lang}/activities`} class="hover:text-white transition-colors" itemProp="item">
                                        <span itemProp="name">{t('breadcrumb.activities@@Activities')}</span>
                                    </Link>
                                    <meta itemProp="position" content="2" />
                                </li>
                                <li class="text-white/50">/</li>
                                <li class="text-white truncate max-w-[200px]" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                    <span itemProp="name">{title}</span>
                                    <meta itemProp="position" content="3" />
                                </li>
                            </ol>
                        </nav>

                        {/* Category Badge */}
                        {activity.category && (
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm mb-3">
                                <span>{activity.category.icon}</span>
                                {activity.category.name}
                            </span>
                        )}

                        {/* Title */}
                        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">{title}</h1>

                        {/* Meta Info */}
                        <div class="flex flex-wrap items-center gap-4 text-white/90">
                            {activity.island && (
                                <div class="flex items-center gap-1.5">
                                    <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <span>{activity.island.name}{activity.island.atoll && `, ${activity.island.atoll.name}`}</span>
                                </div>
                            )}
                            {activity.review_count > 0 && (
                                <div class="flex items-center gap-1.5">
                                    <svg class="size-5 text-yellow-400 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                    </svg>
                                    <span class="font-semibold">{activity.review_score.toFixed(1)}</span>
                                    <span class="text-white/70">({activity.review_count})</span>
                                </div>
                            )}
                            {activity.min_price_usd > 0 && (
                                <div class="flex items-center gap-1.5">
                                    <span class="text-white/70">{t('activity.from@@From')}</span>
                                    <span class="font-bold text-lg">${activity.min_price_usd.toFixed(0)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Navigation - sits below fixed header (top-16 = 64px) */}
            <div class={`sticky top-16 z-40 bg-base-100/95 backdrop-blur-sm border-b border-base-200 transition-all ${isScrolled.value ? 'shadow-md' : ''}`}>
                <div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Condensed Title Bar - appears on scroll */}
                    <div class={`flex items-center justify-between gap-4 overflow-hidden transition-all ${isScrolled.value ? 'h-12 opacity-100' : 'h-0 opacity-0'}`}>
                        <div class="flex items-center gap-3 min-w-0">
                            <h2 class="font-semibold truncate">{title}</h2>
                            {activity.review_count > 0 && (
                                <div class="hidden sm:flex items-center gap-1 text-sm flex-shrink-0">
                                    <svg class="size-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                    </svg>
                                    <span>{activity.review_score.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                        <div class="flex items-center gap-3 flex-shrink-0">
                            {activity.min_price_usd > 0 && (
                                <div class="hidden sm:block text-right">
                                    <span class="text-xs text-base-content/60">{t('activity.from@@From')}</span>
                                    <span class="font-bold text-primary ml-1">${activity.min_price_usd.toFixed(0)}</span>
                                </div>
                            )}
                            <Link
                                href={`/${lang}/booking/${activity.slug}${selectedPackage.value ? `?package=${selectedPackage.value}` : ''}`}
                                class="btn btn-primary btn-sm"
                            >
                                {t('activity.bookNow@@Book Now')}
                            </Link>
                        </div>
                    </div>

                    {/* Section Nav */}
                    <div class="flex items-center h-11">
                        <nav class="flex items-center gap-1 overflow-x-auto scrollbar-none">
                            {availableSections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    class={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                                        activeSection.value === section.id
                                            ? 'bg-primary text-primary-content'
                                            : 'text-base-content/70 hover:bg-base-200'
                                    }`}
                                    onClick$={() => activeSection.value = section.id}
                                >
                                    {section.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div class="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Left Column - Main Content */}
                    <div class="lg:col-span-2 space-y-12">
                        {/* Overview Section */}
                        <section id="overview" class="scroll-mt-40">
                            {description && (
                                <div class="prose prose-lg max-w-none">
                                    <h2 class="text-2xl font-bold text-base-content mb-4">
                                        {t('activity.about@@About This Activity')}
                                    </h2>
                                    <p class="text-base-content/80 leading-relaxed">{description}</p>
                                </div>
                            )}

                            {/* Quick Facts */}
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                                {activity.category && (
                                    <div class="bg-base-200 rounded-xl p-4 text-center">
                                        <div class="text-2xl mb-1">{activity.category.icon}</div>
                                        <div class="text-xs text-base-content/60 uppercase tracking-wide">{t('activity.category@@Category')}</div>
                                        <div class="font-medium mt-1">{activity.category.name}</div>
                                    </div>
                                )}
                                {activity.review_count > 0 && (
                                    <div class="bg-base-200 rounded-xl p-4 text-center">
                                        <div class="text-2xl mb-1">
                                            <svg class="size-6 mx-auto text-yellow-500 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                        </div>
                                        <div class="text-xs text-base-content/60 uppercase tracking-wide">{t('activity.rating@@Rating')}</div>
                                        <div class="font-medium mt-1">{activity.review_score.toFixed(1)} ({activity.review_count})</div>
                                    </div>
                                )}
                                {activity.island && (
                                    <div class="bg-base-200 rounded-xl p-4 text-center">
                                        <div class="text-2xl mb-1">
                                            <svg class="size-6 mx-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                            </svg>
                                        </div>
                                        <div class="text-xs text-base-content/60 uppercase tracking-wide">{t('activity.location@@Location')}</div>
                                        <div class="font-medium mt-1 truncate">{activity.island.name}</div>
                                    </div>
                                )}
                                {activity.min_price_usd > 0 && (
                                    <div class="bg-base-200 rounded-xl p-4 text-center">
                                        <div class="text-2xl mb-1">
                                            <svg class="size-6 mx-auto text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                        <div class="text-xs text-base-content/60 uppercase tracking-wide">{t('activity.from@@From')}</div>
                                        <div class="font-medium mt-1">${activity.min_price_usd.toFixed(0)} USD</div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Page Builder Content */}
                        {activity.page_layout && activity.page_layout.length > 0 && (
                            <PageRenderer components={activity.page_layout} activity={activity} />
                        )}

                        {/* Packages Section (Mobile) */}
                        {activity.packages && activity.packages.length > 0 && (
                            <section id="packages" class="scroll-mt-32 lg:hidden">
                                <h2 class="text-2xl font-bold text-base-content mb-6">
                                    {t('activity.choosePackage@@Choose Your Package')}
                                </h2>
                                <div class="space-y-4">
                                    {activity.packages.map((pkg) => {
                                        const packageName = pkg.translations?.[lang]?.name || (pkg.options_config as any)?.title || pkg.name_internal;
                                        const packageDesc = pkg.translations?.[lang]?.description || (pkg.options_config as any)?.description || '';
                                        // All prices are stored in USD (base currency)
                                        // Check both pkg.prices (database) and options_config.pricingTiers
                                        const pricingTiers = (pkg.options_config as any)?.pricingTiers || [];
                                        const dbPrice = pkg.prices?.[0];
                                        const priceAmount = dbPrice?.amount ?? pricingTiers[0]?.price;
                                        const inclusions = (pkg.options_config as any)?.inclusions || [];
                                        const duration = pkg.options_config?.duration || (pkg.options_config as any)?.bookingOptions?.duration;
                                        const isSelected = selectedPackage.value === pkg.id;

                                        return (
                                            <div
                                                key={pkg.id}
                                                class={`card bg-base-200 cursor-pointer transition-all ${
                                                    isSelected ? 'ring-2 ring-primary' : 'hover:bg-base-300'
                                                }`}
                                                onClick$={() => selectedPackage.value = pkg.id}
                                            >
                                                <div class="card-body p-4">
                                                    <div class="flex justify-between items-start">
                                                        <div class="flex-1">
                                                            <div class="flex items-center gap-2">
                                                                <h3 class="font-semibold">{packageName}</h3>
                                                                {pkg.is_recommended && (
                                                                    <span class="badge badge-success badge-sm">
                                                                        {t('activity.recommended@@Best Value')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {packageDesc && (
                                                                <p class="text-sm text-base-content/60 mt-1">{packageDesc}</p>
                                                            )}

                                                            {/* Package details */}
                                                            {duration && (
                                                                <div class="flex items-center gap-1 mt-2 text-xs text-base-content/50">
                                                                    <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                                    </svg>
                                                                    {duration} min
                                                                </div>
                                                            )}

                                                            {/* Inclusions preview */}
                                                            {inclusions.length > 0 && (
                                                                <ul class="mt-2 text-xs text-base-content/60 space-y-1">
                                                                    {inclusions.slice(0, 3).map((item: string, idx: number) => (
                                                                        <li key={idx} class="flex items-center gap-1">
                                                                            <svg class="size-3 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                                                            </svg>
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                    {inclusions.length > 3 && (
                                                                        <li class="text-base-content/40">+{inclusions.length - 3} more</li>
                                                                    )}
                                                                </ul>
                                                            )}
                                                        </div>
                                                        <div class="text-right flex-shrink-0">
                                                            {priceAmount !== undefined && (
                                                                <>
                                                                    <div class="text-xs text-base-content/50">
                                                                        {t('activity.from@@from')}
                                                                    </div>
                                                                    <div class="text-xl font-bold text-primary">
                                                                        ${priceAmount.toFixed(0)}
                                                                    </div>
                                                                </>
                                                            )}
                                                            {/* Show all pricing tiers */}
                                                            {pricingTiers.length > 1 && (
                                                                <div class="mt-1 text-xs text-base-content/50">
                                                                    {pricingTiers.slice(1, 3).map((tier: any, idx: number) => (
                                                                        <div key={idx}>{tier.tierName}: ${tier.price}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <Link
                                    href={`/${lang}/booking/${activity.slug}${selectedPackage.value ? `?package=${selectedPackage.value}` : ''}`}
                                    class="btn btn-primary btn-lg w-full mt-6"
                                >
                                    {t('activity.bookNow@@Book Now')}
                                </Link>
                            </section>
                        )}

                        {/* Gallery Section */}
                        {images.length > 1 && (
                            <section id="gallery" class="scroll-mt-40">
                                <h2 class="text-2xl font-bold text-base-content mb-6">
                                    {t('activity.gallery@@Photo Gallery')}
                                </h2>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {images.slice(0, 6).map((img: string, idx: number) => (
                                        <div
                                            key={idx}
                                            class={`aspect-video rounded-xl overflow-hidden bg-base-200 ${idx === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-video' : ''}`}
                                        >
                                            <img
                                                src={img}
                                                alt={`${title} ${idx + 1}`}
                                                class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                width={idx === 0 ? 800 : 400}
                                                height={idx === 0 ? 600 : 225}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Location Section */}
                        {activity.island && (
                            <section id="location" class="scroll-mt-40">
                                <h2 class="text-2xl font-bold text-base-content mb-6">
                                    {t('activity.locationTitle@@Location')}
                                </h2>
                                <div class="card bg-base-200">
                                    <div class="card-body">
                                        <div class="flex items-start gap-4">
                                            <div class="size-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <svg class="size-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 class="text-lg font-semibold">{activity.island.name}</h3>
                                                {activity.island.atoll && (
                                                    <p class="text-base-content/60">{activity.island.atoll.name} Atoll</p>
                                                )}
                                                <div class="flex items-center gap-2 mt-3">
                                                    <span class="badge badge-outline">{activity.island.type}</span>
                                                    <span class="text-sm text-base-content/50">Maldives</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column - Booking Sidebar (Desktop) */}
                    <div class="hidden lg:block lg:col-span-1">
                        <div class="sticky top-40">
                            {activity.packages && activity.packages.length > 0 ? (
                                <div class="card bg-base-100 shadow-xl border border-base-200">
                                    <div class="card-body">
                                        <h3 class="text-lg font-bold mb-4">
                                            {t('activity.selectPackage@@Select a Package')}
                                        </h3>

                                        <div class="space-y-3">
                                            {activity.packages.map((pkg) => {
                                                const packageName = pkg.translations?.[lang]?.name || (pkg.options_config as any)?.title || pkg.name_internal;
                                                const packageDesc = pkg.translations?.[lang]?.description || (pkg.options_config as any)?.description || '';
                                                // All prices are stored in USD (base currency)
                                                // Check both pkg.prices (database) and options_config.pricingTiers
                                                const pricingTiers = (pkg.options_config as any)?.pricingTiers || [];
                                                const dbPrice = pkg.prices?.[0];
                                                const priceAmount = dbPrice?.amount ?? pricingTiers[0]?.price;
                                                const duration = pkg.options_config?.duration || (pkg.options_config as any)?.bookingOptions?.duration;
                                                const maxPax = pkg.options_config?.max_pax || (pkg.options_config as any)?.bookingOptions?.maxBookingsPerDay;
                                                const isSelected = selectedPackage.value === pkg.id;

                                                return (
                                                    <div
                                                        key={pkg.id}
                                                        class={`relative p-4 rounded-xl cursor-pointer transition-all border-2 ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-base-200 hover:border-primary/50 bg-base-100'
                                                        }`}
                                                        onClick$={() => selectedPackage.value = pkg.id}
                                                    >
                                                        {pkg.is_recommended && (
                                                            <span class="absolute -top-2 -right-2 badge badge-success badge-sm">
                                                                {t('activity.best@@Best')}
                                                            </span>
                                                        )}

                                                        <div class="flex items-start justify-between gap-3">
                                                            <div class="flex-1 min-w-0">
                                                                <h4 class="font-medium text-sm">{packageName}</h4>
                                                                {packageDesc && (
                                                                    <p class="text-xs text-base-content/60 mt-1 line-clamp-2">{packageDesc}</p>
                                                                )}

                                                                {/* Package details */}
                                                                <div class="flex flex-wrap gap-2 mt-2">
                                                                    {duration && (
                                                                        <span class="text-xs text-base-content/50 flex items-center gap-1">
                                                                            <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                                            </svg>
                                                                            {duration}m
                                                                        </span>
                                                                    )}
                                                                    {maxPax && (
                                                                        <span class="text-xs text-base-content/50 flex items-center gap-1">
                                                                            <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                            </svg>
                                                                            {maxPax} max
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Show pricing tiers */}
                                                                {pricingTiers.length > 0 && (
                                                                    <div class="mt-2 text-xs space-y-0.5">
                                                                        {pricingTiers.map((tier: any, idx: number) => (
                                                                            <div key={idx} class="flex justify-between text-base-content/60">
                                                                                <span>{tier.tierName || `Tier ${idx + 1}`}</span>
                                                                                <span class="font-medium">${tier.price}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {priceAmount !== undefined && pricingTiers.length === 0 && (
                                                                <div class="text-right flex-shrink-0">
                                                                    <div class="text-xs text-base-content/50">
                                                                        {t('activity.from@@from')}
                                                                    </div>
                                                                    <div class="text-lg font-bold text-primary">
                                                                        ${priceAmount.toFixed(0)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div class="divider my-4"></div>

                                        <Link
                                            href={`/${lang}/booking/${activity.slug}${selectedPackage.value ? `?package=${selectedPackage.value}` : ''}`}
                                            class="btn btn-primary w-full"
                                        >
                                            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                            {t('activity.bookNow@@Book Now')}
                                        </Link>

                                        <p class="text-xs text-center text-base-content/50 mt-3">
                                            {t('activity.freeCancel@@Free cancellation up to 24h before')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div class="card bg-base-200">
                                    <div class="card-body text-center">
                                        <div class="size-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
                                            <svg class="size-8 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                                            </svg>
                                        </div>
                                        <p class="text-base-content/60">
                                            {t('activity.noPackages@@No packages available yet')}
                                        </p>
                                        <p class="text-sm text-base-content/40 mt-1">
                                            {t('activity.checkBack@@Check back soon!')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Help Card */}
                            <div class="card bg-base-200 mt-4">
                                <div class="card-body p-4">
                                    <div class="flex items-center gap-3">
                                        <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <svg class="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="text-sm font-medium">{t('activity.needHelp@@Need help?')}</p>
                                            <p class="text-xs text-base-content/60">{t('activity.contactUs@@Contact our team')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Footer */}
            <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 p-4 z-50">
                <div class="flex items-center justify-between gap-4">
                    <div>
                        {activity.min_price_usd > 0 && (
                            <>
                                <span class="text-sm text-base-content/60">{t('activity.from@@From')}</span>
                                <span class="text-xl font-bold text-primary ml-1">${activity.min_price_usd.toFixed(0)}</span>
                            </>
                        )}
                    </div>
                    <Link
                        href={`/${lang}/booking/${activity.slug}${selectedPackage.value ? `?package=${selectedPackage.value}` : ''}`}
                        class="btn btn-primary flex-1 max-w-[200px]"
                    >
                        {t('activity.bookNow@@Book Now')}
                    </Link>
                </div>
            </div>

            {/* Bottom Padding for Mobile Footer */}
            <div class="h-20 lg:hidden"></div>
        </div>
    );
});

export const head: DocumentHead = ({ resolveValue, params }) => {
    const activityData = resolveValue(useActivityData);
    const lang = params.lang || 'en-US';

    if (!activityData.success || !activityData.data) {
        return {
            title: 'Activity Not Found | Rihigo',
            meta: [
                {
                    name: 'description',
                    content: 'The requested activity could not be found.',
                },
                {
                    name: 'robots',
                    content: 'noindex, nofollow',
                },
            ],
        };
    }

    const activity = activityData.data;
    const title = activity.translations?.[lang]?.title || activity.seo_metadata?.title || activity.slug;
    const description = activity.translations?.[lang]?.description || activity.seo_metadata?.description || '';
    const truncatedDescription = description.length > 155 ? description.substring(0, 152) + '...' : description;

    const images = Array.isArray(activity.images) ? activity.images :
                   typeof activity.images === 'string' && activity.images ? JSON.parse(activity.images) : [];
    const image = images[0] || 'https://rihigo.com/assets/images/cover.jpeg';
    const imageUrl = image.startsWith('http') ? image : `https://rihigo.com${image}`;

    const canonicalUrl = `https://rihigo.com/${lang}/activities/${activity.slug}`;
    const priceText = activity.min_price_usd ? ` - From $${activity.min_price_usd}` : '';

    // Generate structured data schemas
    const activitySchema = generateActivitySchema(activity, lang);
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: `https://rihigo.com/${lang}` },
        { name: 'Activities', url: `https://rihigo.com/${lang}/activities` },
        { name: title },
    ]);

    // Generate hreflang links
    const hreflangLinks = generateHreflangLinks(`/activities/${activity.slug}`);

    return {
        title: `${title}${priceText} | Rihigo`,
        meta: [
            // Primary Meta Tags
            {
                name: 'description',
                content: truncatedDescription || `Explore ${title} in the Maldives. Book this amazing experience with Rihigo.`,
            },
            {
                name: 'robots',
                content: 'index, follow, max-image-preview:large, max-snippet:-1',
            },
            {
                name: 'author',
                content: 'Rihigo',
            },

            // Open Graph / Facebook
            {
                property: 'og:type',
                content: 'product',
            },
            {
                property: 'og:url',
                content: canonicalUrl,
            },
            {
                property: 'og:title',
                content: `${title} | Rihigo Maldives`,
            },
            {
                property: 'og:description',
                content: truncatedDescription || `Discover ${title} - an unforgettable experience in the Maldives.`,
            },
            {
                property: 'og:image',
                content: imageUrl,
            },
            {
                property: 'og:image:width',
                content: '1200',
            },
            {
                property: 'og:image:height',
                content: '630',
            },
            {
                property: 'og:image:alt',
                content: `${title} - Maldives Activity`,
            },
            {
                property: 'og:locale',
                content: lang === 'it-IT' ? 'it_IT' : 'en_US',
            },
            {
                property: 'og:locale:alternate',
                content: lang === 'it-IT' ? 'en_US' : 'it_IT',
            },
            {
                property: 'og:site_name',
                content: 'Rihigo',
            },

            // Product specific OG
            ...(activity.min_price_usd ? [
                {
                    property: 'product:price:amount',
                    content: activity.min_price_usd.toString(),
                },
                {
                    property: 'product:price:currency',
                    content: 'USD',
                },
            ] : []),

            // Twitter Card
            {
                name: 'twitter:card',
                content: 'summary_large_image',
            },
            {
                name: 'twitter:url',
                content: canonicalUrl,
            },
            {
                name: 'twitter:title',
                content: title,
            },
            {
                name: 'twitter:description',
                content: truncatedDescription,
            },
            {
                name: 'twitter:image',
                content: imageUrl,
            },
            {
                name: 'twitter:image:alt',
                content: `${title} - Maldives Activity`,
            },

            // Location specific
            {
                name: 'geo.region',
                content: 'MV',
            },
            {
                name: 'geo.placename',
                content: activity.island?.name || 'Maldives',
            },
        ],
        links: [
            // Canonical URL
            {
                rel: 'canonical',
                href: canonicalUrl,
            },
            // Hreflang alternates
            ...hreflangLinks,
        ],
        scripts: [
            // TouristAttraction/Product Schema
            structuredDataScript(activitySchema),
            // Breadcrumb Schema
            structuredDataScript(breadcrumbSchema),
        ],
    };
};
