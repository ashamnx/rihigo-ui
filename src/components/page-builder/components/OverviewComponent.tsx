import { component$ } from '@builder.io/qwik';

interface OverviewComponentProps {
  title?: string;
  content?: string;
  duration?: string;
  groupSize?: string;
  languages?: string[];
  features?: string[];
  showDuration?: boolean;
  showGroupSize?: boolean;
  showLanguages?: boolean;
  showReadMore?: boolean;
}

export const OverviewComponent = component$<OverviewComponentProps>((props) => {
  const {
    title = 'About This Activity',
    content = '',
    duration,
    groupSize,
    languages = [],
    features = [],
    showDuration = true,
    showGroupSize = true,
    showLanguages = true,
  } = props;

  return (
    <div class="overview-component bg-white rounded-lg p-6 md:p-8">
      <h2 class="text-2xl md:text-3xl font-bold mb-6">{title}</h2>

      {/* Quick Info Grid */}
      {(showDuration || showGroupSize || showLanguages) && (duration || groupSize || languages.length > 0) && (
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 pb-8 border-b border-gray-200">
          {showDuration && duration && (
            <div class="flex items-center gap-3">
              <div class="bg-indigo-100 p-3 rounded-lg">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Duration</p>
                <p class="font-semibold">{duration}</p>
              </div>
            </div>
          )}

          {showGroupSize && groupSize && (
            <div class="flex items-center gap-3">
              <div class="bg-indigo-100 p-3 rounded-lg">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Group Size</p>
                <p class="font-semibold">{groupSize}</p>
              </div>
            </div>
          )}

          {showLanguages && languages.length > 0 && (
            <div class="flex items-center gap-3">
              <div class="bg-indigo-100 p-3 rounded-lg">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Languages</p>
                <p class="font-semibold">{languages.join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {content && (
        <div class="prose max-w-none mb-8">
          <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}

      {/* Features List */}
      {features && features.length > 0 && (
        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="font-semibold mb-4">Highlights</h3>
          <ul class="space-y-3">
            {features.map((feature, idx) => (
              <li key={idx} class="flex items-start gap-3">
                <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span class="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
