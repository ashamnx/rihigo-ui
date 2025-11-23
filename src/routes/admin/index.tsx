import {component$} from "@builder.io/qwik";
import type {DocumentHead} from "@builder.io/qwik-city";

export default component$(() => {
    return (
        <div>
            <a href="/">Website</a>
            This is admin panel
        </div>
    );
});

export const head: DocumentHead = {
    title: "Dashboard • Rihigo",
    meta: [
        {
            name: "description",
            content: "Welcome to Rihigo",
        },
    ],
};
