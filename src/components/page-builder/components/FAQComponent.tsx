import { component$ } from '@builder.io/qwik';
import type { FAQComponentProps } from '~/types/activity';

export const FAQComponent = component$<FAQComponentProps>((props) => {
  return (
    <div class="container mx-auto px-4 py-12">
      <h2 class="text-3xl font-bold mb-8 text-center">
        Frequently Asked Questions
      </h2>
      <div class="space-y-4 max-w-3xl mx-auto">
        {props.items.map((item, index) => (
          <div key={index} class="collapse collapse-plus bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div class="collapse-title text-xl font-medium">
              {item.question}
            </div>
            <div class="collapse-content">
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
