import {component$} from "@builder.io/qwik";
import type {DocumentHead} from "@builder.io/qwik-city";

export default component$(() => {
    return (
        <div>
            <a href="/admin">Back to admin dashboard</a>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Page Not Found • Rihigo Admin",
    meta: [
        {
            name: "description",
            content: "Welcome to Rihigo",
        },
    ],
};
