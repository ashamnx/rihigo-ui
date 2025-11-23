import { component$ } from '@builder.io/qwik';
import type { HeroComponentProps } from '~/types/activity';

export const HeroComponent = component$<HeroComponentProps>((props) => {
  return (
    <div
      class="hero min-h-96 relative"
      style={{
        backgroundImage: props.backgroundImage
          ? `url(${props.backgroundImage})`
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div
        class="hero-overlay rounded-xl bg-primary/40 absolute inset-0 bg-lenear-to-br from-primary/40 to-transparent"
        style={{ opacity: props.overlayOpacity || 0.4 }}
      ></div>
      <div class="hero-content text-center text-neutral-content">
        <div class="max-w-md">
          {props.title && <h1 class="mb-5 text-5xl font-bold text-primary">{props.title}</h1>}
          {props.description && <p class="mb-5 text-xl text-primary/40">{props.description}</p>}
        </div>
      </div>
    </div>
  );
});
