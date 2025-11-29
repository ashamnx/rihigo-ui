import { component$ } from '@builder.io/qwik';
import { routeLoader$, useLocation, type DocumentHead } from '@builder.io/qwik-city';
import type { Activity, ActivityFilters } from '~/types/activity';
import { getActivities } from '~/services/activity-api';

export const useActivitiesData = routeLoader$(async (requestEvent) => {
  requestEvent.cacheControl({
    maxAge: 60,
    sMaxAge: 3600,
    staleWhileRevalidate: 60 * 60 * 24, // 1 day
  });

  const url = requestEvent.url;
  const page = parseInt(url.searchParams.get('page') || '1');
  const category_id = url.searchParams.get('category_id');
  const island_id = url.searchParams.get('island_id');
  const lang = requestEvent.params.lang || 'en';

  const filters: ActivityFilters = {
    page,
    page_size: 12,
    lang,
  };

  if (category_id) filters.category_id = parseInt(category_id);
  if (island_id) filters.island_id = parseInt(island_id);

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
  const location = useLocation();
  const lang = location.params.lang || 'en';

  return (
    <div class="container mx-auto py-12 max-w-7xl px-6 lg:px-8">
      <h1 class="text-4xl font-bold mb-8">Explore Activities</h1>

      {/* Filters Section */}
      <div class="mb-8 flex gap-4">
        <select class="select select-bordered w-full max-w-xs">
          <option value="">All Categories</option>
          {/* TODO: Load categories dynamically */}
        </select>

        <select class="select select-bordered w-full max-w-xs">
          <option value="">All Islands</option>
          {/* TODO: Load islands dynamically */}
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
              class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <figure class="relative h-48">
                {activity.seo_metadata.og_image ? (
                  <img
                    src={activity.seo_metadata.og_image}
                    alt={title}
                    class="w-full h-full object-cover"
                  />
                ) : (
                  <div class="w-full h-full bg-base-300 flex items-center justify-center">
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
                <h2 class="card-title">{title}</h2>
                <p class="text-sm line-clamp-2">{description}</p>
                {activity.island && (
                  <div class="text-sm text-base-content/70">
                    📍 {activity.island.name}
                  </div>
                )}
                <div class="card-actions justify-between items-center mt-4">
                  <div class="text-lg font-bold">
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
