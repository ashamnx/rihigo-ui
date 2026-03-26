import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateBreadcrumbSchema,
  generateActivitySchema,
  generateFAQSchema,
  generateLocalBusinessSchema,
  serializeSchema,
  generateHomePageSchemas,
  generateActivityMeta,
  generateHreflangLinks,
} from './seo';
import type { Activity } from '~/types/activity';

const makeActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'act-1',
  slug: 'snorkeling-trip',
  status: 'active',
  booking_type: 'standard',
  images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  seo_metadata: {
    title: 'Snorkeling Trip',
    description: 'A great snorkeling experience in the Maldives.',
  },
  translations: {
    'en-US': { title: 'Snorkeling Adventure', description: 'Explore coral reefs' },
  },
  packages: [],
  min_price_usd: 50,
  review_count: 0,
  review_score: 0,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  ...overrides,
} as Activity);

describe('generateOrganizationSchema', () => {
  it('returns TravelAgency schema with correct context', () => {
    const schema = generateOrganizationSchema();
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('TravelAgency');
  });

  it('includes correct name and url', () => {
    const schema = generateOrganizationSchema();
    expect(schema.name).toBe('Rihigo');
    expect(schema.url).toBe('https://rihigo.com');
  });

  it('includes contactPoint with English and Italian', () => {
    const schema = generateOrganizationSchema();
    expect(schema.contactPoint?.availableLanguage).toEqual(['English', 'Italian']);
  });
});

describe('generateWebSiteSchema', () => {
  it('returns WebSite schema without search action by default', () => {
    const schema = generateWebSiteSchema();
    expect(schema['@type']).toBe('WebSite');
    expect(schema.potentialAction).toBeUndefined();
  });

  it('includes search action when includeSearch=true', () => {
    const schema = generateWebSiteSchema(true);
    expect(schema.potentialAction).toBeDefined();
    expect(schema.potentialAction!['@type']).toBe('SearchAction');
  });

  it('includes both languages in inLanguage', () => {
    const schema = generateWebSiteSchema();
    expect(schema.inLanguage).toEqual(['en-US', 'it-IT']);
  });
});

describe('generateBreadcrumbSchema', () => {
  it('generates correct positions starting at 1', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Activities', url: '/activities' },
      { name: 'Snorkeling' },
    ]);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[2].position).toBe(3);
  });

  it('includes item URL for non-last breadcrumbs', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Activities' },
    ]);
    expect(schema.itemListElement[0].item).toBe('/');
  });

  it('omits item URL for the last breadcrumb', () => {
    const schema = generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Activities', url: '/activities' },
    ]);
    expect(schema.itemListElement[1].item).toBeUndefined();
  });

  it('handles single breadcrumb', () => {
    const schema = generateBreadcrumbSchema([{ name: 'Home' }]);
    expect(schema.itemListElement).toHaveLength(1);
    expect(schema.itemListElement[0].item).toBeUndefined();
  });
});

describe('generateActivitySchema', () => {
  it('returns correct @type array', () => {
    const schema = generateActivitySchema(makeActivity());
    expect(schema['@type']).toEqual(['TouristAttraction', 'Product']);
  });

  it('uses translation title when available', () => {
    const schema = generateActivitySchema(makeActivity(), 'en-US');
    expect(schema.name).toBe('Snorkeling Adventure');
  });

  it('falls back to seo_metadata title', () => {
    const schema = generateActivitySchema(makeActivity({ translations: {} }), 'en-US');
    expect(schema.name).toBe('Snorkeling Trip');
  });

  it('falls back to slug when no title', () => {
    const schema = generateActivitySchema(
      makeActivity({ translations: {}, seo_metadata: {} as any }),
      'en-US'
    );
    expect(schema.name).toBe('snorkeling-trip');
  });

  it('truncates description to 500 chars', () => {
    const longDesc = 'A'.repeat(600);
    const schema = generateActivitySchema(
      makeActivity({ translations: { 'en-US': { title: 'Test', description: longDesc } } }),
      'en-US'
    );
    expect(schema.description.length).toBe(500);
  });

  it('uses default image when no images provided', () => {
    const schema = generateActivitySchema(makeActivity({ images: [] }));
    expect(schema.image[0]).toContain('cover.jpeg');
  });

  it('handles array images directly', () => {
    const schema = generateActivitySchema(
      makeActivity({ images: ['https://img1.jpg', 'https://img2.jpg'] })
    );
    expect(schema.image).toEqual(['https://img1.jpg', 'https://img2.jpg']);
  });

  it('parses string images (JSON)', () => {
    const schema = generateActivitySchema(
      makeActivity({ images: '["https://img1.jpg"]' as any })
    );
    expect(schema.image).toEqual(['https://img1.jpg']);
  });

  it('adds geo when island is present', () => {
    const schema = generateActivitySchema(
      makeActivity({ island: { id: '1', name: 'Male', atoll: { id: '1', name: 'Kaafu' } } as any })
    );
    expect(schema.geo).toBeDefined();
    expect(schema.address?.addressCountry).toBe('MV');
  });

  it('generates single Offer when only min_price_usd', () => {
    const schema = generateActivitySchema(makeActivity({ packages: [], min_price_usd: 99 }));
    expect(schema.offers).toBeDefined();
    expect((schema.offers as any)['@type']).toBe('Offer');
    expect((schema.offers as any).price).toBe('99');
  });

  it('generates AggregateOffer when packages with USD prices', () => {
    const schema = generateActivitySchema(
      makeActivity({
        packages: [
          {
            id: 'pkg-1',
            name: 'Basic',
            prices: [{ currency_code: 'USD', amount: 50 }],
          } as any,
          {
            id: 'pkg-2',
            name: 'Premium',
            prices: [{ currency_code: 'USD', amount: 150 }],
          } as any,
        ],
      })
    );
    expect((schema.offers as any)['@type']).toBe('AggregateOffer');
    expect((schema.offers as any).lowPrice).toBe('50.00');
    expect((schema.offers as any).highPrice).toBe('150.00');
  });

  it('adds aggregateRating when review_count > 0', () => {
    const schema = generateActivitySchema(
      makeActivity({ review_count: 42, review_score: 4.5 })
    );
    expect(schema.aggregateRating).toBeDefined();
    expect(schema.aggregateRating!.ratingValue).toBe('4.5');
    expect(schema.aggregateRating!.reviewCount).toBe('42');
  });

  it('does not add rating when review_count is 0', () => {
    const schema = generateActivitySchema(makeActivity({ review_count: 0 }));
    expect(schema.aggregateRating).toBeUndefined();
  });

  it('includes touristType array', () => {
    const schema = generateActivitySchema(makeActivity());
    expect(schema.touristType).toBeDefined();
    expect(schema.touristType!.length).toBeGreaterThan(0);
  });
});

