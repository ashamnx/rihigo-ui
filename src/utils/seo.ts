/**
 * SEO Utilities and Schema.org Structured Data Generators
 * For rich snippets and enhanced search engine visibility
 */

import type { Activity } from '~/types/activity';

const SITE_URL = 'https://rihigo.com';
const SITE_NAME = 'Rihigo';
const MALDIVES_COORDINATES = { latitude: 4.1755, longitude: 73.5093 };

// ============================================================================
// Schema.org Types
// ============================================================================

export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  '@id': string;
  name: string;
  url: string;
  logo: string;
  description: string;
  address: {
    '@type': string;
    addressCountry: string;
    addressRegion?: string;
  };
  contactPoint?: {
    '@type': string;
    contactType: string;
    availableLanguage: string[];
  };
  sameAs?: string[];
}

export interface WebSiteSchema {
  '@context': string;
  '@type': string;
  '@id': string;
  url: string;
  name: string;
  description: string;
  publisher: { '@id': string };
  inLanguage: string[];
  potentialAction?: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: {
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }[];
}

export interface TouristAttractionSchema {
  '@context': string;
  '@type': string[];
  name: string;
  description: string;
  url: string;
  image: string[];
  geo?: {
    '@type': string;
    latitude: number;
    longitude: number;
  };
  address?: {
    '@type': string;
    addressCountry: string;
    addressRegion?: string;
  };
  isAccessibleForFree: boolean;
  publicAccess: boolean;
  touristType?: string[];
  offers?: OfferSchema | AggregateOfferSchema;
  aggregateRating?: AggregateRatingSchema;
  review?: ReviewSchema[];
}

export interface OfferSchema {
  '@type': string;
  url: string;
  priceCurrency: string;
  price: string;
  availability: string;
  validFrom?: string;
  seller?: {
    '@type': string;
    name: string;
  };
}

export interface AggregateOfferSchema {
  '@type': string;
  lowPrice: string;
  highPrice: string;
  priceCurrency: string;
  offerCount: number;
  offers?: OfferSchema[];
}

export interface AggregateRatingSchema {
  '@type': string;
  ratingValue: string;
  reviewCount: string;
  bestRating: string;
  worstRating: string;
}

export interface ReviewSchema {
  '@type': string;
  author: {
    '@type': string;
    name: string;
  };
  reviewRating: {
    '@type': string;
    ratingValue: string;
  };
  reviewBody?: string;
}

export interface FAQPageSchema {
  '@context': string;
  '@type': string;
  mainEntity: {
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }[];
}

export interface LocalBusinessSchema {
  '@context': string;
  '@type': string;
  '@id': string;
  name: string;
  image: string;
  url: string;
  priceRange: string;
  address: {
    '@type': string;
    addressCountry: string;
    addressRegion?: string;
  };
  geo: {
    '@type': string;
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: {
    '@type': string;
    dayOfWeek: string[];
    opens: string;
    closes: string;
  };
}

// ============================================================================
// Schema Generators
// ============================================================================

/**
 * Generate Organization schema for the website
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/logo.svg`,
    description: 'Rihigo is your complete Maldives travel guide and booking platform. Explore activities, tours, and experiences in paradise.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MV',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Italian'],
    },
    sameAs: [
      // Add social media URLs when available
      // 'https://facebook.com/rihigo',
      // 'https://instagram.com/rihigo',
      // 'https://twitter.com/rihigo',
    ],
  };
}

/**
 * Generate WebSite schema with optional search action
 */
export function generateWebSiteSchema(includeSearch = false): WebSiteSchema {
  const schema: WebSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: 'Your complete Maldives travel guide - explore activities, book tours, and plan your dream vacation.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['en-US', 'it-IT'],
  };

  if (includeSearch) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/en-US/activities?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}

/**
 * Generate Breadcrumb schema
 */
export function generateBreadcrumbSchema(
  breadcrumbs: { name: string; url?: string }[]
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.url && index < breadcrumbs.length - 1 ? { item: crumb.url } : {}),
    })),
  };
}

/**
 * Generate TouristAttraction schema for an activity
 */
