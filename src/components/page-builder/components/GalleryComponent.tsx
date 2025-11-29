import { component$ } from '@builder.io/qwik';
import type { GalleryComponentProps } from '~/types/activity';

export const GalleryComponent = component$<GalleryComponentProps>((props) => {
  const layout = props.layout || 'grid';

  if (layout === 'carousel') {
    return (
      <div class="container mx-auto px-4 py-12">
        <div class="carousel w-full">
          {props.images.map((image, index) => (
            <div key={index} id={`slide${index}`} class="carousel-item relative w-full">
              <img src={image.url} alt={image.alt || image.caption} class="w-full" />
              <div class="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                <a href={`#slide${index === 0 ? props.images.length - 1 : index - 1}`} class="btn btn-circle">
                  ❮
                </a>
                <a href={`#slide${(index + 1) % props.images.length}`} class="btn btn-circle">
                  ❯
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {props.images.map((image, index) => (
          <div key={index} class="relative group overflow-hidden rounded-lg">
            <img
              src={image.url}
              alt={image.alt || image.caption}
              class="w-full h-64 object-cover transition-transform group-hover:scale-110"
            />
            {image.caption && (
              <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                {image.caption}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