describe('generateFAQSchema', () => {
  it('maps questions/answers to Question/Answer schema', () => {
    const schema = generateFAQSchema([
      { question: 'Q1?', answer: 'A1' },
      { question: 'Q2?', answer: 'A2' },
    ]);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0].name).toBe('Q1?');
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('A1');
  });

  it('handles empty FAQ array', () => {
    const schema = generateFAQSchema([]);
    expect(schema.mainEntity).toHaveLength(0);
  });
});

describe('generateLocalBusinessSchema', () => {
  it('returns TravelAgency with geo coordinates', () => {
    const schema = generateLocalBusinessSchema();
    expect(schema['@type']).toBe('TravelAgency');
    expect(schema.geo.latitude).toBeDefined();
    expect(schema.geo.longitude).toBeDefined();
  });

  it('includes 7-day opening hours', () => {
    const schema = generateLocalBusinessSchema();
    expect(schema.openingHoursSpecification?.dayOfWeek).toHaveLength(7);
  });
});

describe('serializeSchema', () => {
  it('returns valid JSON string', () => {
    const result = serializeSchema({ key: 'value' });
    expect(JSON.parse(result)).toEqual({ key: 'value' });
  });

  it('handles arrays of schemas', () => {
    const result = serializeSchema([{ a: 1 }, { b: 2 }]);
    expect(JSON.parse(result)).toEqual([{ a: 1 }, { b: 2 }]);
  });
});

describe('generateHomePageSchemas', () => {
  it('returns array of 3 schemas', () => {
    const schemas = generateHomePageSchemas();
    expect(schemas).toHaveLength(3);
  });
});

describe('generateActivityMeta', () => {
  it('generates title with price', () => {
    const meta = generateActivityMeta(makeActivity({ min_price_usd: 99 }), 'en-US');
    expect(meta.title).toContain('$99');
    expect(meta.title).toContain('Rihigo');
  });

  it('truncates description to 155 chars with ellipsis', () => {
    const longDesc = 'B'.repeat(200);
    const meta = generateActivityMeta(
      makeActivity({ translations: { 'en-US': { title: 'Test', description: longDesc } } }),
      'en-US'
    );
    expect(meta.description.length).toBeLessThanOrEqual(155);
    expect(meta.description).toContain('...');
  });

  it('provides fallback description when empty', () => {
    const meta = generateActivityMeta(
      makeActivity({
        translations: { 'en-US': { title: 'Trip', description: '' } },
        seo_metadata: { title: 'Trip', description: '' } as any,
      }),
      'en-US'
    );
    expect(meta.description).toContain('Explore');
  });

  it('generates correct canonical URL with language', () => {
    const meta = generateActivityMeta(makeActivity(), 'it-IT');
    expect(meta.canonicalUrl).toBe('https://rihigo.com/it-IT/activities/snorkeling-trip');
  });

  it('prefixes relative image paths with site URL', () => {
    const meta = generateActivityMeta(
      makeActivity({ images: ['/assets/img.jpg'] }),
      'en-US'
    );
    expect(meta.ogImage).toBe('https://rihigo.com/assets/img.jpg');
  });
});

describe('generateHreflangLinks', () => {
  it('returns en, it, and x-default links', () => {
    const links = generateHreflangLinks('/activities');
    expect(links).toHaveLength(3);
    const hreflangs = links.map(l => l.hreflang);
    expect(hreflangs).toContain('en');
    expect(hreflangs).toContain('it');
    expect(hreflangs).toContain('x-default');
  });

  it('x-default points to en-US', () => {
    const links = generateHreflangLinks('/activities');
    const xDefault = links.find(l => l.hreflang === 'x-default');
    expect(xDefault!.href).toContain('/en-US/');
  });

  it('includes correct path in href', () => {
    const links = generateHreflangLinks('/booking/slug');
    const en = links.find(l => l.hreflang === 'en');
    expect(en!.href).toBe('https://rihigo.com/en-US/booking/slug');
  });
});
