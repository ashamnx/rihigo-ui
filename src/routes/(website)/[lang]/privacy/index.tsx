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
                        {t('app.privacy.title')}
                    </h1>
                    <p class="mt-4 text-lg text-white/80">
                        {t('app.privacy.lastUpdated')}: November 29, 2024
                    </p>
                </div>
            </div>

            {/* Content */}
            <div class="mx-auto max-w-4xl px-6 py-12 lg:px-8">
                <div class="prose prose-lg max-w-none">
                    {/* Introduction */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.introduction.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.privacy.sections.introduction.content')}
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.collection.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed mb-4">
                            {t('app.privacy.sections.collection.content')}
                        </p>
                        <ul class="list-disc pl-6 space-y-2 text-base-content/70">
                            <li>{t('app.privacy.sections.collection.item1')}</li>
                            <li>{t('app.privacy.sections.collection.item2')}</li>
                            <li>{t('app.privacy.sections.collection.item3')}</li>
                            <li>{t('app.privacy.sections.collection.item4')}</li>
                        </ul>
                    </section>

                    {/* How We Use Information */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.usage.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed mb-4">
                            {t('app.privacy.sections.usage.content')}
                        </p>
                        <ul class="list-disc pl-6 space-y-2 text-base-content/70">
                            <li>{t('app.privacy.sections.usage.item1')}</li>
                            <li>{t('app.privacy.sections.usage.item2')}</li>
                            <li>{t('app.privacy.sections.usage.item3')}</li>
                            <li>{t('app.privacy.sections.usage.item4')}</li>
                        </ul>
                    </section>

                    {/* Data Sharing */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.sharing.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed mb-4">
                            {t('app.privacy.sections.sharing.content')}
                        </p>
                        <ul class="list-disc pl-6 space-y-2 text-base-content/70">
                            <li>{t('app.privacy.sections.sharing.item1')}</li>
                            <li>{t('app.privacy.sections.sharing.item2')}</li>
                            <li>{t('app.privacy.sections.sharing.item3')}</li>
                        </ul>
                    </section>

                    {/* Data Security */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.security.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.privacy.sections.security.content')}
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.rights.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed mb-4">
                            {t('app.privacy.sections.rights.content')}
                        </p>
                        <ul class="list-disc pl-6 space-y-2 text-base-content/70">
                            <li>{t('app.privacy.sections.rights.item1')}</li>
                            <li>{t('app.privacy.sections.rights.item2')}</li>
                            <li>{t('app.privacy.sections.rights.item3')}</li>
                            <li>{t('app.privacy.sections.rights.item4')}</li>
                        </ul>
                    </section>

                    {/* Cookies */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.cookies.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.privacy.sections.cookies.content')}
                        </p>
                    </section>

                    {/* Changes to Policy */}
                    <section class="mb-12">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.changes.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.privacy.sections.changes.content')}
                        </p>
                    </section>

                    {/* Contact */}
                    <section class="mb-12 p-6 bg-base-200 rounded-lg">
                        <h2 class="text-2xl font-semibold text-base-content mb-4">
                            {t('app.privacy.sections.contact.title')}
                        </h2>
                        <p class="text-base-content/70 leading-relaxed">
                            {t('app.privacy.sections.contact.content')}
                        </p>
                        <p class="mt-4">
                            <a href="mailto:privacy@rihigo.com" class="link link-primary">
                                privacy@rihigo.com
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
                        {t('app.privacy.backToHome')}
                    </Link>
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Privacy Policy - Rihigo",
    meta: [
        {
            name: "description",
            content: "Privacy Policy for Rihigo - Learn how we collect, use, and protect your personal information.",
        },
    ],
};
