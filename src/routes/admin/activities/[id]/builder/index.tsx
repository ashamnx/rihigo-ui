import { component$, useSignal, useStore, $, useTask$, useComputed$, type QRL } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { routeLoader$, routeAction$, Form, Link } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";

// Component Types for the Activity Builder
interface PageComponent {
  id: string;
  type: 'hero' | 'gallery' | 'overview' | 'highlights' | 'itinerary' | 'inclusions' | 'faq' | 'pricing' | 'booking' | 'location' | 'reviews';
  config: Record<string, any>;
  order: number;
}

interface ActivityPageLayout {
  id?: string;
  activity_id: string;
  components: PageComponent[];
  is_published: boolean;
}

// Component Templates
const COMPONENT_TEMPLATES = {
  hero: {
    name: 'Hero Section',
    icon: '🎯',
    description: 'Main hero with title, image, and CTA',
    defaultConfig: {
      title: '',
      subtitle: '',
      backgroundImage: '',
      showPricing: true,
      showBooking: true
    }
  },
  gallery: {
    name: 'Image Gallery',
    icon: '📸',
    description: 'Photo gallery with thumbnails',
    defaultConfig: {
      title: '',
      layout: 'grid', // grid, carousel, masonry
      columns: 3,
      aspectRatio: 'square', // square, landscape, portrait, auto
      showCaptions: true,
      enableLightbox: true,
      autoplay: false,
      autoplaySpeed: 3000,
      images: []
    }
  },
  overview: {
    name: 'Overview',
    icon: '📝',
    description: 'Activity description and overview',
    defaultConfig: {
      title: 'About This Activity',
      content: '',
      showReadMore: true,
      showDuration: true,
      showGroupSize: true,
      showLanguages: true,
      duration: '',
      groupSize: '',
      languages: [],
      features: []
    }
  },
  itinerary: {
    name: 'Itinerary',
    icon: '🗓️',
    description: 'Day by day or time-based schedule',
    defaultConfig: {
      title: 'Your Journey',
      layout: 'timeline', // timeline, cards, tabs
      showTime: true,
      items: []
    }
  },
  highlights: {
    name: 'Key Highlights',
    icon: '⭐',
    description: 'Bullet points of key features',
    defaultConfig: {
      title: 'Experience Highlights',
      items: [],
      layout: 'grid', // list, grid, cards
      columns: 2,
      showIcons: true,
      iconStyle: 'emoji' // emoji, checkmark, star
    }
  },
  inclusions: {
    name: 'What\'s Included',
    icon: '✅',
    description: 'Inclusions and exclusions',
    defaultConfig: {
      title: 'What\'s Included',
      inclusions: [],
      exclusions: [],
      showExclusions: true
    }
  },
  faq: {
    name: 'FAQs',
    icon: '❓',
    description: 'Frequently asked questions',
    defaultConfig: {
      title: 'Frequently Asked Questions',
      faqs: [],
      layout: 'accordion', // accordion, cards, columns
      showIcon: true,
      expandFirst: false,
      allowMultiple: false
    }
  },
  pricing: {
    name: 'Pricing Packages',
    icon: '💰',
    description: 'Package options with pricing',
    defaultConfig: {
      title: 'Choose Your Package',
      showComparison: true,
      highlightRecommended: true,
      usePackageSystem: true,
      showOnlyAvailable: true,
      layout: 'cards' // cards, table, comparison
    }
  },
  booking: {
    name: 'Booking Widget',
    icon: '📅',
    description: 'Date picker and booking form',
    defaultConfig: {
      title: 'Book Your Experience',
      subtitle: 'Select your preferred date and package',
      showCalendar: true,
      showTimeSlots: false,
      showGuestSelector: true,
      allowGroupBooking: true,
      requireAdvanceBooking: 1,
      maxAdvanceBooking: 90
    }
  },
  location: {
    name: 'Location & Meeting Point',
    icon: '📍',
    description: 'Map and meeting instructions',
    defaultConfig: {
      title: 'Meeting Point',
      address: '',
      latitude: '',
      longitude: '',
      showMap: true,
      mapZoom: 15,
      showTransport: true,
      transportOptions: [],
      meetingInstructions: '',
      showDirections: true
    }
  },
  reviews: {
    name: 'Customer Reviews',
    icon: '💬',
    description: 'Testimonials and ratings',
    defaultConfig: {
      title: 'What Our Guests Say',
      showRating: true,
      showAverageRating: true,
      showReviewCount: true,
      maxReviews: 6,
      layout: 'cards', // cards, list, carousel
      showReviewerName: true,
      showReviewDate: true,
      showVerifiedBadge: true
    }
  }
};

export const useActivityLayout = routeLoader$(async (requestEvent) => {
  const activityId = requestEvent.params.id;

  return authenticatedRequest(requestEvent, async (token) => {
    // Fetch activity details
    const activityResponse = await apiClient.activities.getByIdAdmin(activityId, token);

    if (!activityResponse.success || !activityResponse.data) {
      return activityResponse;
    }

    const activity = activityResponse.data;

    // Use the page_layout from the activity directly
    let components = [];
    if (activity.page_layout) {
      if (Array.isArray(activity.page_layout)) {
        components = activity.page_layout;
      } else if (typeof activity.page_layout === 'string') {
        try {
          components = JSON.parse(activity.page_layout);
        } catch (error) {
          console.error('Error parsing page_layout JSON:', error);
          components = [];
        }
      }
    }

    // Create layout object structure
    const layout = {
      activity_id: activityId,
      components: components,
      is_published: activity.status === 'published'
    };

    // Return as ApiResponse with custom data structure
    return {
      success: true,
      data: {
        activity,
        layout
      }
    };
  });
});

export const useSaveLayout = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    const activityId = requestEvent.params.id;
    let components;

    // Parse components from form data
    try {
      components = JSON.parse(data.components as string);
    } catch (error) {
      console.error("Error parsing components data:", error);
      return {
        success: false,
        error_message: "Invalid components data format"
      };
    }

    // Ensure components is an array
    if (!Array.isArray(components)) {
      return {
        success: false,
        error_message: "Components must be an array"
      };
    }

    // Send components array directly - API expects JSONBArray
    return await apiClient.activities.layout.save(activityId, components, token);
  });
});

