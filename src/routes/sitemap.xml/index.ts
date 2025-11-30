import type { RequestHandler } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';

const SITE_URL = 'https://rihigo.com';
const LANGUAGES = ['en-US', 'it-IT'];

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: { lang: string; href: string }[];
  images?: { loc: string; title?: string; caption?: string }[];
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    let entry = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>`;

    if (url.lastmod) {
      entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
    }

    if (url.changefreq) {
      entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
    }

    if (url.priority !== undefined) {
      entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
    }

    // Add hreflang alternates
    if (url.alternates && url.alternates.length > 0) {
      for (const alt of url.alternates) {
        entry += `\n    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${escapeXml(alt.href)}" />`;
      }
      // Add x-default
      entry += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url.alternates[0].href)}" />`;
    }

    // Add images
    if (url.images && url.images.length > 0) {
      for (const img of url.images) {
        entry += `\n    <image:image>`;
        entry += `\n      <image:loc>${escapeXml(img.loc)}</image:loc>`;
        if (img.title) {
          entry += `\n      <image:title>${escapeXml(img.title)}</image:title>`;
        }
        if (img.caption) {
          entry += `\n      <image:caption>${escapeXml(img.caption)}</image:caption>`;
        }
        entry += `\n    </image:image>`;
      }
    }

    entry += `\n  </url>`;
    return entry;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export const onGet: RequestHandler = async ({ cacheControl, send }) => {
  // Cache sitemap for 1 hour on CDN, 5 minutes on browser
  cacheControl({
    maxAge: 300,
    sMaxAge: 3600,
    staleWhileRevalidate: 86400,
  });

  const urls: SitemapUrl[] = [];
  const today = getToday();

  // Static pages with alternates
  const staticPages = [
    { path: '', priority: 1.0, changefreq: 'daily' as const },
    { path: '/activities', priority: 0.9, changefreq: 'daily' as const },
    { path: '/faq', priority: 0.7, changefreq: 'weekly' as const },
    { path: '/about-us', priority: 0.6, changefreq: 'monthly' as const },
    { path: '/terms', priority: 0.3, changefreq: 'monthly' as const },
    { path: '/privacy', priority: 0.3, changefreq: 'monthly' as const },
  ];

  // Add static pages with language alternates
  for (const page of staticPages) {
    const alternates = LANGUAGES.map(lang => ({
      lang: lang.split('-')[0], // 'en' or 'it'
      href: `${SITE_URL}/${lang}${page.path}`,
    }));

    // Add for each language
    for (const lang of LANGUAGES) {
      urls.push({
        loc: `${SITE_URL}/${lang}${page.path}`,
        lastmod: today,
        changefreq: page.changefreq,
        priority: page.priority,
        alternates,
      });
    }
  }

  // Fetch all activities from API
  try {
    const activitiesResponse = await apiClient.activities.list(1, 500);

    if (activitiesResponse.success && activitiesResponse.data) {
      // Cast to array of activities since API returns data as the array
      const activities = activitiesResponse.data as unknown as Array<{
        slug: string;
        status?: string;
        images?: string[];
        seo_metadata?: { title?: string; description?: string };
        updated_at?: string;
      }>;

      for (const activity of activities) {
        // Skip unpublished activities
        if (activity.status && activity.status !== 'published') continue;

        const alternates = LANGUAGES.map(lang => ({
          lang: lang.split('-')[0],
          href: `${SITE_URL}/${lang}/activities/${activity.slug}`,
        }));

        // Parse images for sitemap
        const images: SitemapUrl['images'] = [];
        if (activity.images && activity.images.length > 0) {
          for (const img of activity.images.slice(0, 10)) { // Limit to 10 images per page
            if (typeof img === 'string' && img.startsWith('http')) {
              images.push({
                loc: img,
                title: activity.seo_metadata?.title || activity.slug,
                caption: activity.seo_metadata?.description?.substring(0, 150) || '',
              });
            }
          }
        }

        // Add activity page for each language
        for (const lang of LANGUAGES) {
          urls.push({
            loc: `${SITE_URL}/${lang}/activities/${activity.slug}`,
            lastmod: activity.updated_at ? activity.updated_at.split('T')[0] : today,
            changefreq: 'weekly',
            priority: 0.8,
            alternates,
            images: images.length > 0 ? images : undefined,
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch activities for sitemap:', error);
  }

  const xml = generateSitemapXML(urls);

  send(new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  }));
};
