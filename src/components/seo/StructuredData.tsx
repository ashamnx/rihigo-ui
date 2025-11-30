import { component$ } from '@builder.io/qwik';
import { serializeSchema } from '~/utils/seo';

interface StructuredDataProps {
  schema: object | object[];
}

/**
 * Component to inject JSON-LD structured data into the page head
 * Use in documentHead scripts or directly in page components
 */
export const StructuredData = component$<StructuredDataProps>(({ schema }) => {
  const jsonLd = serializeSchema(schema);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd}
    />
  );
});

/**
 * Generate script object for use in DocumentHead
 * Use this in the head export of page components
 */
export function structuredDataScript(schema: object | object[]): {
  script: string;
  props: { type: string };
} {
  return {
    script: serializeSchema(schema),
    props: { type: 'application/ld+json' },
  };
}
