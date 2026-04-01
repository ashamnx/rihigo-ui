import { component$ } from '@builder.io/qwik';
import { Link, type DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
    const settingsSections = [
        {
            title: 'Billing Settings',
            description: 'Invoice numbering, payment terms, currency, tax registration, and bank details',
            href: '/vendor/settings/billing',
            icon: (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            ),
        },
        {
            title: 'Tax Configuration',
            description: 'Tax rates, exemptions, and calculator for Maldives tourism regulations',
            href: '/vendor/settings/taxes',
            icon: (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
                </svg>
            ),
        },
        {
            title: 'Payment Methods',
            description: 'Configure accepted payment methods for your property',
            href: '/vendor/settings/payment-methods',
            icon: (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
            ),
        },
    ];

    return (
        <div class="p-6">
            <div class="mb-6">
                <h1 class="text-2xl font-bold">Settings</h1>
                <p class="text-base-content/60 mt-1">Manage your vendor portal configuration</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settingsSections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md hover:border-primary/20 transition-all"
                    >
                        <div class="card-body">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="text-primary">{section.icon}</div>
                                <h3 class="card-title text-base">{section.title}</h3>
                            </div>
                            <p class="text-sm text-base-content/60">{section.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Settings | Vendor Portal | Rihigo',
};
