import {component$} from "@builder.io/qwik";
import type {DocumentHead} from "@builder.io/qwik-city";

export default component$(() => {
    return (
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div class="px-4 py-6 sm:px-0">
                <h1 class="text-3xl font-bold text-gray-900">My Profile</h1>
                <p class="mt-2 text-sm text-gray-600">Manage your Rihigo profile, bookings, and account settings</p>
            </div>
        </div>
    );
});

export const head: DocumentHead = {
    title: "My Profile • Rihigo",
    meta: [
        {
            name: "description",
            content: "Manage your Rihigo profile, bookings, and account settings",
        },
    ],
};
