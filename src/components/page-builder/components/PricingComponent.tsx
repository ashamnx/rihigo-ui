import { component$ } from '@builder.io/qwik';

interface PricingComponentProps {
  title?: string;
  layout?: 'table' | 'cards' | 'list';
  usePackageSystem?: boolean;
  showOnlyAvailable?: boolean;
  showComparison?: boolean;
  highlightRecommended?: boolean;
}

export const PricingComponent = component$<PricingComponentProps>((props) => {
  const {
    title = 'Choose Your Package',
    usePackageSystem = true,
  } = props;

  // Note: This component is a placeholder that tells users to use the sidebar
  // The actual package selection happens in the sidebar on the activity details page

  return (
    <div class="pricing-component bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 md:p-8 border border-indigo-100">
      <h2 class="text-2xl md:text-3xl font-bold mb-4 text-center">{title}</h2>

      <div class="flex flex-col items-center justify-center py-8">
        <div class="bg-white rounded-full p-6 mb-4 shadow-lg">
          <svg class="w-12 h-12 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>

        <div class="text-center max-w-md">
          <h3 class="text-xl font-semibold mb-2">Package Selection</h3>
          <p class="text-gray-600 mb-6">
            {usePackageSystem ? (
              <>Choose from our available packages in the booking sidebar on the right. Each package offers unique features and pricing.</>
            ) : (
              <>View pricing details in the booking section.</>
            )}
          </p>

          <div class="flex items-center justify-center gap-2 text-sm text-secondary font-medium">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            <span>Check the sidebar for packages</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-indigo-200">
        <div class="flex items-center gap-3">
          <div class="bg-green-100 p-2 rounded-lg">
            <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Best Price</p>
            <p class="text-xs text-gray-600">Guaranteed</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-blue-100 p-2 rounded-lg">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Free Cancel</p>
            <p class="text-xs text-gray-600">Up to 24h</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-purple-100 p-2 rounded-lg">
            <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">Instant Confirm</p>
            <p class="text-xs text-gray-600">Most bookings</p>
          </div>
        </div>
      </div>
    </div>
  );
});
