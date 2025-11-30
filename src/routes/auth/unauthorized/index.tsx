import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";
import { useSession } from "~/routes/plugin@auth";
import { inlineTranslate } from 'qwik-speak';

export default component$(() => {
  const session = useSession();
  const t = inlineTranslate();

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center space-y-8">
        {/* Error Icon */}
        <div class="text-red-500 text-8xl mb-4">🚫</div>
        
        {/* Header */}
        <div>
          <h1 class="text-4xl font-extrabold text-gray-900 mb-4">
            {t('auth.unauthorized.title') || 'Access Denied'}
          </h1>
          <p class="text-xl text-gray-600 mb-6">
            {t('auth.unauthorized.subtitle') || "You don't have permission to access this area"}
          </p>
        </div>

        {/* Content */}
        <div class="bg-white shadow rounded-lg p-6">
          {session.value?.user ? (
            // User is logged in but doesn't have admin access
            <div class="space-y-4">
              <div class="flex items-center justify-center">
                <img
                  src={session.value.user.image || '/default-avatar.png'}
                  alt="Profile"
                  class="w-12 h-12 rounded-full mr-3"
                  width={48}
                  height={48}
                />
                <div class="text-left">
                  <div class="font-medium text-gray-900">
                    {session.value.user.name}
                  </div>
                  <div class="text-sm text-gray-500">
                    {session.value.user.email}
                  </div>
                </div>
              </div>
              
              <div class="text-sm text-gray-600 bg-red-50 p-4 rounded-md">
                <p class="mb-2">
                  {t('auth.unauthorized.adminRequired') || 'This area is restricted to administrators only.'}
                </p>
                <p>
                  {t('auth.unauthorized.contactAdmin') || 'If you believe you should have access, please contact an administrator.'}
                </p>
              </div>
            </div>
          ) : (
            // User is not logged in
            <div class="space-y-4">
              <div class="text-sm text-gray-600 bg-blue-50 p-4 rounded-md">
                <p class="mb-2">
                  {t('auth.unauthorized.loginRequired') || 'You need to sign in to access this area.'}
                </p>
                <p>
                  {t('auth.unauthorized.adminLoginRequired') || 'Please sign in with an administrator account.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div class="space-y-3">
          {session.value?.user ? (
            <>
              <Link 
                href="/" 
                class="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('auth.unauthorized.goHome') || 'Go to Homepage'}
              </Link>
              <form action="/auth/signout" method="post" class="w-full">
                <button
                  type="submit"
                  class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('auth.unauthorized.signOut') || 'Sign Out'}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link 
                href="/auth/sign-in?callbackUrl=/admin"
                class="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('auth.unauthorized.signInAdmin') || 'Sign in as Administrator'}
              </Link>
              <Link 
                href="/" 
                class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {t('auth.unauthorized.goHome') || 'Go to Homepage'}
              </Link>
            </>
          )}
        </div>

        {/* Additional Info */}
        <div class="text-xs text-gray-500">
          <p>
            {t('auth.unauthorized.footerText') || 'For security reasons, access to administrative functions is restricted.'}
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Access Denied • Rihigo",
  meta: [
    {
      name: "description",
      content: "You don't have permission to access this area",
    },
  ],
};
