import { component$ } from '@builder.io/qwik';
import type { ItineraryComponentProps } from '~/types/activity';

export const ItineraryComponent = component$<ItineraryComponentProps>(
  (props) => {
    return (
      <div class="container mx-auto px-4 py-12">
        <h2 class="text-3xl font-bold mb-8 text-center">Itinerary</h2>
        <ul class="timeline timeline-vertical">
          {props.steps.map((step, index) => (
            <li key={index}>
              {index > 0 && <hr />}
              <div class="timeline-start">{step.time}</div>
              <div class="timeline-middle">
                {step.icon ? (
                  <span class="text-2xl">{step.icon}</span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clip-rule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div class="timeline-end timeline-box">
                <h3 class="font-bold">{step.title}</h3>
                <p class="text-sm">{step.description}</p>
              </div>
              {index < props.steps.length - 1 && <hr />}
            </li>
          ))}
        </ul>
      </div>
    );
  }
);
