import { component$ } from '@builder.io/qwik';

interface HighlightsComponentProps {
  title?: string;
  items: Array<{
    icon?: string;
    title: string;
    description?: string;
  }>;
}

export const HighlightsComponent = component$<HighlightsComponentProps>(
  (props) => {
    return (
      <div class="container mx-auto px-4 py-12">
        {props.title && (
          <h2 class="text-3xl font-bold mb-8 text-center">{props.title}</h2>
        )}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {props.items?.map((item, index) => (
            <div key={index} class="card bg-base-100 shadow-xl">
              <div class="card-body">
                {item.icon && (
                  <div class="text-4xl mb-2">{item.icon}</div>
                )}
                <h3 class="card-title">{item.title}</h3>
                {item.description && <p>{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
