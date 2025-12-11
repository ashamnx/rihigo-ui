import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  const stats = [
    { label: 'Years of experience', value: '12' },
    { label: 'Islands covered', value: '100+' },
    { label: 'Happy travelers', value: '50k+' },
    { label: 'Local partners', value: '200+' },
  ];

  const values = [
    {
      name: 'Authenticity',
      description: 'We believe in showing you the real Maldives, beyond the resorts.',
    },
    {
      name: 'Sustainability',
      description: 'Preserving the beauty of our islands for future generations is at our core.',
    },
    {
      name: 'Community',
      description: 'We work directly with local communities to ensure fair tourism.',
    },
    {
      name: 'Excellence',
      description: 'From booking to departure, we ensure a seamless experience.',
    },
  ];

  const team = [
    {
      name: 'Ahmed Niyaz',
      role: 'Co-Founder / CEO',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      name: 'Sarah Miller',
      role: 'Head of Operations',
      imageUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      name: 'Hassan Ali',
      role: 'Lead Guide',
      imageUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    {
      name: 'Aishath Reena',
      role: 'Customer Experience',
      imageUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  ];

  return (
    <div class="bg-white">
      {/* Hero Section */}
      <div class="relative isolate overflow-hidden bg-gray-900 py-24 sm:py-32">
        <img
          src="https://imagedelivery.net/qcaLCK1uCdpYtBNx7SBE1g/f179a2f9-a5ce-4bea-fe2b-1f016f753700/public"
          alt="Maldives ocean view"
          class="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
        />
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="mx-auto max-w-2xl lg:mx-0">
            <h2 class="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              About Rihigo
            </h2>
            <p class="mt-6 text-lg leading-8 text-gray-300">
              Your trusted travel companion in The Maldives. We connect you with
              the authentic island experience, making your journey
              unforgettable.
            </p>
          </div>
          <div class="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none">
            <dl class="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} class="flex flex-col-reverse">
                  <dt class="text-base leading-7 text-gray-300">
                    {stat.label}
                  </dt>
                  <dd class="text-2xl leading-9 font-bold tracking-tight text-white">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div class="overflow-hidden bg-white py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div class="lg:pt-4 lg:pr-8">
              <div class="lg:max-w-lg">
                <h2 class="text-primary text-base leading-7 font-semibold">
                  Our Story
                </h2>
                <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Born from the Ocean
                </p>
                <p class="mt-6 text-lg leading-8 text-gray-600">
                  Rihigo started with a simple idea: to show the world the real
                  Maldives. Not just the luxury resorts, but the vibrant local
                  culture, the hidden sandbanks, and the untouched reefs.
                </p>
                <p class="mt-6 text-lg leading-8 text-gray-600">
                  Our founders, born and raised on these islands, wanted to
                  create a platform that empowers local communities while
                  providing travelers with authentic, sustainable, and
                  unforgettable experiences. Today, we are proud to be the
                  bridge between you and the true spirit of the Maldives.
                </p>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1074&q=80"
              alt="Maldives local island"
              class="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem] md:-ml-4 lg:-ml-0"
              width={2432}
              height={1442}
            />
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div class="bg-gray-50 py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="mx-auto max-w-2xl lg:text-center">
            <h2 class="text-primary text-base leading-7 font-semibold">
              Our Values
            </h2>
            <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Driven by Purpose
            </p>
            <p class="mt-6 text-lg leading-8 text-gray-600">
              We are more than just a travel agency. We are stewards of our
              environment and champions of our culture.
            </p>
          </div>
          <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {values.map((value) => (
                <div key={value.name} class="relative pl-16">
                  <dt class="text-base leading-7 font-semibold text-gray-900">
                    <div class="bg-primary absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg">
                      <svg
                        class="h-6 w-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    {value.name}
                  </dt>
                  <dd class="mt-2 text-base leading-7 text-gray-600">
                    {value.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div class="bg-white py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
          <div class="mx-auto max-w-2xl lg:mx-0">
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Team
            </h2>
            <p class="mt-6 text-lg leading-8 text-gray-600">
              Meet the passionate individuals who make your dream vacation a
              reality.
            </p>
          </div>
          <ul
            role="list"
            class="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4"
          >
            {team.map((person) => (
              <li key={person.name}>
                <img
                  class="aspect-[1/1] w-full rounded-2xl object-cover"
                  src={person.imageUrl}
                  alt={person.name}
                  width={300}
                  height={300}
                />
                <h3 class="mt-6 text-lg leading-8 font-semibold tracking-tight text-gray-900">
                  {person.name}
                </h3>
                <p class="text-base leading-7 text-gray-600">{person.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'About us • Rihigo',
  meta: [
    {
      name: 'description',
      content: 'Learn more about Rihigo, our mission, and our team.',
    },
  ],
};
