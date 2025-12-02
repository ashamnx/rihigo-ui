import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead, StaticGenerateHandler } from "@builder.io/qwik-city";
import { Link, routeLoader$, useLocation } from "@builder.io/qwik-city";
import { apiClient } from "~/utils/api-client";
import { inlineTranslate } from "qwik-speak";
import { ErrorState } from "~/components/error-state/error-state";

// Enable static generation for homepage (pre-render for each language)
export const onStaticGenerate: StaticGenerateHandler = () => {
  return {
    params: [{ lang: 'en-US' }, { lang: 'it-IT' }],
  };
};

export const useHomeData = routeLoader$(async (requestEvent) => {
  // Cache homepage for 5 minutes on browser, 1 hour on CDN
  requestEvent.cacheControl({
    maxAge: 300,       // 5 minutes browser cache
    sMaxAge: 3600,     // 1 hour CDN cache
    staleWhileRevalidate: 60 * 60 * 24, // 1 day stale-while-revalidate
  });

  return await apiClient.activities.getTop();
});

export const useFAQsData = routeLoader$(async (requestEvent) => {
  // Also cache FAQs loader
  requestEvent.cacheControl({
    maxAge: 300,
    sMaxAge: 3600,
    staleWhileRevalidate: 60 * 60 * 24,
  });

  const response = await apiClient.faqs.list(1, 6);
  if (!response.success) {
    return { success: false, data: [] };
  }
  const faqs = (response.data || []).filter((faq: any) => faq.published);
  return { success: true, data: faqs };
});

