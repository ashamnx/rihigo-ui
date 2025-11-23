import { component$ } from '@builder.io/qwik';

interface DescriptionComponentProps {
  title?: string;
  content: string;
}

export const DescriptionComponent = component$<DescriptionComponentProps>(
  (props) => {
    return (
      <div class="container mx-auto px-4 py-12">
        {props.title && (
          <h2 class="text-3xl font-bold mb-6">{props.title}</h2>
        )}
        <div
          class="prose lg:prose-xl max-w-none"
          dangerouslySetInnerHTML={props.content}
        />
      </div>
    );
  }
);
