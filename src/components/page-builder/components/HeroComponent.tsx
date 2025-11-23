import { component$ } from '@builder.io/qwik';
import type { HeroComponentProps } from '~/types/activity';

export const HeroComponent = component$<HeroComponentProps>((props) => {
  return (
    <div
      class="hero min-h-screen relative"
      style={{
        backgroundImage: props.backgroundImage
          ? `url(${props.backgroundImage})`
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        class="hero-overlay"
        style={{ opacity: props.overlayOpacity || 0.4 }}
      ></div>
      <div class="hero-content text-center text-neutral-content">
        <div class="max-w-md">
          {props.title && <h1 class="mb-5 text-5xl font-bold">{props.title}</h1>}
          {props.subtitle && <p class="mb-5 text-xl">{props.subtitle}</p>}
        </div>
      </div>
    </div>
  );
});