export default component$(() => {
  const homeData = useHomeData();
  const faqsData = useFAQsData();
  const t = inlineTranslate();
  const loc = useLocation();

  return (
    <>
      {/* Hero Section */}
      <div class="relative min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div class="absolute inset-0">
          <img
            class="h-full w-full object-cover"
            src="/assets/images/cover.jpeg"
            alt="Beautiful Maldives beach and ocean view"
            width="1920"
            height="1280"
            loading="eager"
          />
          {/* Overlay gradient */}
          <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div class="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div class="max-w-2xl">
            {/* Badge */}
            <div class="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span class="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span class="text-sm font-medium text-white">
                {t("home.hero.badge@@Your Gateway to Paradise")}
              </span>
            </div>

            {/* Heading */}
            <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t("home.hero.title@@Discover the Magic of Maldives")}
            </h1>

            {/* Description */}
            <p class="mt-6 text-lg text-white/80 sm:text-xl max-w-xl">
              {t(
                "home.hero.description@@Book unforgettable experiences, tours, and activities. Your dream vacation starts here.",
              )}
            </p>

            {/* CTA Buttons */}
            <div class="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={`/${loc.params.lang}/activities`}
                class="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/25"
              >
                {t("home.hero.cta.primary@@Explore Activities")}
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#services"
                class="btn btn-outline btn-lg text-white border-white/30 hover:bg-white/10 hover:border-white/50"
              >
                {t("home.hero.cta.secondary@@Our Services")}
              </a>
            </div>

            {/* Trust indicators */}
            <div class="mt-12 flex flex-wrap items-center gap-8 text-white/60">
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm">{t("home.hero.trust.verified@@Verified Experiences")}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm">{t("home.hero.trust.support@@24/7 Support")}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm">{t("home.hero.trust.booking@@Easy Booking")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <a href="#services" class="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors">
            <span class="text-xs uppercase tracking-widest">{t("home.hero.scroll@@Scroll to explore")}</span>
            <svg class="h-6 w-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Services Section */}
      <div id="services" class="bg-white py-24 sm:py-32">
        <div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <h2 class="text-primary text-center text-base/7 font-semibold">
            {t("home.services.label@@Services")}
          </h2>
          <p class="mx-auto mt-2 max-w-lg text-center text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
            {t(
              "home.services.title@@Everything you need to visit the Maldives",
            )}
          </p>
          <p class="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-600">
            {t(
              "home.services.description@@We provide comprehensive services to make your Maldives journey seamless and unforgettable",
            )}
          </p>
          <div class="mt-10 grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
            {/* Imuga Form Filling */}
            <div class="relative lg:row-span-2">
              <div class="absolute inset-px rounded-lg bg-white lg:rounded-l-[2rem]"></div>
              <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
                <div class="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                  <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                    {t("home.services.imuga.title@@Imuga Form Filling")}
                  </p>
                  <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    {t(
                      "home.services.imuga.description@@We help you fill the Imuga form for your visa application, ensuring a smooth entry process.",
                    )}
                  </p>
                </div>
                <div class="@container relative min-h-[30rem] w-full grow max-lg:mx-auto max-lg:max-w-sm">
                  <div class="absolute inset-x-10 top-10 bottom-0 overflow-hidden rounded-t-[12cqw] border-x-[3cqw] border-t-[3cqw] border-gray-700 bg-gray-900 shadow-2xl">
                    <div class="flex size-full items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                      <svg
                        class="h-32 w-32 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div class="pointer-events-none absolute inset-px rounded-lg shadow-sm ring-1 ring-black/5 lg:rounded-l-[2rem]"></div>
            </div>
            {/* Tourist SIM Card */}
            <div class="relative max-lg:row-start-1">
              <div class="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]"></div>
              <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                <div class="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                    {t("home.services.sim.title@@Tourist SIM Card")}
                  </p>
                  <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    {t(
                      "home.services.sim.description@@Get best eSIM deals from local providers for your Maldives trip. Stay connected throughout your vacation.",
                    )}
                  </p>
                </div>
                <div class="flex flex-1 items-center justify-center px-8 max-lg:pt-10 max-lg:pb-12 sm:px-10 lg:pb-2">
                  <div class="flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-8 max-lg:max-w-xs">
                    <svg
                      class="h-24 w-24 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div class="pointer-events-none absolute inset-px rounded-lg shadow-sm ring-1 ring-black/5 max-lg:rounded-t-[2rem]"></div>
            </div>
            {/* Airport Fast Tracking */}
            <div class="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
              <div class="absolute inset-px rounded-lg bg-white"></div>
              <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)]">
                <div class="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                    {t("home.services.fastTrack.title@@Airport Fast Tracking")}
                  </p>
                  <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    {t(
                      "home.services.fastTrack.description@@Get fast tracked through immigration and customs at the airport. Save time and start your vacation sooner.",
                    )}
                  </p>
                </div>
                <div class="@container flex flex-1 items-center justify-center max-lg:py-6 lg:pb-2">
                  <div class="flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6">
                    <svg
                      class="h-20 w-20 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div class="pointer-events-none absolute inset-px rounded-lg shadow-sm ring-1 ring-black/5"></div>
            </div>
            {/* Domestic Transport Booking */}
            <div class="relative lg:row-span-2">
              <div class="absolute inset-px rounded-lg bg-white max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
              <div class="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
                <div class="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                  <p class="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                    {t(
                      "home.services.transport.title@@Domestic Transport Booking",
                    )}
                  </p>
                  <p class="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    {t(
                      "home.services.transport.description@@Book your domestic transport in Maldives with ease. Speedboats, seaplanes, and ferries all in one place.",
                    )}
                  </p>
                </div>
                <div class="relative flex min-h-[30rem] w-full grow items-center justify-center p-10">
                  <div class="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600">
                    <svg
                      class="h-32 w-32 text-white opacity-75"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div class="pointer-events-none absolute inset-px rounded-lg shadow-sm ring-1 ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Section */}
      <div class="bg-gray-50 py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-primary text-base/7 font-semibold">
              {t("home.activities.label@@Explore")}
            </h2>
            <p class="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
              {t("home.activities.title@@Top Activities in The Maldives")}
            </p>
            <p class="mt-6 text-lg text-gray-600">
              {t(
                "home.activities.description@@Discover amazing experiences and adventures in paradise",
              )}
            </p>
          </div>

          {homeData.value.errors ? (
            <div class="mt-16">
              <ErrorState
                title={t(
                  "home.activities.error.title@@Unable to load activities",
                )}
                message={homeData.value.error_message}
                variant="warning"
              />
            </div>
          ) : homeData.value.data && homeData.value.data.length > 0 ? (
            <div class="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {homeData.value.data.map((activity: any) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  locale={loc.params.lang}
                />
              ))}
            </div>
          ) : (
            <div class="mt-16 text-center">
              <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <span class="text-4xl">🏝️</span>
              </div>
              <h3 class="mb-2 text-lg font-medium text-gray-900">
                {t(
                  "home.activities.noActivities.title@@No activities available yet",
                )}
              </h3>
              <p class="text-gray-500">
                {t(
                  "home.activities.noActivities.description@@Amazing activities are coming soon. Check back later!",
                )}
              </p>
            </div>
          )}

          {/* View All Activities Button */}
          <div class="mt-12 text-center">
            <Link
              href={`/${loc.params.lang}/activities`}
              class="bg-primary focus-visible:outline-primary inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {t("home.activities.viewAll@@View All Activities")}
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      {faqsData.value.success && faqsData.value.data.length > 0 && (
        <div class="bg-white py-24 sm:py-32">
          <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-2xl text-center">
              <h2 class="text-primary text-base/7 font-semibold">
                {t("home.faq.label@@FAQ")}
              </h2>
              <p class="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
                {t("home.faq.title@@Frequently Asked Questions")}
              </p>
              <p class="mt-6 text-lg text-gray-600">
                {t("home.faq.description@@Find answers to common questions about traveling to the Maldives")}
              </p>
            </div>

            <div class="mx-auto mt-16 max-w-3xl">
              <dl class="divide-y divide-gray-900/10">
                {faqsData.value.data.slice(0, 5).map((faq: any) => (
                  <FAQItem key={faq.id} faq={faq} />
                ))}
              </dl>
            </div>

            <div class="mt-12 text-center">
              <Link
                href={`/${loc.params.lang}/faq`}
                class="text-primary hover:text-primary/80 inline-flex items-center gap-2 text-sm font-semibold"
              >
                {t("home.faq.viewAll@@View all FAQs")}
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Partners Section - Hidden until real partners are added */}
      {/*
            <div class="bg-white py-24 sm:py-32">
                <div class="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 class="text-center text-base/7 font-semibold text-primary">
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

const ActivityCard = component$<{ activity: any; locale: string }>(
  ({ activity, locale }) => {
    // Get the first image or use placeholder
    const image =
      activity.images && activity.images.length > 0
        ? activity.images[0]
        : "/assets/images/cover.jpeg";

    // Truncate description
    const truncatedDescription =
      activity.seo_metadata?.description &&
      activity.seo_metadata.description.length > 120
        ? activity.seo_metadata.description.substring(0, 120) + "..."
        : activity.seo_metadata?.description;

    // Create activity URL with current locale
    const activityUrl = `/${locale}/activities/${activity.slug}`;

    // Get price from multiple sources: base_price, min_price_usd, or packages
    const getPrice = () => {
      // Check base_price first
      if (activity.base_price && activity.base_price > 0) {
        return activity.base_price;
      }
      // Check min_price_usd
      if (activity.min_price_usd && activity.min_price_usd > 0) {
        return activity.min_price_usd;
      }
      // Check packages for pricing
      if (activity.packages && activity.packages.length > 0) {
        for (const pkg of activity.packages) {
          // Check pricingTiers in options_config
          const config = pkg.options_config as any;
          if (config?.pricingTiers?.[0]?.price) {
            return config.pricingTiers[0].price;
          }
          // Check prices array
          if (pkg.prices?.[0]?.amount) {
            return pkg.prices[0].amount;
          }
        }
      }
      return null;
    };

    const price = getPrice();

    return (
      <Link href={activityUrl}>
        <div class="group relative rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:shadow-lg hover:ring-gray-300">
          {/* Activity Image */}
          <div class="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-gray-100">
            <img
              src={image}
              alt={activity.title || "Maldives activity"}
              class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              width="400"
              height="300"
              loading="lazy"
              decoding="async"
            />
            {/* Category Badge */}
            {activity.category && (
              <div class="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-700 backdrop-blur-sm">
                {activity.category}
              </div>
            )}
            {/* Rating Badge */}
            {activity.rating && (
              <div class="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-sm font-medium text-gray-700 backdrop-blur-sm">
                <svg
                  class="h-4 w-4 fill-current text-yellow-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {activity.rating}
              </div>
            )}
          </div>

          {/* Activity Content */}
          <div class="p-6">
            <h3 class="group-hover:text-primary mb-2 text-xl font-semibold text-gray-900 transition-colors">
              {activity.translations?.[locale]?.title || activity.seo_metadata?.title || activity.name || activity.slug}
            </h3>

            {activity.location && (
              <div class="mb-3 flex items-center gap-1 text-sm text-gray-500">
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {activity.location}
              </div>
            )}

            <p class="mb-4 leading-relaxed text-gray-600">
              {truncatedDescription ||
                "Discover this amazing activity in the Maldives"}
            </p>

            {/* Activity Details */}
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-4 text-sm text-gray-500">
                {activity.duration && (
                  <div class="flex items-center gap-1">
                    <svg
                      class="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {activity.duration}
                  </div>
                )}
                {activity.reviews_count && activity.reviews_count > 0 && (
                  <div class="flex items-center gap-1">
                    <svg
                      class="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {activity.reviews_count} reviews
                  </div>
                )}
              </div>
            </div>

            {/* Price and CTA */}
            <div class="flex items-center justify-between">
              <div class="text-left">
                {price ? (
                  <p class="text-2xl font-bold text-gray-900">
                    ${typeof price === 'number' ? price.toFixed(2) : price}
                    <span class="text-sm font-normal text-gray-500 ml-1">USD</span>
                  </p>
                ) : (
                  <p class="text-lg font-medium text-primary">View Details</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  },
);

const FAQItem = component$<{ faq: any }>(({ faq }) => {
  const isExpanded = useSignal(false);

  return (
    <div class="py-6 first:pt-0 last:pb-0">
      <dt>
        <button
          onClick$={() => (isExpanded.value = !isExpanded.value)}
          type="button"
          class="flex w-full items-start justify-between text-left text-gray-900 cursor-pointer"
          aria-expanded={isExpanded.value}
        >
          <span class="text-base/7 font-semibold">{faq.question}</span>
          <span class="ml-6 flex h-7 items-center">
            {!isExpanded.value ? (
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6v12m6-6H6"
                />
              </svg>
            ) : (
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M18 12H6"
                />
              </svg>
            )}
          </span>
        </button>
      </dt>
      {isExpanded.value && (
        <dd class="mt-2 pr-12">
          <p class="text-base/7 text-gray-600">{faq.answer}</p>
        </dd>
      )}
    </div>
  );
});

export const head: DocumentHead = ({params}) => {
  const lang = params.lang || 'en-US';
  const canonicalUrl = `https://rihigo.com/${lang}`;

  return {
    title: "Rihigo - Your Complete Maldives Travel Guide & Trip Planner",
    meta: [
      {
        name: "description",
        content:
          "Plan your perfect Maldives vacation with Rihigo. Explore top activities, book tours, find accommodations, and get expert travel services including Imuga form assistance, eSIM cards, and airport fast-track.",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1",
      },
      {
        name: "author",
        content: "Rihigo",
      },
      // Open Graph meta tags
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: canonicalUrl,
      },
      {
        property: "og:title",
        content: "Rihigo - Your Complete Maldives Travel Guide",
      },
      {
        property: "og:description",
        content:
          "Discover amazing activities and plan your dream Maldives vacation. From snorkeling to island hopping, we help you create unforgettable memories.",
      },
      {
        property: "og:image",
        content: "https://rihigo.com/assets/images/cover.jpeg",
      },
      {
        property: "og:image:width",
        content: "1920",
      },
      {
        property: "og:image:height",
        content: "1280",
      },
      {
        property: "og:image:alt",
        content: "Beautiful Maldives beach and ocean view",
      },
      {
        property: "og:locale",
        content: lang === 'it-IT' ? 'it_IT' : 'en_US',
      },
      {
        property: "og:locale:alternate",
        content: lang === 'it-IT' ? 'en_US' : 'it_IT',
      },
      {
        property: "og:site_name",
        content: "Rihigo",
      },
      // Twitter Card meta tags
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:url",
        content: canonicalUrl,
      },
      {
        name: "twitter:title",
        content: "Rihigo - Your Complete Maldives Travel Guide",
      },
      {
        name: "twitter:description",
        content:
          "Plan your perfect Maldives vacation with our comprehensive travel guide. Explore activities, book tours, and get expert travel assistance.",
      },
      {
        name: "twitter:image",
        content: "https://rihigo.com/assets/images/cover.jpeg",
      },
      {
        name: "twitter:image:alt",
        content: "Beautiful Maldives beach and ocean view",
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: canonicalUrl,
      },
      {
        rel: 'alternate',
        hreflang: 'en',
        href: 'https://rihigo.com/en-US/',
      },
      {
        rel: 'alternate',
        hreflang: 'it',
        href: 'https://rihigo.com/it-IT/',
      },
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: 'https://rihigo.com/en-US/',
      },
    ],
  };
};