export function generateActivitySchema(
  activity: Activity,
  lang: string = 'en-US'
): TouristAttractionSchema {
  const title = activity.translations?.[lang]?.title || activity.seo_metadata.title || activity.slug;
  const description = activity.translations?.[lang]?.description || activity.seo_metadata.description || '';
  const activityUrl = `${SITE_URL}/${lang}/activities/${activity.slug}`;

  // Parse images
  const images: string[] = [];
  if (activity.images) {
    const imgArray = Array.isArray(activity.images)
      ? activity.images
      : typeof activity.images === 'string'
        ? JSON.parse(activity.images)
        : [];
    images.push(...imgArray.filter((img: string) => typeof img === 'string'));
  }
  if (images.length === 0) {
    images.push(`${SITE_URL}/assets/images/cover.jpeg`);
  }

  const schema: TouristAttractionSchema = {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', 'Product'],
    name: title,
    description: description.substring(0, 500),
    url: activityUrl,
    image: images,
    isAccessibleForFree: false,
    publicAccess: true,
  };

  // Add location if available
  if (activity.island) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: MALDIVES_COORDINATES.latitude,
      longitude: MALDIVES_COORDINATES.longitude,
    };
    schema.address = {
      '@type': 'PostalAddress',
      addressCountry: 'MV',
      addressRegion: activity.island.atoll?.name || activity.island.name,
    };
  }

  // Add pricing if packages available
  if (activity.packages && activity.packages.length > 0) {
    const prices = activity.packages
      .flatMap(pkg => pkg.prices || [])
      .filter(p => p.currency_code === 'USD')
      .map(p => p.amount);

    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      schema.offers = {
        '@type': 'AggregateOffer',
        lowPrice: minPrice.toFixed(2),
        highPrice: maxPrice.toFixed(2),
        priceCurrency: 'USD',
        offerCount: activity.packages.length,
        offers: activity.packages.map(pkg => {
          const usdPrice = pkg.prices?.find(p => p.currency_code === 'USD');
          return {
            '@type': 'Offer',
            url: `${activityUrl}?package=${pkg.id}`,
            priceCurrency: 'USD',
            price: usdPrice ? usdPrice.amount.toFixed(2) : '0',
            availability: 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: SITE_NAME,
            },
          };
        }),
      };
    }
  } else if (activity.min_price_usd) {
    schema.offers = {
      '@type': 'Offer',
      url: activityUrl,
      priceCurrency: 'USD',
      price: activity.min_price_usd.toString(),
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    };
  }

  // Add ratings if available
  if (activity.review_count && activity.review_count > 0 && activity.review_score) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: activity.review_score.toFixed(1),
      reviewCount: activity.review_count.toString(),
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add tourist types
  schema.touristType = ['Families', 'Couples', 'Adventure Seekers', 'Solo Travelers'];

  return schema;
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate LocalBusiness schema for Maldives service
 */
export function generateLocalBusinessSchema(): LocalBusinessSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#localbusiness`,
    name: `${SITE_NAME} - Maldives Travel Services`,
    image: `${SITE_URL}/assets/logo.svg`,
    url: SITE_URL,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MV',
      addressRegion: 'Male',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: MALDIVES_COORDINATES.latitude,
      longitude: MALDIVES_COORDINATES.longitude,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Serialize schema to JSON string for embedding in script tag
 */
export function serializeSchema(schema: object | object[]): string {
  return JSON.stringify(schema, null, 0);
}

/**
 * Generate combined schemas for homepage
 */
export function generateHomePageSchemas(): object[] {
  return [
    generateOrganizationSchema(),
    generateWebSiteSchema(false),
    generateLocalBusinessSchema(),
  ];
}

/**
 * Generate meta tags for an activity
 */
export function generateActivityMeta(
  activity: Activity,
  lang: string = 'en-US'
): {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  canonicalUrl: string;
} {
  const title = activity.translations?.[lang]?.title || activity.seo_metadata.title || activity.slug;
  const description = activity.translations?.[lang]?.description || activity.seo_metadata.description || '';

  // Get first image
  const images = Array.isArray(activity.images)
    ? activity.images
    : typeof activity.images === 'string' && activity.images
      ? JSON.parse(activity.images)
      : [];
  const image = images[0] || `${SITE_URL}/assets/images/cover.jpeg`;

  // Truncate description for meta tags
  const metaDescription = description.length > 155
    ? description.substring(0, 152) + '...'
    : description;

  const priceText = activity.min_price_usd
    ? ` From $${activity.min_price_usd}`
    : '';

  return {
    title: `${title}${priceText} | ${SITE_NAME}`,
    description: metaDescription || `Explore ${title} in the Maldives. Book this amazing experience with ${SITE_NAME}.`,
    ogTitle: `${title} | ${SITE_NAME} Maldives`,
    ogDescription: metaDescription || `Discover ${title} - an unforgettable experience in the Maldives.`,
    ogImage: image.startsWith('http') ? image : `${SITE_URL}${image}`,
    twitterTitle: title,
    twitterDescription: metaDescription,
    canonicalUrl: `${SITE_URL}/${lang}/activities/${activity.slug}`,
  };
}

/**
 * Generate hreflang links for a page
 */
export function generateHreflangLinks(
  path: string
): { rel: string; hreflang: string; href: string }[] {
  const languages = [
    { code: 'en-US', hreflang: 'en' },
    { code: 'it-IT', hreflang: 'it' },
  ];

  const links = languages.map(lang => ({
    rel: 'alternate',
    hreflang: lang.hreflang,
    href: `${SITE_URL}/${lang.code}${path}`,
  }));

  // Add x-default
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${SITE_URL}/en-US${path}`,
  });

  return links;
}
