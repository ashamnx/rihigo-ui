import {component$} from '@builder.io/qwik';
import type { Activity, PageComponent } from "~/types/activity";
import {HeroComponent} from './components/HeroComponent';
import {ActivityHeroComponent} from './components/ActivityHeroComponent';
import {ItineraryComponent} from './components/ItineraryComponent';
import {FAQComponent} from './components/FAQComponent';
import {GalleryComponent} from './components/GalleryComponent';
import {HighlightsComponent} from './components/HighlightsComponent';
import {OverviewComponent} from './components/OverviewComponent';
import {InclusionsComponent} from './components/InclusionsComponent';
import {PricingComponent} from './components/PricingComponent';

interface PageRendererProps {
    components: PageComponent[];
    activity: Activity;
}

export const PageRenderer = component$<PageRendererProps>((props) => {
    if (props.components.length === 0) {
        return null;
    }

    return (
        <div class="page-renderer space-y-8">
            {props.components.map((comp, index) => {
                // Handle both formats: comp.config and comp.props
                const componentProps = (comp as any).config ?? comp.props ?? {};

                switch (comp.type) {
                    case 'hero':
                        return <HeroComponent key={index} {...props.activity.seo_metadata } />;
                    case 'activity-hero':
                        return <ActivityHeroComponent key={index} {...componentProps} />;
                    case 'itinerary':
                        return <ItineraryComponent key={index} {...componentProps} />;
                    case 'faq':
                        return <FAQComponent key={index} {...componentProps} />;
                    case 'gallery':
                        return <GalleryComponent key={index} {...componentProps} />;
                    case 'description':
                    case 'overview':
                        return <OverviewComponent key={index} {...componentProps} />;
                    case 'highlights':
                        return <HighlightsComponent key={index} {...componentProps} />;
                    case 'inclusions':
                        return <InclusionsComponent key={index} {...componentProps} />;
                    case 'pricing':
                        return <PricingComponent key={index} {...componentProps} />;
                    default:
                        console.warn(`Unknown component type: ${comp.type}`, comp);
                        // Show a placeholder for unknown types in development
                        return (
                            <div key={index} class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p class="text-sm text-yellow-800">
                                    Unknown component type: <strong>{comp.type}</strong>
                                </p>
                                <pre class="text-xs mt-2 overflow-auto">{JSON.stringify(componentProps, null, 2)}</pre>
                            </div>
                        );
                }
            })}
        </div>
    );
});