export default component$(() => {
  const response = useActivityLayout();
  const saveLayout = useSaveLayout();
  const previewMode = useSignal(false);
  const selectedComponent = useSignal<string | null>(null);

  // Handle not found
  if (!response.value.success || !response.value.data) {
    return (
      <div class="text-center py-12">
        <h1 class="text-2xl font-bold mb-4">Activity Not Found</h1>
        <Link href="/admin/activities" class="btn btn-primary">Back to Activities</Link>
      </div>
    );
  }

  const { activity, layout } = response.value.data;

  // Initialize layout store with the loaded data
  const layoutStore = useStore<ActivityPageLayout>({
    activity_id: layout?.activity_id || activity.id,
    components: Array.isArray(layout?.components) ? layout.components : [],
    is_published: layout?.is_published || false
  });

  // Update layout store when data changes
  useTask$(({ track }) => {
    track(() => response.value);

    if (response.value.data?.layout) {
      const loadedLayout = response.value.data.layout;
      layoutStore.activity_id = loadedLayout.activity_id;
      layoutStore.components = Array.isArray(loadedLayout.components) ? loadedLayout.components : [];
      layoutStore.is_published = loadedLayout.is_published;
    }
  });

  const addComponent = $((componentType: keyof typeof COMPONENT_TEMPLATES) => {
    const template = COMPONENT_TEMPLATES[componentType];
    const newComponent: PageComponent = {
      id: `${componentType}_${Date.now()}`,
      type: componentType,
      config: { ...template.defaultConfig },
      order: layoutStore.components.length
    };
    
    layoutStore.components.push(newComponent);
  });

  const removeComponent = $((componentId: string) => {
    const index = layoutStore.components.findIndex(c => c.id === componentId);
    if (index !== -1) {
      layoutStore.components.splice(index, 1);
      // Reorder remaining components
      layoutStore.components.forEach((c, i) => c.order = i);
    }
  });

  const moveComponent = $((componentId: string, direction: 'up' | 'down') => {
    const index = layoutStore.components.findIndex(c => c.id === componentId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layoutStore.components.length) return;

    // Swap components
    const temp = layoutStore.components[index];
    layoutStore.components[index] = layoutStore.components[newIndex];
    layoutStore.components[newIndex] = temp;

    // Update order
    layoutStore.components[index].order = index;
    layoutStore.components[newIndex].order = newIndex;
  });

  const updateComponentConfig = $((componentId: string, key: string, value: any) => {
    const component = layoutStore.components.find(c => c.id === componentId);
    if (component) {
      component.config[key] = value;
    }
  });

  // Computed sorted components to avoid mutation in render
  const sortedComponents = useComputed$(() => {
    return [...layoutStore.components].sort((a, b) => a.order - b.order);
  });

  return (
    <div class="h-screen flex flex-col">
      {/* Header */}
      <div class="navbar bg-base-100 border-b border-base-200 flex-none">
        <div class="navbar-start">
          <Link href="/admin/activities" class="btn btn-ghost btn-sm">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          <div class="ml-4">
            <h1 class="text-xl font-bold">Activity Page Builder</h1>
            <p class="text-sm text-base-content/70">{activity.title}</p>
          </div>
        </div>
        
        <div class="navbar-end gap-2">
          <Link 
            href={`/admin/activities/${activity.id}/packages`} 
            class="btn btn-outline btn-sm"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Manage Packages
          </Link>
          
          <div class="form-control">
            <label class="label cursor-pointer gap-2">
              <span class="label-text">Preview</span>
              <input 
                type="checkbox" 
                class="toggle toggle-primary toggle-sm" 
                checked={previewMode.value}
                onChange$={() => previewMode.value = !previewMode.value}
              />
            </label>
          </div>

          <Form action={saveLayout}>
            <input type="hidden" name="layoutId" value={layout?.id || ''} />
            <input type="hidden" name="components" value={JSON.stringify(layoutStore.components)} />
            <input type="hidden" name="is_published" value={layoutStore.is_published.toString()} />
            <button type="submit" class="btn btn-primary btn-sm">
              Save Layout
            </button>
          </Form>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        {!previewMode.value && (
          <>
            {/* Component Library Sidebar */}
            <div class="w-80 bg-base-100 border-r border-base-200 flex flex-col">
              <div class="p-4 border-b border-base-200">
                <h2 class="font-semibold mb-4">Components</h2>
                <div class="grid gap-2">
                  {Object.entries(COMPONENT_TEMPLATES).map(([key, template]) => (
                    <button
                      key={key}
                      type="button"
                      class="btn btn-sm btn-outline justify-start"
                      onClick$={() => addComponent(key as keyof typeof COMPONENT_TEMPLATES)}
                    >
                      <span class="mr-2">{template.icon}</span>
                      <div class="text-left">
                        <div class="font-medium">{template.name}</div>
                        <div class="text-xs opacity-70">{template.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layer Panel */}
              <div class="flex-1 p-4">
                <h3 class="font-semibold mb-3">Page Structure</h3>
                <div class="space-y-2">
                  {sortedComponents.value.map((component) => {
                      const template = COMPONENT_TEMPLATES[component.type];
                      return (
                        <div
                          key={component.id}
                          class={`p-3 rounded border cursor-pointer transition-colors ${
                            selectedComponent.value === component.id
                              ? 'border-primary bg-primary/10'
                              : 'border-base-300 hover:border-base-400'
                          }`}
                          onClick$={() => selectedComponent.value = component.id}
                        >
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <span>{template.icon}</span>
                              <span class="text-sm font-medium">{template.name}</span>
                            </div>
                            <div class="flex gap-1">
                              <button
                                type="button"
                                class="btn btn-ghost btn-xs"
                                onClick$={(e) => {
                                  e.stopPropagation();
                                  moveComponent(component.id, 'up');
                                }}
                                disabled={component.order === 0}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                class="btn btn-ghost btn-xs"
                                onClick$={(e) => {
                                  e.stopPropagation();
                                  moveComponent(component.id, 'down');
                                }}
                                disabled={component.order === layoutStore.components.length - 1}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                class="btn btn-ghost btn-xs text-error"
                                onClick$={(e) => {
                                  e.stopPropagation();
                                  removeComponent(component.id);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            {selectedComponent.value && (
              <div class="w-80 bg-base-100 border-r border-base-200 p-4">
                {(() => {
                  const component = layoutStore.components.find(c => c.id === selectedComponent.value);
                  if (!component) return null;
                  
                  const template = COMPONENT_TEMPLATES[component.type];
                  
                  return (
                    <div>
                      <h3 class="font-semibold mb-4">
                        {template.icon} {template.name}
                      </h3>
                      
                      {/* Dynamic configuration form based on component type */}
                      <div class="space-y-4">
                        {component.type === 'hero' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Subtitle</span>
                              </label>
                              <textarea
                                class="textarea textarea-bordered textarea-sm"
                                value={component.config.subtitle || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'subtitle', (e.target as HTMLTextAreaElement).value)}
                              ></textarea>
                            </div>
                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showPricing}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showPricing', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Pricing</span>
                              </label>
                            </div>
                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showBooking}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showBooking', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Booking Button</span>
                              </label>
                            </div>
                          </>
                        )}
                        
                        {component.type === 'overview' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Content</span>
                              </label>
                              <textarea
                                class="textarea textarea-bordered h-24"
                                value={component.config.content || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'content', (e.target as HTMLTextAreaElement).value)}
                              ></textarea>
                            </div>
                          </>
                        )}

                        {component.type === 'pricing' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Layout Style</span>
                              </label>
                              <select
                                class="select select-bordered select-sm"
                                value={component.config.layout || 'cards'}
                                onChange$={(e) => updateComponentConfig(component.id, 'layout', (e.target as HTMLSelectElement).value)}
                              >
                                <option value="cards">Cards</option>
                                <option value="table">Table</option>
                                <option value="comparison">Comparison</option>
                              </select>
                            </div>
                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showComparison}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showComparison', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Comparison</span>
                              </label>
                            </div>
                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showOnlyAvailable}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showOnlyAvailable', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Only Available Packages</span>
                              </label>
                            </div>
                            <div class="alert alert-info alert-sm">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span class="text-xs">Pricing data is loaded from your managed packages. <Link href={`/admin/activities/${activity.id}/packages`} class="link">Manage Packages →</Link></span>
                            </div>
                          </>
                        )}
                        
                        {component.type === 'faq' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Layout Style</span>
                              </label>
                              <select
                                class="select select-bordered select-sm"
                                value={component.config.layout || 'accordion'}
                                onChange$={(e) => updateComponentConfig(component.id, 'layout', (e.target as HTMLSelectElement).value)}
                              >
                                <option value="accordion">Accordion</option>
                                <option value="cards">Cards</option>
                                <option value="columns">Two Columns</option>
                              </select>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showIcon}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showIcon', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Question Icons</span>
                              </label>
                            </div>

                            {component.config.layout === 'accordion' && (
                              <>
                                <div class="form-control">
                                  <label class="label cursor-pointer justify-start gap-2">
                                    <input
                                      type="checkbox"
                                      class="checkbox checkbox-sm"
                                      checked={component.config.expandFirst}
                                      onChange$={(e) => updateComponentConfig(component.id, 'expandFirst', (e.target as HTMLInputElement).checked)}
                                    />
                                    <span class="label-text">Expand First Question</span>
                                  </label>
                                </div>
                                
                                <div class="form-control">
                                  <label class="label cursor-pointer justify-start gap-2">
                                    <input
                                      type="checkbox"
                                      class="checkbox checkbox-sm"
                                      checked={component.config.allowMultiple}
                                      onChange$={(e) => updateComponentConfig(component.id, 'allowMultiple', (e.target as HTMLInputElement).checked)}
                                    />
                                    <span class="label-text">Allow Multiple Open</span>
                                  </label>
                                </div>
                              </>
                            )}

                            <div class="divider text-xs">FAQ Items</div>
                            
                            <div class="max-h-60 overflow-y-auto space-y-3">
                              {(component.config.faqs || []).map((faq: any, index: number) => (
                                <div key={index} class="border border-base-300 rounded-lg p-3">
                                  <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-medium">FAQ #{index + 1}</span>
                                    <button
                                      type="button"
                                      class="btn btn-ghost btn-xs text-error"
                                      onClick$={() => {
                                        const newFaqs = [...(component.config.faqs || [])];
                                        newFaqs.splice(index, 1);
                                        updateComponentConfig(component.id, 'faqs', newFaqs);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  
                                  <div class="form-control mb-2">
                                    <label class="label">
                                      <span class="label-text text-xs">Question</span>
                                    </label>
                                    <input
                                      type="text"
                                      class="input input-bordered input-sm"
                                      value={faq.question || ''}
                                      onInput$={(e) => {
                                        const newFaqs = [...(component.config.faqs || [])];
                                        newFaqs[index] = { ...newFaqs[index], question: (e.target as HTMLInputElement).value };
                                        updateComponentConfig(component.id, 'faqs', newFaqs);
                                      }}
                                      placeholder="Enter your question..."
                                    />
                                  </div>
                                  
                                  <div class="form-control">
                                    <label class="label">
                                      <span class="label-text text-xs">Answer</span>
                                    </label>
                                    <textarea
                                      class="textarea textarea-bordered textarea-sm resize-none"
                                      rows={3}
                                      value={faq.answer || ''}
                                      onInput$={(e) => {
                                        const newFaqs = [...(component.config.faqs || [])];
                                        newFaqs[index] = { ...newFaqs[index], answer: (e.target as HTMLTextAreaElement).value };
                                        updateComponentConfig(component.id, 'faqs', newFaqs);
                                      }}
                                      placeholder="Enter the answer..."
                                    ></textarea>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              class="btn btn-outline btn-sm btn-block"
                              onClick$={() => {
                                const newFaqs = [...(component.config.faqs || [])];
                                newFaqs.push({ 
                                  question: 'New question?', 
                                  answer: 'Your answer here...' 
                                });
                                updateComponentConfig(component.id, 'faqs', newFaqs);
                              }}
                            >
                              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add FAQ Item
                            </button>

                            {(!component.config.faqs || component.config.faqs.length === 0) && (
                              <div class="alert alert-info alert-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span class="text-xs">Add some FAQ items to get started. Consider common questions about booking, cancellation, what to bring, or suitability.</span>
                              </div>
                            )}

                            <div class="alert alert-warning alert-sm">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <span class="text-xs">
                                <strong>Pro tip:</strong> Keep answers concise and helpful. You can also create a global FAQ section and link common questions here.
                              </span>
                            </div>
                          </>
                        )}

                        {component.type === 'highlights' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Layout Style</span>
                              </label>
                              <select
                                class="select select-bordered select-sm"
                                value={component.config.layout || 'grid'}
                                onChange$={(e) => updateComponentConfig(component.id, 'layout', (e.target as HTMLSelectElement).value)}
                              >
                                <option value="list">Vertical List</option>
                                <option value="grid">Grid Layout</option>
                                <option value="cards">Card Layout</option>
                              </select>
                            </div>

                            {component.config.layout === 'grid' && (
                              <div class="form-control">
                                <label class="label">
                                  <span class="label-text">Grid Columns</span>
                                </label>
                                <select
                                  class="select select-bordered select-sm"
                                  value={component.config.columns || 2}
                                  onChange$={(e) => updateComponentConfig(component.id, 'columns', parseInt((e.target as HTMLSelectElement).value))}
                                >
                                  <option value={1}>1 Column</option>
                                  <option value={2}>2 Columns</option>
                                  <option value={3}>3 Columns</option>
                                  <option value={4}>4 Columns</option>
                                </select>
                              </div>
                            )}

                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Icon Style</span>
                              </label>
                              <select
                                class="select select-bordered select-sm"
                                value={component.config.iconStyle || 'emoji'}
                                onChange$={(e) => updateComponentConfig(component.id, 'iconStyle', (e.target as HTMLSelectElement).value)}
                              >
                                <option value="emoji">Custom Emoji</option>
                                <option value="checkmark">Green Checkmark</option>
                                <option value="star">Star Icon</option>
                                <option value="none">No Icons</option>
                              </select>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showIcons !== false}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showIcons', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Icons</span>
                              </label>
                            </div>

                            <div class="divider text-xs">Highlight Items</div>
                            
                            <div class="max-h-64 overflow-y-auto space-y-3">
                              {(component.config.items || []).map((item: any, index: number) => (
                                <div key={index} class="border border-base-300 rounded-lg p-3">
                                  <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-medium">Highlight #{index + 1}</span>
                                    <div class="flex gap-1">
                                      <button
                                        type="button"
                                        class="btn btn-ghost btn-xs"
                                        disabled={index === 0}
                                        onClick$={() => {
                                          const newItems = [...(component.config.items || [])];
                                          [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
                                          updateComponentConfig(component.id, 'items', newItems);
                                        }}
                                        title="Move up"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        class="btn btn-ghost btn-xs"
                                        disabled={index === (component.config.items || []).length - 1}
                                        onClick$={() => {
                                          const newItems = [...(component.config.items || [])];
                                          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
                                          updateComponentConfig(component.id, 'items', newItems);
                                        }}
                                        title="Move down"
                                      >
                                        ↓
                                      </button>
                                      <button
                                        type="button"
                                        class="btn btn-ghost btn-xs text-error"
                                        onClick$={() => {
                                          const newItems = [...(component.config.items || [])];
                                          newItems.splice(index, 1);
                                          updateComponentConfig(component.id, 'items', newItems);
                                        }}
                                        title="Remove"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {component.config.iconStyle === 'emoji' && (
                                    <div class="form-control mb-2">
                                      <label class="label">
                                        <span class="label-text text-xs">Icon Emoji</span>
                                      </label>
                                      <input
                                        type="text"
                                        class="input input-bordered input-sm"
                                        value={typeof item === 'object' ? item.icon || '🌟' : '🌟'}
                                        onInput$={(e) => {
                                          const newItems = [...(component.config.items || [])];
                                          if (typeof newItems[index] === 'string') {
                                            newItems[index] = { text: newItems[index], icon: (e.target as HTMLInputElement).value };
                                          } else {
                                            newItems[index] = { ...newItems[index], icon: (e.target as HTMLInputElement).value };
                                          }
                                          updateComponentConfig(component.id, 'items', newItems);
                                        }}
                                        placeholder="🌟"
                                        maxLength={2}
                                      />
                                    </div>
                                  )}
                                  
                                  <div class="form-control">
                                    <label class="label">
                                      <span class="label-text text-xs">Highlight Text</span>
                                    </label>
                                    <textarea
                                      class="textarea textarea-bordered textarea-sm resize-none"
                                      rows={2}
                                      value={typeof item === 'object' ? item.text || '' : item || ''}
                                      onInput$={(e) => {
                                        const newItems = [...(component.config.items || [])];
                                        if (typeof newItems[index] === 'string') {
                                          newItems[index] = (e.target as HTMLTextAreaElement).value;
                                        } else {
                                          newItems[index] = { ...newItems[index], text: (e.target as HTMLTextAreaElement).value };
                                        }
                                        updateComponentConfig(component.id, 'items', newItems);
                                      }}
                                      placeholder="Enter highlight description..."
                                    ></textarea>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              class="btn btn-outline btn-sm btn-block"
                              onClick$={() => {
                                const newItems = [...(component.config.items || [])];
                                if (component.config.iconStyle === 'emoji') {
                                  newItems.push({ text: 'New highlight', icon: '🌟' });
                                } else {
                                  newItems.push('New highlight');
                                }
                                updateComponentConfig(component.id, 'items', newItems);
                              }}
                            >
                              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Highlight
                            </button>

                            {(!component.config.items || component.config.items.length === 0) && (
                              <div class="alert alert-info alert-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span class="text-xs">Add some highlights to showcase key features of your activity. Think about what makes this experience special!</span>
                              </div>
                            )}

                            <div class="alert alert-success alert-sm">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span class="text-xs">
                                <strong>Best practices:</strong> Use 3-6 concise highlights. Focus on unique experiences, included services, or special features that set your activity apart.
                              </span>
                            </div>

                            <div class="stats stats-horizontal bg-base-200">
                              <div class="stat">
                                <div class="stat-title text-xs">Total Highlights</div>
                                <div class="stat-value text-lg">{(component.config.items || []).length}</div>
                              </div>
                              <div class="stat">
                                <div class="stat-title text-xs">Layout</div>
                                <div class="stat-value text-sm capitalize">{component.config.layout || 'grid'}</div>
                              </div>
                            </div>
                          </>
                        )}

                        {component.type === 'gallery' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Gallery Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                                placeholder="Leave empty to hide title"
                              />
                            </div>
                            
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Layout Style</span>
                              </label>
                              <select
                                class="select select-bordered select-sm"
                                value={component.config.layout || 'grid'}
                                onChange$={(e) => updateComponentConfig(component.id, 'layout', (e.target as HTMLSelectElement).value)}
                              >
                                <option value="grid">Grid Layout</option>
                                <option value="carousel">Carousel/Slider</option>
                                <option value="masonry">Masonry Layout</option>
                              </select>
                            </div>

                            {component.config.layout === 'grid' && (
                              <>
                                <div class="form-control">
                                  <label class="label">
                                    <span class="label-text">Grid Columns</span>
                                  </label>
                                  <select
                                    class="select select-bordered select-sm"
                                    value={component.config.columns || 3}
                                    onChange$={(e) => updateComponentConfig(component.id, 'columns', parseInt((e.target as HTMLSelectElement).value))}
                                  >
                                    <option value={2}>2 Columns</option>
                                    <option value={3}>3 Columns</option>
                                    <option value={4}>4 Columns</option>
                                    <option value={5}>5 Columns</option>
                                    <option value={6}>6 Columns</option>
                                  </select>
                                </div>
                                
                                <div class="form-control">
                                  <label class="label">
                                    <span class="label-text">Image Aspect Ratio</span>
                                  </label>
                                  <select
                                    class="select select-bordered select-sm"
                                    value={component.config.aspectRatio || 'square'}
                                    onChange$={(e) => updateComponentConfig(component.id, 'aspectRatio', (e.target as HTMLSelectElement).value)}
                                  >
                                    <option value="square">Square (1:1)</option>
                                    <option value="landscape">Landscape (16:9)</option>
                                    <option value="portrait">Portrait (4:5)</option>
                                    <option value="auto">Auto (Natural)</option>
                                  </select>
                                </div>
                              </>
                            )}

                            {component.config.layout === 'carousel' && (
                              <>
                                <div class="form-control">
                                  <label class="label cursor-pointer justify-start gap-2">
                                    <input
                                      type="checkbox"
                                      class="checkbox checkbox-sm"
                                      checked={component.config.autoplay}
                                      onChange$={(e) => updateComponentConfig(component.id, 'autoplay', (e.target as HTMLInputElement).checked)}
                                    />
                                    <span class="label-text">Auto-play Carousel</span>
                                  </label>
                                </div>

                                {component.config.autoplay && (
                                  <div class="form-control">
                                    <label class="label">
                                      <span class="label-text">Auto-play Speed (seconds)</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="10"
                                      class="input input-bordered input-sm"
                                      value={component.config.autoplaySpeed / 1000 || 3}
                                      onChange$={(e) => updateComponentConfig(component.id, 'autoplaySpeed', parseInt((e.target as HTMLInputElement).value) * 1000)}
                                    />
                                  </div>
                                )}
                              </>
                            )}

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showCaptions}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showCaptions', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Image Captions</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.enableLightbox}
                                  onChange$={(e) => updateComponentConfig(component.id, 'enableLightbox', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Enable Lightbox/Zoom</span>
                              </label>
                            </div>

                            <div class="divider text-xs">Gallery Images</div>

                            <div class="alert alert-info alert-sm">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span class="text-xs">Gallery images will be loaded from your activity's media library. Upload images in the main activity settings.</span>
                            </div>

                            <div class="stats stats-horizontal bg-base-200">
                              <div class="stat">
                                <div class="stat-title text-xs">Layout</div>
                                <div class="stat-value text-sm capitalize">{component.config.layout || 'grid'}</div>
                              </div>
                              {component.config.layout === 'grid' && (
                                <div class="stat">
                                  <div class="stat-title text-xs">Columns</div>
                                  <div class="stat-value text-lg">{component.config.columns || 3}</div>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {component.type === 'itinerary' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Layout Style</span>
                              </label>
                              <select
                                class="select select-bordered select-sm"
                                value={component.config.layout || 'timeline'}
                                onChange$={(e) => updateComponentConfig(component.id, 'layout', (e.target as HTMLSelectElement).value)}
                              >
                                <option value="timeline">Timeline</option>
                                <option value="cards">Cards</option>
                                <option value="tabs">Tabs</option>
                              </select>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showTime}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showTime', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Time Information</span>
                              </label>
                            </div>

                            <div class="divider text-xs">Itinerary Items</div>
                            
                            <div class="max-h-64 overflow-y-auto space-y-3">
                              {(component.config.items || []).map((item: any, index: number) => (
                                <div key={index} class="border border-base-300 rounded-lg p-3">
                                  <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-medium">Stop #{index + 1}</span>
                                    <div class="flex gap-1">
                                      <button
                                        type="button"
                                        class="btn btn-ghost btn-xs"
                                        disabled={index === 0}
                                        onClick$={() => {
                                          const newItems = [...(component.config.items || [])];
                                          [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
                                          updateComponentConfig(component.id, 'items', newItems);
                                        }}
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        class="btn btn-ghost btn-xs"
                                        disabled={index === (component.config.items || []).length - 1}
                                        onClick$={() => {
                                          const newItems = [...(component.config.items || [])];
                                          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
                                          updateComponentConfig(component.id, 'items', newItems);
                                        }}
                                      >
                                        ↓
                                      </button>
                                      <button
                                        type="button"
                                        class="btn btn-ghost btn-xs text-error"
                                        onClick$={() => {
                                          const newItems = [...(component.config.items || [])];
                                          newItems.splice(index, 1);
                                          updateComponentConfig(component.id, 'items', newItems);
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {component.config.showTime && (
                                    <div class="form-control mb-2">
                                      <label class="label">
                                        <span class="label-text text-xs">Time</span>
                                      </label>
                                      <input
                                        type="time"
                                        class="input input-bordered input-sm"
                                        value={item.time || ''}
                                        onInput$={(e) => {
                                          const newItems = [...(component.config.items || [])];
                                          newItems[index] = { ...newItems[index], time: (e.target as HTMLInputElement).value };
                                          updateComponentConfig(component.id, 'items', newItems);
                                        }}
                                      />
                                    </div>
                                  )}
                                  
                                  <div class="form-control mb-2">
                                    <label class="label">
                                      <span class="label-text text-xs">Title</span>
                                    </label>
                                    <input
                                      type="text"
                                      class="input input-bordered input-sm"
                                      value={item.title || ''}
                                      onInput$={(e) => {
                                        const newItems = [...(component.config.items || [])];
                                        newItems[index] = { ...newItems[index], title: (e.target as HTMLInputElement).value };
                                        updateComponentConfig(component.id, 'items', newItems);
                                      }}
                                      placeholder="Stop title..."
                                    />
                                  </div>
                                  
                                  <div class="form-control">
                                    <label class="label">
                                      <span class="label-text text-xs">Description</span>
                                    </label>
                                    <textarea
                                      class="textarea textarea-bordered textarea-sm resize-none"
                                      rows={2}
                                      value={item.description || ''}
                                      onInput$={(e) => {
                                        const newItems = [...(component.config.items || [])];
                                        newItems[index] = { ...newItems[index], description: (e.target as HTMLTextAreaElement).value };
                                        updateComponentConfig(component.id, 'items', newItems);
                                      }}
                                      placeholder="What happens at this stop..."
                                    ></textarea>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              class="btn btn-outline btn-sm btn-block"
                              onClick$={() => {
                                const newItems = [...(component.config.items || [])];
                                newItems.push({ 
                                  title: 'New Stop', 
                                  description: 'Description of this itinerary item...',
                                  time: component.config.showTime ? '09:00' : undefined
                                });
                                updateComponentConfig(component.id, 'items', newItems);
                              }}
                            >
                              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Itinerary Stop
                            </button>

                            {(!component.config.items || component.config.items.length === 0) && (
                              <div class="alert alert-info alert-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span class="text-xs">Add itinerary stops to show guests what to expect during the activity.</span>
                              </div>
                            )}
                          </>
                        )}

                        {component.type === 'inclusions' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showExclusions}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showExclusions', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Exclusions Section</span>
                              </label>
                            </div>

                            <div class="divider text-xs">What's Included</div>
                            
                            <div class="max-h-48 overflow-y-auto space-y-2">
                              {(component.config.inclusions || []).map((item: string, index: number) => (
                                <div key={index} class="flex gap-2">
                                  <input
                                    type="text"
                                    class="input input-bordered input-sm flex-1"
                                    value={item}
                                    onInput$={(e) => {
                                      const newItems = [...(component.config.inclusions || [])];
                                      newItems[index] = (e.target as HTMLInputElement).value;
                                      updateComponentConfig(component.id, 'inclusions', newItems);
                                    }}
                                    placeholder="What's included..."
                                  />
                                  <button
                                    type="button"
                                    class="btn btn-ghost btn-sm text-error"
                                    onClick$={() => {
                                      const newItems = [...(component.config.inclusions || [])];
                                      newItems.splice(index, 1);
                                      updateComponentConfig(component.id, 'inclusions', newItems);
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              class="btn btn-outline btn-sm btn-block"
                              onClick$={() => {
                                const newItems = [...(component.config.inclusions || [])];
                                newItems.push('New inclusion');
                                updateComponentConfig(component.id, 'inclusions', newItems);
                              }}
                            >
                              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Inclusion
                            </button>

                            {component.config.showExclusions && (
                              <>
                                <div class="divider text-xs">What's Not Included</div>
                                
                                <div class="max-h-48 overflow-y-auto space-y-2">
                                  {(component.config.exclusions || []).map((item: string, index: number) => (
                                    <div key={index} class="flex gap-2">
                                      <input
                                        type="text"
                                        class="input input-bordered input-sm flex-1"
                                        value={item}
                                        onInput$={(e) => {
                                          const newItems = [...(component.config.exclusions || [])];
                                          newItems[index] = (e.target as HTMLInputElement).value;
                                          updateComponentConfig(component.id, 'exclusions', newItems);
                                        }}
                                        placeholder="What's not included..."
                                      />
                                      <button
                                        type="button"
                                        class="btn btn-ghost btn-sm text-error"
                                        onClick$={() => {
                                          const newItems = [...(component.config.exclusions || [])];
                                          newItems.splice(index, 1);
                                          updateComponentConfig(component.id, 'exclusions', newItems);
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  class="btn btn-outline btn-sm btn-block"
                                  onClick$={() => {
                                    const newItems = [...(component.config.exclusions || [])];
                                    newItems.push('New exclusion');
                                    updateComponentConfig(component.id, 'exclusions', newItems);
                                  }}
                                >
                                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Add Exclusion
                                </button>
                              </>
                            )}
                          </>
                        )}

                        {component.type === 'booking' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Subtitle</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.subtitle || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'subtitle', (e.target as HTMLInputElement).value)}
                                placeholder="e.g., Select your preferred date and package"
                              />
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showCalendar}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showCalendar', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Date Calendar</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showTimeSlots}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showTimeSlots', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Time Slot Selection</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showGuestSelector}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showGuestSelector', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Guest Number Selector</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.allowGroupBooking}
                                  onChange$={(e) => updateComponentConfig(component.id, 'allowGroupBooking', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Allow Group Bookings</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Minimum Advance Booking (days)</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="365"
                                class="input input-bordered input-sm"
                                value={component.config.requireAdvanceBooking || 1}
                                onChange$={(e) => updateComponentConfig(component.id, 'requireAdvanceBooking', parseInt((e.target as HTMLInputElement).value))}
                              />
                            </div>

                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Maximum Advance Booking (days)</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="365"
                                class="input input-bordered input-sm"
                                value={component.config.maxAdvanceBooking || 90}
                                onChange$={(e) => updateComponentConfig(component.id, 'maxAdvanceBooking', parseInt((e.target as HTMLInputElement).value))}
                              />
                            </div>

                            <div class="alert alert-info alert-sm">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span class="text-xs">The booking widget will integrate with your booking system and show real availability.</span>
                            </div>
                          </>
                        )}

                        {component.type === 'location' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Address</span>
                              </label>
                              <textarea
                                class="textarea textarea-bordered textarea-sm"
                                rows={2}
                                value={component.config.address || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'address', (e.target as HTMLTextAreaElement).value)}
                                placeholder="Full address or location description..."
                              ></textarea>
                            </div>

                            <div class="grid grid-cols-2 gap-2">
                              <div class="form-control">
                                <label class="label">
                                  <span class="label-text">Latitude</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.000001"
                                  class="input input-bordered input-sm"
                                  value={component.config.latitude || ''}
                                  onInput$={(e) => updateComponentConfig(component.id, 'latitude', (e.target as HTMLInputElement).value)}
                                  placeholder="4.175569"
                                />
                              </div>
                              
                              <div class="form-control">
                                <label class="label">
                                  <span class="label-text">Longitude</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.000001"
                                  class="input input-bordered input-sm"
                                  value={component.config.longitude || ''}
                                  onInput$={(e) => updateComponentConfig(component.id, 'longitude', (e.target as HTMLInputElement).value)}
                                  placeholder="73.509674"
                                />
                              </div>
                            </div>

                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Meeting Instructions</span>
                              </label>
                              <textarea
                                class="textarea textarea-bordered textarea-sm"
                                rows={3}
                                value={component.config.meetingInstructions || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'meetingInstructions', (e.target as HTMLTextAreaElement).value)}
                                placeholder="Specific instructions for finding the meeting point..."
                              ></textarea>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showMap}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showMap', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Interactive Map</span>
                              </label>
                            </div>

                            {component.config.showMap && (
                              <div class="form-control">
                                <label class="label">
                                  <span class="label-text">Map Zoom Level</span>
                                </label>
                                <input
                                  type="range"
                                  min="10"
                                  max="18"
                                  class="range range-sm"
                                  value={component.config.mapZoom || 15}
                                  onChange$={(e) => updateComponentConfig(component.id, 'mapZoom', parseInt((e.target as HTMLInputElement).value))}
                                />
                                <div class="w-full flex justify-between text-xs px-2">
                                  <span>City</span>
                                  <span>Street</span>
                                </div>
                              </div>
                            )}

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showTransport}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showTransport', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Transport Options</span>
                              </label>
                            </div>

                            {component.config.showTransport && (
                              <>
                                <div class="divider text-xs">Transport Options</div>
                                
                                <div class="space-y-2">
                                  {(component.config.transportOptions || []).map((option: string, index: number) => (
                                    <div key={index} class="flex gap-2">
                                      <input
                                        type="text"
                                        class="input input-bordered input-sm flex-1"
                                        value={option}
                                        onInput$={(e) => {
                                          const newOptions = [...(component.config.transportOptions || [])];
                                          newOptions[index] = (e.target as HTMLInputElement).value;
                                          updateComponentConfig(component.id, 'transportOptions', newOptions);
                                        }}
                                        placeholder="Transport option..."
                                      />
                                      <button
                                        type="button"
                                        class="btn btn-ghost btn-sm text-error"
                                        onClick$={() => {
                                          const newOptions = [...(component.config.transportOptions || [])];
                                          newOptions.splice(index, 1);
                                          updateComponentConfig(component.id, 'transportOptions', newOptions);
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  class="btn btn-outline btn-sm btn-block"
                                  onClick$={() => {
                                    const newOptions = [...(component.config.transportOptions || [])];
                                    newOptions.push('New transport option');
                                    updateComponentConfig(component.id, 'transportOptions', newOptions);
                                  }}
                                >
                                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Add Transport Option
                                </button>
                              </>
                            )}

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showDirections}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showDirections', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show 'Get Directions' Button</span>
                              </label>
                            </div>
                          </>
                        )}

                        {component.type === 'reviews' && (
                          <>
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Section Title</span>
                              </label>
                              <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={component.config.title || ''}
                                onInput$={(e) => updateComponentConfig(component.id, 'title', (e.target as HTMLInputElement).value)}
                              />
                            </div>
                            
                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Layout Style</span>
                              </label>
                              <select
                                class="select select-bordered select-sm"
                                value={component.config.layout || 'cards'}
                                onChange$={(e) => updateComponentConfig(component.id, 'layout', (e.target as HTMLSelectElement).value)}
                              >
                                <option value="cards">Card Grid</option>
                                <option value="list">Vertical List</option>
                                <option value="carousel">Horizontal Carousel</option>
                              </select>
                            </div>

                            <div class="form-control">
                              <label class="label">
                                <span class="label-text">Maximum Reviews to Display</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                class="input input-bordered input-sm"
                                value={component.config.maxReviews || 6}
                                onChange$={(e) => updateComponentConfig(component.id, 'maxReviews', parseInt((e.target as HTMLInputElement).value))}
                              />
                            </div>

                            <div class="divider text-xs">Display Options</div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showRating}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showRating', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Star Ratings</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showAverageRating}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showAverageRating', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Average Rating Summary</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showReviewCount}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showReviewCount', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Review Count</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showReviewerName}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showReviewerName', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Reviewer Names</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showReviewDate}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showReviewDate', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Review Dates</span>
                              </label>
                            </div>

                            <div class="form-control">
                              <label class="label cursor-pointer justify-start gap-2">
                                <input
                                  type="checkbox"
                                  class="checkbox checkbox-sm"
                                  checked={component.config.showVerifiedBadge}
                                  onChange$={(e) => updateComponentConfig(component.id, 'showVerifiedBadge', (e.target as HTMLInputElement).checked)}
                                />
                                <span class="label-text">Show Verified Purchase Badge</span>
                              </label>
                            </div>

                            <div class="alert alert-info alert-sm">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span class="text-xs">Reviews will be loaded from your booking system and guest feedback automatically.</span>
                            </div>
                          </>
                        )}
                        
                        {/* Add more component-specific configurations */}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {/* Main Canvas */}
        <div class="flex-1 bg-base-200 overflow-auto">
          <div class="max-w-4xl mx-auto bg-white min-h-full">
            {layoutStore.components.length === 0 ? (
              <div class="text-center py-20">
                <div class="text-6xl mb-4">🎨</div>
                <h3 class="text-xl font-semibold mb-2">Start Building Your Activity Page</h3>
                <p class="text-base-content/70 mb-6">
                  Add components from the sidebar to create an engaging activity page.
                </p>
              </div>
            ) : (
              <div>
                {sortedComponents.value.map((component) => (
                    <ComponentPreview
                      key={component.id}
                      component={component}
                      activity={activity}
                      isSelected={selectedComponent.value === component.id}
                      onSelect$={() => selectedComponent.value = component.id}
                      previewMode={previewMode.value}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Success Message */}
      {saveLayout.value?.success && (
        <div class="toast toast-end">
          <div class="alert alert-success">
            <span>{saveLayout.value.message}</span>
          </div>
        </div>
      )}
    </div>
  );
});

const ComponentPreview = component$<{
  component: PageComponent;
  activity: any;
  isSelected: boolean;
  onSelect$: QRL<() => void>;
  previewMode: boolean;
}>(({ component, activity, isSelected, onSelect$, previewMode }) => {
  const template = COMPONENT_TEMPLATES[component.type];
  
  return (
    <div
      class={`relative ${previewMode ? '' : 'border-2 border-dashed border-transparent hover:border-base-300 cursor-pointer'} ${
        isSelected && !previewMode ? 'border-primary' : ''
      }`}
      onClick$={onSelect$}
    >
      {!previewMode && (
        <div class="absolute top-2 left-2 z-10 badge badge-primary badge-sm">
          {template.icon} {template.name}
        </div>
      )}
      
      {/* Render component based on type */}
      {component.type === 'hero' && (
        <div class="relative h-96 bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center text-white">
          <div class="text-center max-w-2xl px-8">
            <h1 class="text-4xl font-bold mb-4">
              {component.config.title || activity.title}
            </h1>
            <p class="text-xl mb-8">
              {component.config.subtitle || 'Discover the beauty of the Maldives'}
            </p>
            {component.config.showPricing && (
              <div class="mb-6">
                <span class="text-3xl font-bold">From ${activity.base_price}</span>
                <span class="text-lg"> per person</span>
              </div>
            )}
            {component.config.showBooking && (
              <button class="btn btn-primary btn-lg">Book Now</button>
            )}
          </div>
        </div>
      )}
      
      {component.type === 'overview' && (
        <div class="p-8 bg-base-100">
          <h2 class="text-2xl font-bold mb-4 text-base-content">
            {component.config.title}
          </h2>
          <div class="prose max-w-none">
            {component.config.content ? (
              <p class="text-base-content leading-relaxed">{component.config.content}</p>
            ) : (
              <p class="text-base-content/60 italic">
                Add description content in the properties panel
              </p>
            )}
          </div>
        </div>
      )}
      
      {component.type === 'gallery' && (
        <div class="p-8 bg-base-100">
          <h2 class="text-2xl font-bold mb-6 text-center text-base-content">Photo Gallery</h2>
          <div class="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} class="aspect-square bg-base-200 rounded-lg flex items-center justify-center border border-base-300">
                <span class="text-base-content/40 text-2xl">📷</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {component.type === 'pricing' && (
        <div class="p-8 bg-base-100">
          <h2 class="text-2xl font-bold mb-6 text-center text-base-content">
            {component.config.title || 'Choose Your Package'}
          </h2>
          
          <div class={`gap-6 ${
            component.config.layout === 'table' ? 'block' :
            component.config.layout === 'comparison' ? 'grid grid-cols-1 lg:grid-cols-3' :
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {/* Mock package preview */}
            {[1, 2, 3].map((i) => (
              <div key={i} class="card bg-base-100 shadow-lg border border-base-200">
                <div class="card-body">
                  <h3 class="card-title text-lg text-base-content">
                    Sample Package {i}
                    {i === 2 && component.config.highlightRecommended && (
                      <div class="badge badge-primary">Recommended</div>
                    )}
                  </h3>
                  <p class="text-base-content/60 mb-4">
                    Experience the best of the Maldives with this comprehensive package
                  </p>
                  <div class="text-2xl font-bold text-primary mb-4">
                    ${50 * i}.00 <span class="text-sm text-base-content/60">USD</span>
                  </div>
                  <ul class="text-sm space-y-1 mb-4 text-base-content">
                    <li class="flex items-center gap-2"><span class="text-success">✅</span> Transportation included</li>
                    <li class="flex items-center gap-2"><span class="text-success">✅</span> Professional guide</li>
                    <li class="flex items-center gap-2"><span class="text-success">✅</span> Equipment provided</li>
                    {i > 1 && <li class="flex items-center gap-2"><span class="text-success">✅</span> Premium amenities</li>}
                    {i > 2 && <li class="flex items-center gap-2"><span class="text-success">✅</span> VIP treatment</li>}
                  </ul>
                  <button class="btn btn-primary btn-block">Select Package</button>
                </div>
              </div>
            ))}
            
            {component.config.layout === 'table' && (
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr class="text-base-content">
                      <th class="text-base-content font-semibold">Package</th>
                      <th class="text-base-content font-semibold">Price</th>
                      <th class="text-base-content font-semibold">Features</th>
                      <th class="text-base-content font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} class="text-base-content">
                        <td class="font-medium">Sample Package {i}</td>
                        <td class="text-primary font-bold">${50 * i}.00</td>
                        <td class="text-base-content/70">{2 + i} features</td>
                        <td><button class="btn btn-primary btn-sm">Select</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {!previewMode && (
            <div class="mt-6 p-4 bg-base-200 rounded-lg border border-base-300">
              <p class="text-sm text-base-content/60 text-center">
                📦 This will show your actual packages from the packages manager. <br/>
                <Link href={`/admin/activities/${activity.id}/packages`} class="link text-primary hover:text-primary-focus">
                  Manage packages to see real data →
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Add more component renderings */}
      {!['hero', 'description', 'gallery', 'pricing'].includes(component.type) && (
        <div class="p-8 bg-base-200 text-center border border-base-300">
          <div class="text-4xl mb-2">{template.icon}</div>
          <h3 class="text-lg font-semibold text-base-content">{template.name}</h3>
          <p class="text-sm text-base-content/60">{template.description}</p>
          <div class="mt-4 px-3 py-1 bg-base-100 rounded-full inline-block">
            <span class="text-xs text-base-content/50">Component Preview</span>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Activity Builder • Admin • Rihigo",
  meta: [
    {
      name: "description",
      content: "Build activity pages with drag-and-drop components",
    },
  ],
};
