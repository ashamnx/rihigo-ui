import {component$, useSignal} from '@builder.io/qwik';
import {routeLoader$, useLocation, Link, type DocumentHead} from '@builder.io/qwik-city';
import {getActivityBySlug} from '~/services/activity-api';
import {PageRenderer} from '~/components/page-builder/PageRenderer';
import {ErrorState} from '~/components/error-state/error-state';
import {inlineTranslate} from 'qwik-speak';
import {
    generateActivitySchema,
    generateBreadcrumbSchema,
    generateHreflangLinks,
    serializeSchema
} from '~/utils/seo';
import {structuredDataScript} from '~/components/seo/StructuredData';

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

export default component$(() => {
    const activityDataResponse = useActivityData();
    const location = useLocation();
    const t = inlineTranslate();
    const lang = location.params.lang || 'en';
    const selectedPackage = useSignal<string | null>(null);

    // Handle error state
    if (!activityDataResponse.value.success || !activityDataResponse.value.data) {
        return (
            <div class="min-h-screen bg-gray-50">
                <div class="container mx-auto py-3 max-w-7xl px-6 lg:px-8">
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

    return (
        <div class="min-h-screen bg-white">
            {/* Breadcrumbs */}
            <div class="bg-gray-50 border-b border-gray-200">
                <div class="container mx-auto py-3 max-w-7xl px-6 lg:px-8">
                    <nav class="flex" aria-label="Breadcrumb">
                        <ol class="inline-flex items-center space-x-1 md:space-x-3" itemScope itemType="https://schema.org/BreadcrumbList">
                            <li class="inline-flex items-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <Link href={`/${lang}`} class="text-sm text-gray-700 hover:text-primary" itemProp="item">
                                    <span itemProp="name">{t('breadcrumb.home@@Home')}</span>
                                </Link>
                                <meta itemProp="position" content="1" />
                            </li>
                            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <div class="flex items-center">
                                    <svg class="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                                    </svg>
                                    <Link href={`/${lang}/activities`} class="text-sm text-gray-700 hover:text-primary" itemProp="item">
                                        <span itemProp="name">{t('breadcrumb.activities@@Activities')}</span>
                                    </Link>
                                    <meta itemProp="position" content="2" />
                                </div>
                            </li>
                            <li aria-current="page" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                                <div class="flex items-center">
                                    <svg class="w-3 h-3 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                                    </svg>
                                    <span class="text-sm text-gray-500 truncate max-w-xs" itemProp="name">{title}</span>
                                    <meta itemProp="position" content="3" />
                                </div>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Activity Title Section with H1 */}
            <div class="container mx-auto py-6 max-w-7xl px-6 lg:px-8">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 class="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
                        {activity.island && (
                            <div class="flex items-center mt-2 text-gray-600">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span>{activity.island.name}{activity.island.atoll && `, ${activity.island.atoll.name}`}</span>
                            </div>
                        )}
                    </div>
                    <div class="flex items-center gap-4">
                        {activity.category && (
                            <span class="badge badge-primary badge-lg">{activity.category.name}</span>
                        )}
                        {activity.review_count > 0 && (
                            <div class="flex items-center gap-1 text-gray-700">
                                <svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span class="font-semibold">{activity.review_score.toFixed(1)}</span>
                                <span class="text-gray-500">({activity.review_count} {t('activity.reviews@@reviews')})</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hero Section with Image */}
            {/*<div class="relative h-96 md:h-[500px] overflow-hidden bg-gray-900">*/}
            {/*    <img*/}
            {/*        src={mainImage}*/}
            {/*        alt={title}*/}
            {/*        class="w-full h-full object-cover opacity-90"*/}
            {/*        width="1920"*/}
            {/*        height="500"*/}
            {/*    />*/}
            {/*    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>*/}
            {/*    <div class="absolute bottom-0 left-0 right-0 p-6 md:p-12">*/}
            {/*        <div class="container mx-auto py-3 max-w-7xl px-6 lg:px-8">*/}
            {/*            <div class="flex items-center gap-2 mb-3">*/}
            {/*                {activity.category && (*/}
            {/*                    <span class="badge badge-primary badge-lg">{activity.category.name}</span>*/}
            {/*                )}*/}
            {/*                {activity.review_count > 0 && (*/}
            {/*                    <div class="flex items-center gap-1 text-white text-sm">*/}
            {/*                        <svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">*/}
            {/*                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>*/}
            {/*                        </svg>*/}
            {/*                        <span class="font-semibold">{activity.review_score.toFixed(1)}</span>*/}
            {/*                        <span class="text-white/80">({activity.review_count} {t('activity.reviews@@reviews')})</span>*/}
            {/*                    </div>*/}
            {/*                )}*/}
            {/*            </div>*/}
            {/*            <h1 class="text-4xl md:text-5xl font-bold text-white mb-3">{title}</h1>*/}
            {/*            {activity.island && (*/}
            {/*                <div class="flex items-center text-white/90 text-lg">*/}
            {/*                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
            {/*                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>*/}
            {/*                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>*/}
            {/*                    </svg>*/}
            {/*                    {activity.island.name}*/}
            {/*                    {activity.island.atoll && `, ${activity.island.atoll.name}`}*/}
            {/*                </div>*/}
            {/*            )}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}

            {/* Main Content Area */}
            <div class="container mx-auto py-3 max-w-7xl px-6 lg:px-8 mt-16">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div class="lg:col-span-2 space-y-8">
                        {/* Description Section */}
                        {/*{description && (*/}
                        {/*    <div class="prose max-w-none">*/}
                        {/*        <h2 class="text-2xl font-bold mb-4">{t('activity.about@@About This Activity')}</h2>*/}
                        {/*        <p class="text-gray-700 leading-relaxed">{description}</p>*/}
                        {/*    </div>*/}
                        {/*)}*/}

                        {/* Custom Page Layout (if exists) */}
                        {activity.page_layout && activity.page_layout.length > 0 && (
                            <PageRenderer components={activity.page_layout} activity={activity} />
                        )}

                        {/* Image Gallery (if multiple images) */}
                        {images.length > 1 && (
                            <div class="border-t border-gray-200 pt-8">
                                <h2 class="text-2xl font-bold mb-4">{t('activity.gallery@@Photo Gallery')}</h2>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {images.slice(1, 7).map((img: string, idx: number) => (
                                        <div key={idx} class="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                            <img src={img} alt={`${title} ${idx + 1}`} class="w-full h-full object-cover hover:scale-105 transition-transform" width={400} height={225} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location Map Section */}
                        {activity.island && (
                            <div class="border-t border-gray-200 pt-8">
                                <h2 class="text-2xl font-bold mb-4">{t('activity.location@@Location')}</h2>
                                <div class="bg-gray-50 rounded-lg p-6">
                                    <div class="flex items-start gap-4">
                                        <div class="bg-indigo-100 p-3 rounded-lg">
                                            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-semibold mb-1">{activity.island.name}</h3>
                                            <p class="text-gray-600">{activity.island.atoll?.name}</p>
                                            <span class="inline-block mt-2 text-sm px-3 py-1 bg-white rounded-full border border-gray-300">
                                                {activity.island.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Booking Sidebar */}
                    <div class="lg:col-span-1">
                        <div class="sticky top-4">
                            {/* Package Selection Card */}
                            {activity.packages && activity.packages.length > 0 ? (
                                <div class="card bg-white shadow-xl shadow-primary/20 border-2 border-primary">
                                    <div class="card-body">
                                        <h3 class="text-xl font-bold mb-4">{t('activity.choosePackage@@Choose Your Package')}</h3>

                                        <div class="space-y-3">
                                            {activity.packages.map((pkg) => {
                                                const packageName = pkg.translations?.[lang]?.name || pkg.name_internal;
                                                const packageDesc = pkg.translations?.[lang]?.description || '';
                                                const price = pkg.prices?.find((p) => p.currency_code === 'USD');
                                                const isSelected = selectedPackage.value === pkg.id;

                                                return (
                                                    <div
                                                        key={pkg.id}
                                                        class={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                                            isSelected ? 'border-primary bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                                                        }`}
                                                        onClick$={() => selectedPackage.value = pkg.id}
                                                    >
                                                        <div class="flex justify-between items-start mb-2">
                                                            <h4 class="font-semibold text-gray-900">{packageName}</h4>
                                                            {pkg.is_recommended && (
                                                                <span class="badge badge-success badge-sm">
                                                                    {t('activity.recommended@@Recommended')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {packageDesc && (
                                                            <p class="text-sm text-gray-600 mb-3">{packageDesc}</p>
                                                        )}

                                                        {/* Package details */}
                                                        {pkg.options_config && (
                                                            <div class="text-xs text-gray-500 space-y-1 mb-3">
                                                                {pkg.options_config.duration && (
                                                                    <div class="flex items-center gap-1">
                                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                                        </svg>
                                                                        {pkg.options_config.duration} {t('activity.minutes@@minutes')}
                                                                    </div>
                                                                )}
                                                                {(pkg.options_config.min_pax || pkg.options_config.max_pax) && (
                                                                    <div class="flex items-center gap-1">
                                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                                                        </svg>
                                                                        {pkg.options_config.min_pax || 1}-{pkg.options_config.max_pax || '∞'} {t('activity.people@@people')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {price && (
                                                            <div class="flex items-baseline gap-2">
                                                                <span class="text-2xl font-bold text-primary">
                                                                    {price.currency?.symbol || '$'}{price.amount.toFixed(2)}
                                                                </span>
                                                                <span class="text-sm text-gray-500">
                                                                    / {t('activity.person@@person')}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div class="divider"></div>

                                        <Link
                                            href={`/${lang}/booking/${activity.slug}${selectedPackage.value ? `?package=${selectedPackage.value}` : ''}`}
                                            class="btn btn-primary btn-lg w-full"
                                        >
                                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                            </svg>
                                            {t('activity.bookNow@@Book Now')}
                                        </Link>

                                    </div>
                                </div>
                            ) : (
                                <div class="card bg-base-100 shadow-xl border border-gray-200">
                                    <div class="card-body">
                                        <p class="text-center text-gray-500">{t('activity.noPackages@@No packages available for this activity yet.')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = ({resolveValue, params}) => {
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
