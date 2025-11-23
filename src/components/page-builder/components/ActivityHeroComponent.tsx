import { component$ } from '@builder.io/qwik';

interface ActivityHeroComponentProps {
  title: string;
  image?: string;
  category?: {
    name: string;
  };
  reviewScore?: number;
  reviewCount?: number;
  location?: {
    island?: string;
    atoll?: string;
  };
  height?: 'small' | 'medium' | 'large';
  overlayOpacity?: 'light' | 'medium' | 'dark';
}

export const ActivityHeroComponent = component$<ActivityHeroComponentProps>((props) => {
  const {
    title,
    image = '/images/placeholder-activity.jpg',
    category,
    reviewScore = 0,
    reviewCount = 0,
    location,
    height = 'medium',
    overlayOpacity = 'medium',
  } = props;

  // Height classes
  const heightClasses = {
    small: 'h-64 md:h-80',
    medium: 'h-96 md:h-[500px]',
    large: 'h-[500px] md:h-[600px]',
  };

  // Overlay opacity classes
  const overlayClasses = {
    light: 'bg-gradient-to-t from-black/40 to-transparent',
    medium: 'bg-gradient-to-t from-black/60 to-transparent',
    dark: 'bg-gradient-to-t from-black/80 to-transparent',
  };

  return (
    <div class={`activity-hero-component relative ${heightClasses[height]} overflow-hidden bg-gray-900`}>
      {/* Background Image */}
      <img
        src={image}
        alt={title}
        class="w-full h-full object-cover opacity-90"
        width="1920"
        height="500"
      />

      {/* Gradient Overlay */}
      <div class={`absolute inset-0 ${overlayClasses[overlayOpacity]}`}></div>

      {/* Content */}
      <div class="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <div class="container mx-auto">
          {/* Category & Reviews */}
          <div class="flex items-center gap-2 mb-3">
            {category && (
              <span class="badge badge-primary badge-lg">{category.name}</span>
            )}
            {reviewCount > 0 && (
              <div class="flex items-center gap-1 text-white text-sm">
                <svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="font-semibold">{reviewScore.toFixed(1)}</span>
                <span class="text-white/80">({reviewCount} reviews)</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 class="text-4xl md:text-5xl font-bold text-white mb-3">{title}</h1>

          {/* Location */}
          {location && (location.island || location.atoll) && (
            <div class="flex items-center text-white/90 text-lg">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {location.island}
              {location.atoll && `, ${location.atoll}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
