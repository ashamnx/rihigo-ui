import { $, component$, useOnDocument } from '@builder.io/qwik';
import { routeLoader$, useLocation, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import type { Activity, ActivityCategory, ActivityFilters, Atoll, Island } from '~/types/activity';
import { getActivities, getAtolls, getCategories, getIslands } from '~/services/activity-api';

export const useCategoriesData = routeLoader$(async () => {
  try {
    return await getCategories();
  } catch (error) {
    console.error('Failed to load categories:', error);
    return [] as ActivityCategory[];
  }
});

export const useAtollsData = routeLoader$(async () => {
  try {
    return await getAtolls();
  } catch (error) {
    console.error('Failed to load atolls:', error);
    return [] as Atoll[];
  }
});

export const useIslandsData = routeLoader$(async () => {
  try {
    return await getIslands();
  } catch (error) {
    console.error('Failed to load islands:', error);
    return [] as Island[];
  }
});

export const useActivitiesData = routeLoader$(async (requestEvent) => {
  // Cache headers are set by layout's onRequest based on auth status
  const url = requestEvent.url;
  const page = parseInt(url.searchParams.get('page') || '1');
  const category_id = url.searchParams.get('category_id');
  const island_id = url.searchParams.get('island_id');
  const atoll_code = url.searchParams.get('atoll_code');
  const lang = requestEvent.params.lang || 'en';

  const filters: ActivityFilters = {
    page,
    page_size: 12,
    lang,
  };

  if (category_id) filters.category_id = parseInt(category_id);
  if (island_id) filters.island_id = parseInt(island_id);
  if (atoll_code) filters.atoll_code = atoll_code;

  try {
    const result = await getActivities(filters);
    return result;
  } catch (error) {
    console.error('Failed to load activities:', error);
    return { data: [], total: 0, page: 1, page_size: 12 };
  }
});

export default component$(() => {
  const activitiesData = useActivitiesData();
  const categoriesData = useCategoriesData();
  const atollsData = useAtollsData();
  const islandsData = useIslandsData();
  const location = useLocation();
  const nav = useNavigate();
  const lang = location.params.lang || 'en';

  // Get current filter values from URL
  const currentCategoryId = location.url.searchParams.get('category_id') || '';
  const currentAtollCode = location.url.searchParams.get('atoll_code') || '';
  const currentIslandId = location.url.searchParams.get('island_id') || '';

  // Find the selected atoll's ID to filter islands
  const selectedAtoll = atollsData.value.find((a) => a.code === currentAtollCode);
  const filteredIslands = currentAtollCode
    ? islandsData.value.filter((island) => island.atoll_id === selectedAtoll?.id)
    : islandsData.value;

  const handleFilterChange$ = $((key: string, value: string) => {
    const params = new URLSearchParams(location.url.searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 when filters change
    params.delete('page');
    // Clear island selection when atoll changes
    if (key === 'atoll_code') {
      params.delete('island_id');
    }
    const queryString = params.toString();
    nav(`/${lang}/activities${queryString ? `?${queryString}` : ''}`);
  });

  // Staggered animation for activity cards entering the view
  useOnDocument(
    'qviewTransition',
    $(async (event: CustomEvent<{ ready: Promise<void> }>) => {
      const cards = document.querySelectorAll<HTMLElement>('.view-transition-card');
      const visibleCards = Array.from(cards).filter((card) => {
        // Only animate cards that are visible in the viewport
        const rect = card.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });

      if (visibleCards.length === 0) return;

      const transition = event.detail;
      await transition.ready;

      // Staggered entrance animation for cards
      visibleCards.forEach((card, i) => {
        const name = (card.style as CSSStyleDeclaration & { viewTransitionName?: string }).viewTransitionName;
        if (name) {
          document.documentElement.animate(
            {
              opacity: [0, 1],
              transform: ['translateY(20px)', 'translateY(0)'],
            },
            {
              pseudoElement: `::view-transition-new(${name})`,
              duration: 300,
              delay: i * 50,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              fill: 'forwards',
            }
          );
        }
      });
    })
  );

  return (
    <div class="container mx-auto py-12 max-w-7xl px-6 lg:px-8">
      <h1 class="text-4xl font-bold mb-8">Explore Activities</h1>

      {/* Filters Section */}
      <div class="mb-8 flex flex-wrap gap-4">
        <select
          class="select select-bordered w-full max-w-xs"
          value={currentCategoryId}
          onChange$={(e) => handleFilterChange$('category_id', (e.target as HTMLSelectElement).value)}
        >
          <option value="">All Categories</option>
          {categoriesData.value.map((category) => (
            <option key={category.id} value={category.id}>
              {`${category.icon} ${category.name}`}
            </option>
          ))}
        </select>

        <select
          class="select select-bordered w-full max-w-xs"
          value={currentAtollCode}
          onChange$={(e) => handleFilterChange$('atoll_code', (e.target as HTMLSelectElement).value)}
        >
          <option value="">All Atolls</option>
          {atollsData.value.map((atoll) => (
            <option key={atoll.id} value={atoll.code}>
              {atoll.name}
            </option>
          ))}
        </select>

        <select
          class="select select-bordered w-full max-w-xs"
          value={currentIslandId}
          onChange$={(e) => handleFilterChange$('island_id', (e.target as HTMLSelectElement).value)}
        >
          <option value="">All Islands</option>
          {filteredIslands.map((island) => (
            <option key={island.id} value={island.id}>
              {island.name}
            </option>
          ))}
        </select>
      </div>

      {/* Activities Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {activitiesData.value.data.map((activity: Activity) => {
          const title =
            activity.translations?.[lang]?.title ||
            activity.seo_metadata.title ||
            activity.slug;
          const description =
            activity.translations?.[lang]?.description ||
            activity.seo_metadata.description ||
            '';

          return (
            <a
              key={activity.id}
              href={`/${lang}/activities/${activity.slug}`}
              class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow view-transition-card"
              style={{ viewTransitionName: `activity-card-${activity.id}` }}
            >
              <figure class="relative h-48">
                {activity.seo_metadata.og_image ? (
                  <img
                    src={activity.seo_metadata.og_image}
                    alt={title}
                    class="w-full h-full object-cover"
                    width={400}
                    height={192}
                    style={{ viewTransitionName: `activity-image-${activity.id}` }}
                  />
                ) : (
                  <div
                    class="w-full h-full bg-base-300 flex items-center justify-center"
                    style={{ viewTransitionName: `activity-image-${activity.id}` }}
                  >
                    <span class="text-4xl">
                      {activity.category?.icon || '🏝️'}
                    </span>
                  </div>
                )}
                {activity.review_score > 0 && (
                  <div class="absolute top-2 right-2 badge badge-primary">
                    ⭐ {activity.review_score.toFixed(1)}
                  </div>
                )}
              </figure>
              <div class="card-body">
                <h2
                  class="card-title"
                  style={{ viewTransitionName: `activity-title-${activity.id}` }}
                >
                  {title}
                </h2>
                <p class="text-sm line-clamp-2">{description}</p>
                {activity.island && (
                  <div class="text-sm text-base-content/70">
                    📍 {activity.island.name}
                  </div>
                )}
                <div class="card-actions justify-between items-center mt-4">
                  <div
                    class="text-lg font-bold"
                    style={{ viewTransitionName: `activity-price-${activity.id}` }}
                  >
                    From ${activity.min_price_usd}
                  </div>
                  <button class="btn btn-primary btn-sm">View Details</button>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Pagination */}
      {activitiesData.value.total > activitiesData.value.page_size && (
        <div class="flex justify-center mt-12">
          <div class="join">
            {Array.from(
              {
                length: Math.ceil(
                  activitiesData.value.total / activitiesData.value.page_size
                ),
              },
              (_, i) => i + 1
            ).map((pageNum) => (
              <a
                key={pageNum}
                href={`?page=${pageNum}`}
                class={`join-item btn ${
                  pageNum === activitiesData.value.page ? 'btn-active' : ''
                }`}
              >
                {pageNum}
              </a>
            ))}
          </div>
        </div>
      )}

      {activitiesData.value.data.length === 0 && (
        <div class="text-center py-12">
          <p class="text-xl text-base-content/70">No activities found</p>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = ({ url, params }) => {
  const lang = params.lang || 'en';
  const page = parseInt(url.searchParams.get('page') || '1');
  const categoryId = url.searchParams.get('category_id');
  const islandId = url.searchParams.get('island_id');

  // Base title and description
  let title = 'Explore Activities & Tours in Maldives | Rihigo';
  let description = 'Discover amazing activities, tours, and experiences in the Maldives. From water sports to island hopping, find and book the perfect adventure for your tropical getaway.';

  // Add pagination context
  if (page > 1) {
    title = `Activities in Maldives - Page ${page} | Rihigo`;
    description = `Browse page ${page} of activities and tours in the Maldives. ${description}`;
  }

  // Add filter context to description
  if (categoryId || islandId) {
    const filters = [];
    if (categoryId) filters.push('filtered by category');
    if (islandId) filters.push('by island');
    description = `Explore ${filters.join(' and ')} activities in the Maldives. ${description}`;
  }

  const canonicalUrl = `https://rihigo.com/${lang}/activities${page > 1 ? `?page=${page}` : ''}`;

  return {
    title,
    meta: [
      // Primary Meta Tags
      {
        name: 'description',
        content: description,
      },
      {
        name: 'keywords',
        content: 'maldives activities, maldives tours, water sports maldives, island hopping, snorkeling, diving, maldives excursions, tropical adventures',
      },
      {
        name: 'author',
        content: 'Rihigo',
      },
      {
        name: 'robots',
        content: page > 1 ? 'index, follow' : 'index, follow, max-image-preview:large',
      },

      // Open Graph / Facebook
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: canonicalUrl,
      },
      {
        property: 'og:title',
        content: title,
      },
      {
        property: 'og:description',
        content: description,
      },
      {
        property: 'og:image',
        content: 'https://rihigo.com/images/og-activities.jpg',
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
        property: 'og:locale',
        content: lang === 'it-IT' ? 'it_IT' : 'en_US',
      },
      {
        property: 'og:site_name',
        content: 'Rihigo',
      },

      // Twitter
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
        content: description,
      },
      {
        name: 'twitter:image',
        content: 'https://rihigo.com/images/og-activities.jpg',
      },

      // Additional SEO
      {
        name: 'geo.region',
        content: 'MV',
      },
      {
        name: 'geo.placename',
        content: 'Maldives',
      },
      {
        name: 'language',
        content: lang,
      },
    ],
    links: [
      // Canonical URL
      {
        rel: 'canonical',
        href: canonicalUrl,
      },
      // Alternate language versions
      {
        rel: 'alternate',
        hreflang: 'en',
        href: `https://rihigo.com/en-US/activities${page > 1 ? `?page=${page}` : ''}`,
      },
      {
        rel: 'alternate',
        hreflang: 'it',
        href: `https://rihigo.com/it-IT/activities${page > 1 ? `?page=${page}` : ''}`,
      },
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: `https://rihigo.com/en-US/activities${page > 1 ? `?page=${page}` : ''}`,
      },
    ],
  };
};
