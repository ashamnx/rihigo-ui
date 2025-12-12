import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { useSession, useSignIn } from "~/routes/plugin@auth";
import { inlineTranslate } from "qwik-speak";

export const useAuthSession = routeLoader$(async (requestEvent) => {
  const session = requestEvent.sharedMap.get("session");
  if (session?.user) {
    const callbackUrl = requestEvent.url.searchParams.get("callbackUrl") || "/";
    throw requestEvent.redirect(302, callbackUrl);
  }
  return {
    callbackUrl: requestEvent.url.searchParams.get("callbackUrl") || "/",
  };
});

export default component$(() => {
  const session = useSession();
  const signIn = useSignIn();
  const authData = useAuthSession();
  const t = inlineTranslate();
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);

  if (session.value?.user) {
    return null;
  }

  const callbackUrl = authData.value.callbackUrl;

  return (
    <div class="flex min-h-screen">
      {/* Left Side - Branding */}
      <div class="from-primary to-primary/80 relative hidden overflow-hidden bg-gradient-to-br lg:flex lg:w-1/2">
        <div class="absolute inset-0 bg-black/10" />
        <div
          class="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div class="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Link href="/" class="flex items-center gap-3">
              <img
                src="/assets/logo.svg"
                alt="Rihigo"
                class="h-10 brightness-0 invert"
                height="40"
              />
            </Link>
          </div>

          <div class="space-y-8">
            <div>
              <h1 class="text-4xl leading-tight font-bold">
                {t("auth.signIn.heroTitle")}
              </h1>
              <p class="mt-4 text-lg text-white/80">
                {t("auth.signIn.heroSubtitle")}
              </p>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-white/90">{t("auth.signIn.benefit1")}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-white/90">{t("auth.signIn.benefit2")}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span class="text-white/90">{t("auth.signIn.benefit3")}</span>
              </div>
            </div>
          </div>

          <div class="text-sm text-white/60">{t("auth.signIn.footerText")}</div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div class="bg-base-100 flex flex-1 items-center justify-center p-8">
        <div class="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div class="text-center lg:hidden">
            <Link href="/" class="inline-flex items-center gap-2">
              <img
                src="/assets/logo.svg"
                alt="Rihigo"
                class="h-12"
                height="32"
              />
            </Link>
          </div>

          {/* Header */}
          <div class="text-center lg:text-left">
            <h2 class="text-base-content text-3xl font-bold">
              {t("auth.signIn.title")}
            </h2>
            <p class="text-base-content/60 mt-2">{t("auth.signIn.subtitle")}</p>
          </div>

          {/* Error Message */}
          {error.value && (
            <div class="alert alert-error">
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error.value}</span>
            </div>
          )}

          {/* Social Sign In */}
          <div class="space-y-4">
            <button
              type="submit"
              onClick$={() =>
                signIn.submit({
                  providerId: "google",
                  options: { callbackUrl },
                })
              }
              disabled={isLoading.value}
              class="btn btn-outline hover:bg-base-200 border-base-300 h-12 w-full gap-3 font-medium"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("auth.signIn.continueWithGoogle")}
            </button>
          </div>

          {/* Terms */}
          <div class="text-center">
            <p class="text-base-content/50 text-sm">
              {t("auth.signIn.termsText")}{" "}
              <Link href="/en-US/terms" class="link link-primary">
                {t("auth.signIn.termsLink")}
              </Link>{" "}
              {t("auth.signIn.and")}{" "}
              <Link href="/en-US/privacy" class="link link-primary">
                {t("auth.signIn.privacyLink")}
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div class="border-base-200 border-t pt-4 text-center">
            <Link href="/" class="btn btn-ghost btn-sm gap-2">
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("auth.signIn.backToHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Sign In - Rihigo",
  meta: [
    {
      name: "description",
      content:
        "Sign in to your Rihigo account to book amazing experiences in the Maldives",
    },
  ],
};
