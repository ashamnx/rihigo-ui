import { component$ } from '@builder.io/qwik';

interface InclusionsComponentProps {
  title?: string;
  inclusions?: string[];
  exclusions?: string[];
  showExclusions?: boolean;
}

export const InclusionsComponent = component$<InclusionsComponentProps>((props) => {
  const {
    title = "What's Included",
    inclusions = [],
    exclusions = [],
    showExclusions = true,
  } = props;

  return (
    <div class="inclusions-component bg-white rounded-lg p-6 md:p-8">
      <h2 class="text-2xl md:text-3xl font-bold mb-6">{title}</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inclusions */}
        {inclusions && inclusions.length > 0 && (
          <div class="bg-green-50 rounded-lg p-6">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <h3 class="font-semibold text-green-900">Included</h3>
            </div>
            <ul class="space-y-3">
              {inclusions.map((item, idx) => (
                <li key={idx} class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-green-900">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exclusions */}
        {showExclusions && exclusions && exclusions.length > 0 && (
          <div class="bg-red-50 rounded-lg p-6">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              <h3 class="font-semibold text-red-900">Not Included</h3>
            </div>
            <ul class="space-y-3">
              {exclusions.map((item, idx) => (
                <li key={idx} class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-red-900">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Note */}
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          Please confirm all inclusions and exclusions with your provider before booking.
        </p>
      </div>
    </div>
  );
});
