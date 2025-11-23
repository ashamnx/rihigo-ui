import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeLoader$ } from "@builder.io/qwik-city";
import { useSignIn } from "~/routes/plugin@auth";
import { inlineTranslate } from 'qwik-speak';

export const useAuthSession = routeLoader$(async (requestEvent) => {
  // Get the session from Auth.js
  const getSession = requestEvent.sharedMap.get('session');
  let session;
  try {
    session = typeof getSession === 'function' ? await getSession() : getSession;
  } catch (e) {
    session = null;
  }

  // If user is already authenticated, redirect to home
  if (session && session.user) {
    // throw requestEvent.redirect(302, '/');
  }

  return { callbackUrl: '/auth/welcome' };
});

export default component$(() => {
  const authData = useAuthSession();
  const signIn = useSignIn();
  const t = inlineTranslate();
  const error = useSignal<string | null>(null);

  const callbackUrl = authData.value.callbackUrl;

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div class="mx-auto h-12 w-12 flex items-center justify-center">
            <svg class="rihigo-icon h-8 text-blue-500">
              <use xlink:href="#rihigo-logo"></use>
            </svg>
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.signUp.title') || 'Create your account'}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            {t('auth.signUp.subtitle') || 'Join Rihigo and discover the Maldives'}
          </p>
        </div>

        {/* Error Message */}
        {error.value && (
          <div class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-800">
              {error.value}
            </div>
          </div>
        )}

        {/* Benefits */}
        <div class="bg-blue-50 rounded-lg p-4">
          <h3 class="text-sm font-medium text-blue-800 mb-2">
            {t('auth.signUp.benefitsTitle') || 'Why join Rihigo?'}
          </h3>
          <ul class="text-sm text-blue-700 space-y-1">
            <li class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              {t('auth.signUp.benefit1') || 'Book exclusive experiences'}
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              {t('auth.signUp.benefit2') || 'Manage your bookings easily'}
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              {t('auth.signUp.benefit3') || 'Get personalized recommendations'}
            </li>
            <li class="flex items-center">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              {t('auth.signUp.benefit4') || 'Access member-only deals'}
            </li>
          </ul>
        </div>

        {/* Social Sign Up */}
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600 text-center mb-4">
              {t('auth.signUp.socialPrompt') || 'Sign up with your preferred method'}
            </p>
            
            <div class="space-y-3">
              {/* Google Sign Up */}
              <Form action={signIn}>
                <input type="hidden" name="providerId" value="google" />
                <input type="hidden" name="options.callbackUrl" value={callbackUrl} />
                <button
                  type="submit"
                  class="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth.signUp.continueWithGoogle') || 'Continue with Google'}
                </button>
              </Form>

              {/* Facebook Sign Up */}
              <Form action={signIn}>
                <input type="hidden" name="providerId" value="facebook" />
                <input type="hidden" name="options.callbackUrl" value={callbackUrl} />
                <button
                  type="submit"
                  class="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {t('auth.signUp.continueWithFacebook') || 'Continue with Facebook'}
                </button>
              </Form>
            </div>
          </div>

          {/* Divider */}
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">
                {t('auth.signUp.orSignUpWith') || 'Or sign up with email'}
              </span>
            </div>
          </div>

          {/* Email Sign Up */}
          <Form action={signIn} class="space-y-4">
            <input type="hidden" name="providerId" value="nodemailer" />
            <input type="hidden" name="options.callbackUrl" value={callbackUrl} />
            
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                {t('auth.signUp.emailLabel') || 'Email address'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                class="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.signUp.emailPlaceholder') || 'Enter your email address'}
              />
            </div>

            <button
              type="submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('auth.signUp.createAccount') || 'Create account'}
            </button>
          </Form>
        </div>

        {/* Footer */}
        <div class="text-center">
          <p class="text-sm text-gray-600">
            {t('auth.signUp.alreadyHaveAccount') || "Already have an account?"}{' '}
            <Link href="/auth/sign-in" class="font-medium text-blue-600 hover:text-blue-500">
              {t('auth.signUp.signIn') || 'Sign in'}
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div class="text-center">
          <p class="text-xs text-gray-500">
            {t('auth.signUp.termsText') || 'By creating an account, you agree to our'}{' '}
            <Link href="/terms" class="text-blue-600 hover:text-blue-500">
              {t('auth.signUp.termsLink') || 'Terms of Service'}
            </Link>{' '}
            {t('auth.signUp.and') || 'and'}{' '}
            <Link href="/privacy" class="text-blue-600 hover:text-blue-500">
              {t('auth.signUp.privacyLink') || 'Privacy Policy'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Sign Up • Rihigo",
  meta: [
    {
      name: "description",
      content: "Join Rihigo and discover amazing experiences in the Maldives. Book tours, activities, and create unforgettable memories.",
    },
  ],
};
