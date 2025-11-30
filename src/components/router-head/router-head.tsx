import {component$} from "@builder.io/qwik";
import {useDocumentHead, useLocation} from "@builder.io/qwik-city";
import {generateOrganizationSchema, generateWebSiteSchema, serializeSchema} from "~/utils/seo";

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
    const head = useDocumentHead();
    const loc = useLocation();

    // Generate global schemas
    const globalSchemas = [
        generateOrganizationSchema(),
        generateWebSiteSchema(false),
    ];

    return (
        <>
            <title>{head.title}</title>

            <link rel="canonical" href={loc.url.href}/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <link rel="icon" type="image/svg+xml" href="/assets/logo_min.svg"/>
            <link rel="apple-touch-icon" href="/assets/logo_min.svg"/>

            {/* Theme and mobile app meta */}
            <meta name="theme-color" content="#4F46E5"/>
            <meta name="apple-mobile-web-app-capable" content="yes"/>
            <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
            <meta name="apple-mobile-web-app-title" content="Rihigo"/>
            <meta name="application-name" content="Rihigo"/>

            {/* Geo meta tags for Maldives */}
            <meta name="geo.region" content="MV"/>
            <meta name="geo.placename" content="Maldives"/>
            <meta name="geo.position" content="4.1755;73.5093"/>
            <meta name="ICBM" content="4.1755, 73.5093"/>

            <link rel="preconnect" href="https://fonts.googleapis.com"/>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
            <link
                href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap"
                rel="stylesheet"/>

            {head.meta.map((m) => (
                <meta key={m.key} {...m} />
            ))}

            {head.links.map((l) => (
                <link key={l.key} {...l} />
            ))}

            {head.styles.map((s) => (
                <style
                    key={s.key}
                    {...s.props}
                    {...(s.props?.dangerouslySetInnerHTML
                        ? {}
                        : {dangerouslySetInnerHTML: s.style})}
                />
            ))}

            {head.scripts.map((s) => (
                <script
                    key={s.key}
                    {...s.props}
                    {...(s.props?.dangerouslySetInnerHTML
                        ? {}
                        : {dangerouslySetInnerHTML: s.script})}
                />
            ))}

            {/* Global Organization and WebSite Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={serializeSchema(globalSchemas)}
            />
        </>
    );
});
