import { component$, useSignal, $ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$, Link, useLocation } from '@builder.io/qwik-city';
import { apiClient } from '~/utils/api-client';
import { useSession } from '~/routes/plugin@auth';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export const useFAQs = routeLoader$(async () => {
  const response = await apiClient.faqs.list(1, 50);

  if (!response.success) {
    return [];
  }

  return (response.data || []) as FAQ[];
});

export default component$(() => {
  const location = useLocation();
  const lang = location.params.lang || 'en-US';
  const session = useSession();
  const faqs = useFAQs();

  const searchTerm = useSignal('');
  const selectedCategory = useSignal<string>('all');
  const expandedFAQs = useSignal<Record<string, boolean>>({});

  // Get unique categories from FAQs
  const categories = [...new Set(faqs.value.map((faq) => faq.category).filter(Boolean))];

  // Filter FAQs based on search and category
  const filteredFAQs = faqs.value.filter((faq) => {
    const matchesSearch =
      searchTerm.value === '' ||
      faq.question.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.value.toLowerCase());

    const matchesCategory = selectedCategory.value === 'all' || faq.category === selectedCategory.value;

    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = $((id: string) => {
    expandedFAQs.value = {
      ...expandedFAQs.value,
      [id]: !expandedFAQs.value[id],
    };
  });

  const isLoggedIn = !!session.value?.user;

  return (
    <div class="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div class="bg-primary text-primary-content py-16">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-4xl font-bold mb-4">How can we help you?</h1>
          <p class="text-xl opacity-90 mb-8">
            Search our FAQs or contact our support team
          </p>

          {/* Search Bar */}
          <div class="max-w-xl mx-auto">
            <div class="relative">
              <svg
                class="size-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search FAQs..."
                class="input input-lg w-full pl-12 bg-white text-base-content"
                value={searchTerm.value}
                onInput$={(e) => (searchTerm.value = (e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-12 max-w-4xl">
        {/* Quick Actions */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {isLoggedIn ? (
            <Link
              href={`/${lang}/support/tickets`}
              class="bg-base-200 rounded-xl p-6 hover:bg-base-300 transition-colors text-center"
            >
              <svg class="size-8 mx-auto mb-3 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
              <h3 class="font-semibold mb-1">My Tickets</h3>
              <p class="text-sm text-base-content/60">View your support tickets</p>
            </Link>
          ) : (
            <Link
              href={`/${lang}/support/new`}
              class="bg-base-200 rounded-xl p-6 hover:bg-base-300 transition-colors text-center"
            >
              <svg class="size-8 mx-auto mb-3 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <h3 class="font-semibold mb-1">Contact Us</h3>
              <p class="text-sm text-base-content/60">Submit a support request</p>
            </Link>
          )}

          <Link
            href={isLoggedIn ? `/${lang}/support/tickets/new` : `/${lang}/support/new`}
            class="bg-base-200 rounded-xl p-6 hover:bg-base-300 transition-colors text-center"
          >
            <svg class="size-8 mx-auto mb-3 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <h3 class="font-semibold mb-1">New Ticket</h3>
            <p class="text-sm text-base-content/60">Create a support ticket</p>
          </Link>

          <div class="bg-base-200 rounded-xl p-6 text-center">
            <svg class="size-8 mx-auto mb-3 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="font-semibold mb-1">Response Time</h3>
            <p class="text-sm text-base-content/60">Usually within 24 hours</p>
          </div>
        </div>

        {/* Mobile Support */}
        <div class="bg-success/10 border border-success/20 rounded-xl p-6 mb-12">
          <div class="flex flex-col md:flex-row items-center gap-4">
            <div class="flex items-center justify-center size-14 rounded-full bg-success/20 flex-shrink-0">
              <svg class="size-7 text-success" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <div class="text-center md:text-left flex-1">
              <h3 class="font-semibold text-lg mb-1">Call Us Directly</h3>
              <p class="text-base-content/60 text-sm mb-2">
                Need immediate assistance? Our phone support is available daily.
              </p>
              <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <a href="tel:+9607355666" class="text-xl font-bold text-success hover:underline">
                  +960 735 5666
                </a>
                <span class="badge badge-success badge-outline">7:00 AM - 10:00 PM</span>
              </div>
            </div>
            <a href="tel:+9607355666" class="btn btn-success btn-outline md:btn-lg">
              <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Call Now
            </a>
          </div>
        </div>

        {/* Track Ticket (for guests) */}
        {!isLoggedIn && (
          <div class="bg-base-200 rounded-xl p-6 mb-12">
            <h3 class="font-semibold mb-3">Already submitted a ticket?</h3>
            <p class="text-sm text-base-content/60 mb-4">
              Enter your ticket number and email to view your ticket status.
            </p>
            <form action={`/${lang}/support/track`} method="get" class="flex gap-2 flex-wrap">
              <input
                type="text"
                name="ticket"
                placeholder="Ticket # (e.g., TKT-202412-000001)"
                class="input input-bordered flex-1 min-w-[200px]"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your email"
                class="input input-bordered flex-1 min-w-[200px]"
                required
              />
              <button type="submit" class="btn btn-primary">
                Track Ticket
              </button>
            </form>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div class="mb-8">
            <div class="flex gap-2 flex-wrap">
              <button
                class={`btn btn-sm ${selectedCategory.value === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick$={() => (selectedCategory.value = 'all')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  class={`btn btn-sm ${selectedCategory.value === category ? 'btn-primary' : 'btn-ghost'}`}
                  onClick$={() => (selectedCategory.value = category || 'all')}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQs Section */}
        <div class="mb-12">
          <h2 class="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

          {filteredFAQs.length === 0 ? (
            <div class="text-center py-12">
              <svg
                class="size-12 mx-auto mb-4 text-base-content/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
              <p class="text-base-content/60">
                {searchTerm.value
                  ? 'No FAQs match your search. Try different keywords.'
                  : 'No FAQs available at the moment.'}
              </p>
            </div>
          ) : (
            <div class="space-y-3">
              {filteredFAQs.map((faq) => (
                <div key={faq.id} class="bg-base-200 rounded-xl overflow-hidden">
                  <button
                    class="w-full p-4 text-left flex items-center justify-between hover:bg-base-300 transition-colors"
                    onClick$={() => toggleFAQ(faq.id)}
                  >
                    <span class="font-medium pr-4">{faq.question}</span>
                    <svg
                      class={`size-5 flex-shrink-0 transition-transform ${
                        expandedFAQs.value[faq.id] ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {expandedFAQs.value[faq.id] && (
                    <div class="px-4 pb-4 text-base-content/70">
                      <div class="pt-2 border-t border-base-300">
                        <p class="whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Still Need Help */}
        <div class="bg-primary/10 rounded-xl p-8 text-center">
          <h3 class="text-xl font-bold mb-2">Still need help?</h3>
          <p class="text-base-content/70 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link
            href={isLoggedIn ? `/${lang}/support/tickets/new` : `/${lang}/support/new`}
            class="btn btn-primary"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Support | Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Get help with your bookings. Search our FAQs or contact our support team.',
    },
  ],
};
