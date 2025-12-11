import {component$, useSignal} from '@builder.io/qwik';
import type {DocumentHead} from "@builder.io/qwik-city";
import {routeLoader$} from "@builder.io/qwik-city";
import {apiClient} from "~/utils/api-client";
import {inlineTranslate} from "qwik-speak";
import {ErrorState} from "~/components/error-state/error-state";
import {generateFAQSchema, generateBreadcrumbSchema, generateHreflangLinks} from '~/utils/seo';
import {structuredDataScript} from '~/components/seo/StructuredData';

// Define the FAQ type based on the API response
interface FAQ {
    id: string;
    category: string;
    published: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
    // API returns flat structure, not nested translations
    question?: string;
    answer?: string;
}

// Loader to fetch all published FAQs
export const useFAQs = routeLoader$(async () => {
    // Cache headers are set by layout's onRequest based on auth status
    // Fetch FAQs from the API (public endpoint, no auth needed)
    const response = await apiClient.faqs.list(1, 100); // Fetch up to 100 FAQs

    if (!response.success) {
        console.error('Failed to fetch FAQs:', response.error_message);
        return {
            success: false,
            error: response.error_message || 'Failed to load FAQs',
            data: {}
        };
    }

    const faqs = response.data || [];

    // Filter only published FAQs (API might return all)
    const publishedFaqs = faqs.filter((faq: FAQ) => faq.published);

    // Group FAQs by category
    const groupedFaqs = publishedFaqs.reduce((acc: Record<string, FAQ[]>, faq: FAQ) => {
        const category = faq.category || 'General';
        acc[category] ??= [];
        acc[category].push(faq);
        return acc;
    }, {} as Record<string, FAQ[]>);

    return {
        success: true,
        error: null,
        data: groupedFaqs
    };
});

export default component$(() => {
    const t = inlineTranslate();
    const faqsResponse = useFAQs();

    return (
        <div class="bg-white">
            <div class="bg-white px-6 py-24 sm:py-32 lg:px-8">
                <div class="mx-auto max-w-2xl text-center">
                    <p class="text-base/7 font-semibold text-primary">{t('app.faq.getToKnow@@Get to know')}</p>
                    <h1 class="mt-2 text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
                        {t('app.faq.title@@Frequently asked questions')}
                    </h1>
                    <p class="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
                        {t('app.faq.description@@We\'re here to help. If you have any questions, please don\'t hesitate to reach out.')}
                    </p>
                </div>
            </div>

            <div class="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
                {faqsResponse.value.error ? (
                    <ErrorState
                        title={t('app.faq.error.title@@Unable to load FAQs')}
                        message={faqsResponse.value.error}
                        variant="warning"
                    />
                ) : Object.keys(faqsResponse.value.data).length === 0 ? (
                    <div class="text-center">
                        <p>{t('app.faq.noQuestionsFound@@No questions found.')}</p>
                    </div>
                ) : (
                    Object.keys(faqsResponse.value.data).map((category) => (
                        <div key={category} class="mx-auto max-w-4xl mb-16">
                            <h2 class="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{category}</h2>
                            <dl class="mt-16 divide-y divide-gray-900/10">
                                {faqsResponse.value.data[category].map((faq: any) => (
                                    <Question
                                        key={faq.id}
                                        faq={faq}
                                    />
                                ))}
                            </dl>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
});

const Question = component$((props: { faq: FAQ }) => {
    const isExpanded = useSignal(false);
    const t = inlineTranslate();
    const {faq} = props;

    // API returns flat structure with question/answer directly
    const question = faq.question || t('app.faq.noQuestionAvailable@@No question available');
    const answer = faq.answer || t('app.faq.noAnswerAvailable@@No answer available');
    const questionId = `faq-${faq.id}`;

    return (
        <div class="py-6 first:pt-0 last:pb-0">
            <dt>
                <button
                    onClick$={() => isExpanded.value = !isExpanded.value}
                    type="button"
                    class="flex w-full items-start justify-between text-left text-gray-900 cursor-pointer"
                    aria-controls={questionId}
                    aria-expanded={isExpanded.value}>
                    <span class="text-base/7 font-semibold">{question}</span>
                    <span class="ml-6 flex h-7 items-center">
                        <svg class="hidden size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                             stroke="currentColor" aria-hidden="true" data-slot="icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 12H6"/>
                </svg>
                        {
                            !isExpanded.value ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M5 13v-1h6V6h1v6h6v1h-6v6h-1v-6z"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M5 13v-1h13v1z"/>
                                </svg>
                            )
                        }
                    </span>
                </button>
            </dt>
            {isExpanded.value && (
                <dd class="mt-2 pr-12" id={questionId}>
                    <p class="text-base/7 text-gray-600">{answer}</p>
                </dd>
            )}
        </div>
    )
})

export const head: DocumentHead = ({resolveValue, params}) => {
    const faqsData = resolveValue(useFAQs);
    const lang = params.lang || 'en-US';

    const canonicalUrl = `https://rihigo.com/${lang}/faq`;
    const title = 'Frequently Asked Questions About Maldives Travel';
    const description = 'Find answers to common questions about traveling to the Maldives. Learn about visa requirements, Imuga forms, best time to visit, activities, and more.';

    // Collect all FAQs for schema
    const allFaqs: { question: string; answer: string }[] = [];
    if (faqsData.success && faqsData.data) {
        for (const category of Object.values(faqsData.data as Record<string, any[]>)) {
            for (const faq of category) {
                if (faq.question && faq.answer) {
                    allFaqs.push({ question: faq.question, answer: faq.answer });
                }
            }
        }
    }

    // Generate schemas
    const faqSchema = allFaqs.length > 0 ? generateFAQSchema(allFaqs) : null;
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: `https://rihigo.com/${lang}` },
        { name: 'FAQ' },
    ]);
    const hreflangLinks = generateHreflangLinks('/faq');

    return {
      title: `${title} | Rihigo`,
      meta: [
        // Primary Meta Tags
        {
          name: "description",
          content: description,
        },
        {
          name: "robots",
          content: "index, follow, max-snippet:-1",
        },
        {
          name: "author",
          content: "Rihigo",
        },

        // Open Graph / Facebook
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
          content: `${title} | Rihigo`,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:image",
          content:
            "https://imagedelivery.net/qcaLCK1uCdpYtBNx7SBE1g/f179a2f9-a5ce-4bea-fe2b-1f016f753700/public",
        },
        {
          property: "og:locale",
          content: lang === "it-IT" ? "it_IT" : "en_US",
        },
        {
          property: "og:site_name",
          content: "Rihigo",
        },

        // Twitter Card
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
          content: title,
        },
        {
          name: "twitter:description",
          content: description,
        },
        {
          name: "twitter:image",
          content: "https://rihigo.com/assets/images/cover.jpeg",
        },
      ],
      links: [
        {
          rel: "canonical",
          href: canonicalUrl,
        },
        ...hreflangLinks,
      ],
      scripts: [
        // Breadcrumb Schema
        structuredDataScript(breadcrumbSchema),
        // FAQPage Schema (if FAQs available)
        ...(faqSchema ? [structuredDataScript(faqSchema)] : []),
      ],
    };
};
