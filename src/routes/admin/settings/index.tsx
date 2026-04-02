import { component$, useSignal } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { authenticatedRequest } from '~/utils/auth';

export const useLoadSettings = routeLoader$(async (requestEvent) => {
    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const apiUrl = process.env.API_URL || 'http://localhost:8080';
            const response = await fetch(`${apiUrl}/api/admin/settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = await response.json() as { success: boolean; data?: any };
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return null;
        }
    });
});

export default component$(() => {
    const settingsData = useLoadSettings();
    const activeTab = useSignal<'branding' | 'contact' | 'social' | 'seo' | 'homepage'>('branding');
    const settings = settingsData.value as any;

    const tabs = [
        { id: 'branding' as const, label: 'Branding', icon: '🎨' },
        { id: 'contact' as const, label: 'Contact', icon: '📧' },
        { id: 'social' as const, label: 'Social Links', icon: '🔗' },
        { id: 'seo' as const, label: 'SEO Defaults', icon: '🔍' },
        { id: 'homepage' as const, label: 'Homepage', icon: '🏠' },
    ];

    return (
        <div>
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold">Site Settings</h1>
                    <p class="text-base-content/60 mt-1">Configure your platform's global settings</p>
                </div>
            </div>

            {/* Tabs */}
            <div class="tabs tabs-boxed bg-base-200 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        class={`tab ${activeTab.value === tab.id ? 'tab-active' : ''}`}
                        onClick$={() => activeTab.value = tab.id}
                    >
                        <span class="mr-1.5">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {!settings ? (
                <div class="alert alert-warning">
                    <span>Unable to load settings. The API may not have settings initialized yet.</span>
                </div>
            ) : (
                <>
                    {/* Branding */}
                    {activeTab.value === 'branding' && (
                        <div class="card bg-base-100 shadow-sm">
                            <div class="card-body">
                                <h2 class="card-title">Branding</h2>
                                <p class="text-base-content/60 mb-4">Logo, site name, and visual identity</p>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Site Name</span></label>
                                        <div class="text-lg">{settings.branding?.site_name || '—'}</div>
                                    </div>
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Tagline</span></label>
                                        <div>{settings.branding?.tagline || '—'}</div>
                                    </div>
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Primary Color</span></label>
                                        <div class="flex items-center gap-2">
                                            {settings.branding?.primary_color && (
                                                <div class="w-6 h-6 rounded" style={{ backgroundColor: settings.branding.primary_color }}></div>
                                            )}
                                            <span>{settings.branding?.primary_color || '—'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Logo URL</span></label>
                                        <div class="text-sm truncate">{settings.branding?.logo_url || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact */}
                    {activeTab.value === 'contact' && (
                        <div class="card bg-base-100 shadow-sm">
                            <div class="card-body">
                                <h2 class="card-title">Contact Information</h2>
                                <p class="text-base-content/60 mb-4">Business contact details displayed on the site</p>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Email</span></label>
                                        <div>{settings.contact?.email || '—'}</div>
                                    </div>
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Phone</span></label>
                                        <div>{settings.contact?.phone || '—'}</div>
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="label"><span class="label-text font-medium">Address</span></label>
                                        <div>{settings.contact?.address || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Social Links */}
                    {activeTab.value === 'social' && (
                        <div class="card bg-base-100 shadow-sm">
                            <div class="card-body">
                                <h2 class="card-title">Social Links</h2>
                                <p class="text-base-content/60 mb-4">Social media profiles linked from the site</p>
                                {settings.social_links && settings.social_links.length > 0 ? (
                                    <div class="space-y-3">
                                        {settings.social_links.map((link: any) => (
                                            <div key={link.platform} class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                                                <span class="font-medium capitalize">{link.platform}</span>
                                                <a href={link.url} target="_blank" class="link link-primary text-sm truncate">{link.url}</a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div class="text-base-content/50">No social links configured</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SEO Defaults */}
                    {activeTab.value === 'seo' && (
                        <div class="card bg-base-100 shadow-sm">
                            <div class="card-body">
                                <h2 class="card-title">SEO Defaults</h2>
                                <p class="text-base-content/60 mb-4">Default meta tags for pages without custom SEO</p>
                                <div class="space-y-4">
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Default Title</span></label>
                                        <div>{settings.seo_defaults?.default_title || '—'}</div>
                                    </div>
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Default Description</span></label>
                                        <div>{settings.seo_defaults?.default_description || '—'}</div>
                                    </div>
                                    <div>
                                        <label class="label"><span class="label-text font-medium">Default Keywords</span></label>
                                        <div>{settings.seo_defaults?.default_keywords || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Homepage */}
                    {activeTab.value === 'homepage' && (
                        <div class="card bg-base-100 shadow-sm">
                            <div class="card-body">
                                <h2 class="card-title">Homepage Configuration</h2>
                                <p class="text-base-content/60 mb-4">Hero slides, featured sections, and promotional banners</p>
                                <div class="space-y-6">
                                    <div>
                                        <h3 class="font-medium mb-2">Hero Slides</h3>
                                        <div class="text-base-content/60">
                                            {settings.homepage?.hero_slides?.length || 0} slides configured
                                        </div>
                                    </div>
                                    <div>
                                        <h3 class="font-medium mb-2">Featured Sections</h3>
                                        <div class="text-base-content/60">
                                            {settings.homepage?.featured_sections?.length || 0} sections configured
                                        </div>
                                    </div>
                                    <div>
                                        <h3 class="font-medium mb-2">Promotional Banners</h3>
                                        <div class="text-base-content/60">
                                            {settings.homepage?.promotional_banners?.length || 0} banners configured
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Settings | Admin | Rihigo',
};
