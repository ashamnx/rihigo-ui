import {component$} from "@builder.io/qwik";
import type {DocumentHead} from "@builder.io/qwik-city";
import {useSignIn} from "~/routes/plugin@auth";

export default component$(() => {

    const signIn = useSignIn();
    return (
            <button onClick$={() => signIn.submit({
                providerId: 'google',
                options: {
                    redirectTo: "http://localhost:5173"
                }
            })}>Sign In</button>
    );
});

export const head: DocumentHead = {
    title: "Sign In • Rihigo",
    meta: [
        {
            name: "description",
            content: "Sign in to your Rihigo account to book amazing experiences in the Maldives",
        },
    ],
};
