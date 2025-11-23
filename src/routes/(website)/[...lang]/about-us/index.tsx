import { component$ } from '@builder.io/qwik';
import type {DocumentHead} from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="bg-white">
        <div class="bg-white px-6 py-24 sm:py-32 lg:px-8">
            <div class="mx-auto max-w-2xl text-center">
                <p class="text-base/7 font-semibold text-secondary">Learn more</p>
                <h2 class="mt-2 text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
                    About Rihigo
                </h2>
                <p class="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
                    Your trusted travel companion in The Maldives
                </p>
            </div>
        </div>
    </div>
  );
});

export const head: DocumentHead = {
    title: "About us • Rihigo",
    meta: [
        {
            name: "description",
            content: "Learn more about us and our company",
        },
    ],
};
