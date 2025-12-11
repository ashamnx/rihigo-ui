import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { inlineTranslate } from "qwik-speak";

export default component$(() => {
    const t = inlineTranslate();

    return (
        <div class="bg-base-100 min-h-screen">
            {/* Header */}
            <div class="bg-gradient-to-br from-primary to-primary/80 text-white">
                <div class="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-8">
                    <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
                        {t('app.terms.title')}
                    </h1>
                    <p class="mt-4 text-lg text-white/80">
                        {t('app.terms.lastUpdated')}: November 29, 2024
                    </p>
                </div>
            </div>

            {/* Content */}
            <div class="mx-auto max-w-4xl px-6 py-12 lg:px-8">
                <div class="prose prose-lg max-w-none">
                    {/* Introduction */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.terms.sections.introduction.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.terms.sections.introduction.content')}
                        </p>
                    </section>

                    {/* Definitions */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.terms.sections.definitions.title')}
                        </h2>
                        <ul class="list-disc pl-6 space-y-2 text-base-content/70">
                            <li><strong>"Service"</strong> {t('app.terms.sections.definitions.service')}</li>
                            <li><strong>"User"</strong> {t('app.terms.sections.definitions.user')}</li>
                            <li><strong>"Booking"</strong> {t('app.terms.sections.definitions.booking')}</li>
                            <li><strong>"Vendor"</strong> {t('app.terms.sections.definitions.vendor')}</li>
                        </ul>
                    </section>

                    {/* Use of Service */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.terms.sections.useOfService.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed mb-4">
                            {t('app.terms.sections.useOfService.content')}
                        </p>
                        <ul class="list-disc pl-6 space-y-2 text-base-content/70">
                            <li>{t('app.terms.sections.useOfService.item1')}</li>
                            <li>{t('app.terms.sections.useOfService.item2')}</li>
                            <li>{t('app.terms.sections.useOfService.item3')}</li>
                            <li>{t('app.terms.sections.useOfService.item4')}</li>
                        </ul>
                    </section>

                    {/* Bookings and Payments */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.terms.sections.bookings.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed mb-4">
                            {t('app.terms.sections.bookings.content')}
                        </p>
                        <ul class="list-disc pl-6 space-y-2 text-base-content/70">
                            <li>{t('app.terms.sections.bookings.item1')}</li>
                            <li>{t('app.terms.sections.bookings.item2')}</li>
                            <li>{t('app.terms.sections.bookings.item3')}</li>
                        </ul>
                    </section>

                    {/* Cancellation Policy */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.terms.sections.cancellation.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.terms.sections.cancellation.content')}
                        </p>
                    </section>

                    {/* Limitation of Liability */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.terms.sections.liability.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.terms.sections.liability.content')}
                        </p>
                    </section>

                    {/* Changes to Terms */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.terms.sections.changes.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.terms.sections.changes.content')}
                        </p>
                    </section>

                    {/* Contact */}
                    <section class="mb-12 p-6 bg-base-200 rounded-lg">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.terms.sections.contact.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.terms.sections.contact.content')}
                        </p>
                        <p class="mt-4">
                            <a href="mailto:support@rihigo.com" class="link link-primary">
                                support@rihigo.com
                            </a>
                        </p>
                    </section>
                </div>

                {/* Back Link */}
                <div class="mt-12 pt-8 border-t border-base-200">
                    <Link href="/" class="btn btn-ghost gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {t('app.terms.backToHome')}
                    </Link>
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Terms of Service - Rihigo",
    meta: [
        {
            name: "description",
            content: "Terms of Service for Rihigo - Read our terms and conditions for using our tourism booking platform.",
        },
    ],
};
