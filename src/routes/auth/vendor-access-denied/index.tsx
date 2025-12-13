import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link, Form, useLocation } from "@builder.io/qwik-city";
import { useSession, useSignOut } from "~/routes/plugin@auth";

export default component$(() => {
  const session = useSession();
  const signOut = useSignOut();
  const location = useLocation();

  // Get reason from query params
  const reason = location.url.searchParams.get('reason');

  const getReasonMessage = () => {
    switch (reason) {
      case 'inactive':
        return {
          title: 'Vendor Account Inactive',
          message: 'Your vendor account is currently inactive. Please contact support to reactivate your account.',
          icon: '⏸️',
        };
      case 'staff_inactive':
        return {
          title: 'Staff Access Disabled',
          message: 'Your staff access to this vendor has been disabled. Please contact the vendor administrator.',
          icon: '🚫',
        };
      case 'error':
        return {
          title: 'Error Checking Access',
          message: 'There was an error verifying your vendor access. Please try again or contact support.',
          icon: '⚠️',
        };
      default:
        return {
          title: 'Vendor Access Required',
          message: 'You need to be a registered vendor to access the Vendor Portal.',
          icon: '🏪',
        };
    }
  };

  const reasonInfo = getReasonMessage();

  return (
    <div class="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8" data-theme="light">
      <div class="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div class="text-8xl mb-4">{reasonInfo.icon}</div>

        {/* Header */}
        <div>
          <h1 class="text-4xl font-extrabold text-base-content mb-4">
            {reasonInfo.title}
          </h1>
          <p class="text-xl text-base-content/70 mb-6">
            {reasonInfo.message}
          </p>
        </div>

        {/* Content */}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            {session.value?.user ? (
              // User is logged in but not a vendor
              <div class="space-y-4">
                <div class="flex items-center justify-center">
                  <div class="avatar mr-3">
                    <div class="w-12 rounded-full">
                      <img
                        src={session.value.user.image || '/default-avatar.png'}
                        alt="Profile"
                        width={48}
                        height={48}
                      />
                    </div>
                  </div>
                  <div class="text-left">
                    <div class="font-medium text-base-content">
                      {session.value.user.name}
                    </div>
                    <div class="text-sm text-base-content/60">
                      {session.value.user.email}
                    </div>
                  </div>
                </div>

                <div class="alert alert-warning">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="text-left">
                    <p class="font-medium">Not a registered vendor</p>
                    <p class="text-sm">
                      Your account is not associated with any vendor. If you believe this is an error, please contact the administrator.
                    </p>
                  </div>
                </div>

                <div class="divider">Become a Vendor</div>

                <div class="text-sm text-base-content/70 bg-base-200 p-4 rounded-lg">
                  <p class="mb-2">
                    Interested in becoming a vendor on our platform?
                  </p>
                  <p>
                    Contact our team to learn about partnership opportunities and get your business listed.
                  </p>
                </div>
              </div>
            ) : (
              // User is not logged in
              <div class="space-y-4">
                <div class="alert alert-info">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="text-left">
                    <p class="font-medium">Sign in required</p>
                    <p class="text-sm">
                      Please sign in with your vendor account to access the Vendor Portal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div class="space-y-3">
          {session.value?.user ? (
            <>
              <Link
                href="/"
                class="btn btn-primary w-full"
              >
                Go to Homepage
              </Link>
              <Form action={signOut} class="w-full">
                <input type="hidden" name="redirectTo" value="/" />
                <button
                  type="submit"
                  class="btn btn-outline w-full"
                  disabled={signOut.isRunning}
                >
                  {signOut.isRunning && <span class="loading loading-spinner loading-xs"></span>}
                  {signOut.isRunning ? 'Signing out...' : 'Sign Out'}
                </button>
              </Form>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in?callbackUrl=/vendor"
                class="btn btn-primary w-full"
              >
                Sign in to Vendor Portal
              </Link>
              <Link
                href="/"
                class="btn btn-outline w-full"
              >
                Go to Homepage
              </Link>
            </>
          )}
        </div>

        {/* Additional Info */}
        <div class="text-xs text-base-content/50">
          <p>
            The Vendor Portal is exclusively for registered vendors and their staff members.
          </p>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Vendor Access Required - Rihigo",
  meta: [
    {
      name: "description",
      content: "You need to be a registered vendor to access the Vendor Portal",
    },
    {
      name: "robots",
      content: "noindex, nofollow",
    },
  ],
};
