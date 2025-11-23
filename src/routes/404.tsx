import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
    return (
        <div class="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-6">
            <div class="max-w-2xl w-full text-center">
                {/* Decorative 404 */}
                <div class="relative mb-8">
                    <h1 class="text-[150px] sm:text-[200px] font-bold text-gray-100 leading-none select-none">
                        404
                    </h1>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="bg-white rounded-full p-8 shadow-lg">
                            <svg class="w-24 h-24 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    Oops! Page Not Found
                </h2>
                <p class="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    The page you're looking for seems to have drifted away like a boat in the Maldives ocean. Let's get you back on course!
                </p>

                {/* Navigation Options */}
                <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <a
                        href="/en-US/"
                        class="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary transition-colors"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go Home
                    </a>
                    <a
                        href="/en-US/activities"
                        class="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                        Explore Activities
                    </a>
                </div>

                {/* Quick Links */}
                <div class="border-t border-gray-200 pt-8">
                    <p class="text-sm text-gray-500 mb-4">Quick Links</p>
                    <div class="flex flex-wrap gap-4 justify-center text-sm">
                        <a href="/en-US/about-us" class="text-secondary hover:text-indigo-500 font-medium transition-colors">
                            About Us
                        </a>
                        <span class="text-gray-300">•</span>
                        <a href="/en-US/faq" class="text-secondary hover:text-indigo-500 font-medium transition-colors">
                            FAQs
                        </a>
                        <span class="text-gray-300">•</span>
                        <a href="/auth/sign-in" class="text-secondary hover:text-indigo-500 font-medium transition-colors">
                            Sign In
                        </a>
                        <span class="text-gray-300">•</span>
                        <a href="/admin" class="text-secondary hover:text-indigo-500 font-medium transition-colors">
                            Admin Dashboard
                        </a>
                    </div>
                </div>

                {/* Fun Fact */}
                <div class="mt-12 bg-blue-50 rounded-2xl p-6 max-w-lg mx-auto">
                    <p class="text-sm text-blue-900 font-medium mb-1">Did you know?</p>
                    <p class="text-sm text-blue-700">
                        The Maldives has over 1,000 islands, but you can still find your way around! Unlike this page, our site navigation will get you where you need to go.
                    </p>
                </div>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: "404 - Page Not Found • Rihigo",
    meta: [
        {
            name: "description",
            content: "The page you're looking for could not be found. Return to Rihigo homepage to explore the Maldives.",
        },
        {
            name: "robots",
            content: "noindex, nofollow",
        },
    ],
};
