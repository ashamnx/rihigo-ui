import {$, component$, useSignal, useStore, useTask$} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$ } from "@builder.io/qwik-city";
import { useSession } from "~/routes/plugin@auth";
import { inlineTranslate } from 'qwik-speak';
import { apiClient, authenticatedRequest } from "~/utils/api-client";

export const useCompleteProfile = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const profileData = {
        name: data.name,
        preferences: {
          language: data.language || 'en-US',
          currency: data.currency || 'USD',
          notifications: data.notifications === 'true'
        },
        profile_completed: true
      };

      const response = await apiClient.users.updateProfile(profileData, token);

      return {
        success: response.success,
        message: response.success
          ? "Profile completed successfully"
          : response.error_message || "Failed to complete profile"
      };
    } catch (error) {
      console.error("Error completing profile:", error);
      return {
        success: false,
        message: "Failed to complete profile"
      };
    }
  });
});

export default component$(() => {
  const session = useSession();
  const completeProfile = useCompleteProfile();
  const t = inlineTranslate();
  const currentStep = useSignal(1);
  const totalSteps = 3;

  const formData = useStore({
    name: '',
    language: 'en-US',
    currency: 'USD',
    notifications: true,
    interests: [] as string[]
  });

  // Set initial data from session if available
  useTask$(({ track }) => {
    track(() => session.value);
    if (session.value?.user) {
      formData.name = session.value.user.name || '';
    }
  });

  // Redirect if not authenticated
  if (!session.value?.user) {
    // throw new Response(null, {
    //   status: 302,
    //   headers: { Location: "/auth/sign-in" }
    // });
  }

  const nextStep = $(() => {
    if (currentStep.value < totalSteps) {
      currentStep.value++;
    }
  });

  const prevStep = $(() => {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  });

  const interests = [
    { id: 'diving', label: 'Diving & Snorkeling', icon: '🤿' },
    { id: 'fishing', label: 'Fishing', icon: '🎣' },
    { id: 'island-hopping', label: 'Island Hopping', icon: '🏝️' },
    { id: 'water-sports', label: 'Water Sports', icon: '🏄' },
    { id: 'sunset-cruise', label: 'Sunset Cruises', icon: '🌅' },
    { id: 'cultural', label: 'Cultural Experiences', icon: '🎭' },
    { id: 'spa-wellness', label: 'Spa & Wellness', icon: '💆' },
    { id: 'photography', label: 'Photography Tours', icon: '📸' },
  ];

  const toggleInterest = $((interestId: string) => {
    const index = formData.interests.indexOf(interestId);
    if (index > -1) {
      formData.interests.splice(index, 1);
    } else {
      formData.interests.push(interestId);
    }
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div class="text-center mb-8">
          <div class="mx-auto h-12 w-12 flex items-center justify-center">
            <svg class="rihigo-icon h-8 text-blue-500">
              <use xlink:href="#rihigo-logo"></use>
            </svg>
          </div>
          <h1 class="mt-4 text-3xl font-extrabold text-gray-900">
            {t('auth.welcome.title') || 'Welcome to Rihigo!'}
          </h1>
          <p class="mt-2 text-lg text-gray-600">
            {t('auth.welcome.subtitle') || "Let's set up your profile to give you the best experience"}
          </p>
        </div>

        {/* Progress Bar */}
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-blue-600">
              Step {currentStep.value} of {totalSteps}
            </span>
            <span class="text-sm font-medium text-gray-500">
              {Math.round((currentStep.value / totalSteps) * 100)}% complete
            </span>
          </div>
          <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={`width: ${(currentStep.value / totalSteps) * 100}%`}
            ></div>
          </div>
        </div>

        {/* Success Message */}
        {completeProfile.value?.success && (
          <div class="mb-6 rounded-md bg-green-50 p-4">
            <div class="text-sm text-green-800">
              {completeProfile.value.message}
            </div>
          </div>
        )}

        {/* Form Card */}
        <div class="bg-white shadow-xl rounded-lg p-6 sm:p-8">
          <Form action={completeProfile} class="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep.value === 1 && (
              <div class="space-y-6">
                <div class="text-center mb-6">
                  <h2 class="text-xl font-semibold text-gray-900">
                    {t('auth.welcome.step1.title') || 'Basic Information'}
                  </h2>
                  <p class="mt-1 text-sm text-gray-600">
                    {t('auth.welcome.step1.subtitle') || 'Tell us a little about yourself'}
                  </p>
                </div>

                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700">
                    {t('auth.welcome.name') || 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name}
                    onInput$={(e) => formData.name = (e.target as HTMLInputElement).value}
                  />
                </div>

              </div>
            )}

            {/* Step 2: Preferences */}
            {currentStep.value === 2 && (
              <div class="space-y-6">
                <div class="text-center mb-6">
                  <h2 class="text-xl font-semibold text-gray-900">
                    {t('auth.welcome.step2.title') || 'Preferences'}
                  </h2>
                  <p class="mt-1 text-sm text-gray-600">
                    {t('auth.welcome.step2.subtitle') || 'Customize your experience'}
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="language" class="block text-sm font-medium text-gray-700">
                      {t('auth.welcome.language') || 'Preferred Language'}
                    </label>
                    <select
                      name="language"
                      id="language"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.language}
                      onChange$={(e) => formData.language = (e.target as HTMLSelectElement).value}
                    >
                      <option value="en-US">English</option>
                      <option value="it-IT">Italiano</option>
                    </select>
                  </div>

                  <div>
                    <label for="currency" class="block text-sm font-medium text-gray-700">
                      {t('auth.welcome.currency') || 'Preferred Currency'}
                    </label>
                    <select
                      name="currency"
                      id="currency"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.currency}
                      onChange$={(e) => formData.currency = (e.target as HTMLSelectElement).value}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="MVR">MVR - Maldivian Rufiyaa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      name="notifications"
                      id="notifications"
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={formData.notifications}
                      onChange$={(e) => formData.notifications = (e.target as HTMLInputElement).checked}
                    />
                    <label for="notifications" class="ml-2 block text-sm text-gray-700">
                      {t('auth.welcome.notifications') || 'Send me notifications about new experiences and deals'}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Interests */}
            {currentStep.value === 3 && (
              <div class="space-y-6">
                <div class="text-center mb-6">
                  <h2 class="text-xl font-semibold text-gray-900">
                    {t('auth.welcome.step3.title') || 'What interests you?'}
                  </h2>
                  <p class="mt-1 text-sm text-gray-600">
                    {t('auth.welcome.step3.subtitle') || 'Select activities you\'d like to explore (optional)'}
                  </p>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {interests.map((interest) => (
                    <button
                      key={interest.id}
                      type="button"
                      onClick$={() => toggleInterest(interest.id)}
                      class={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        formData.interests.includes(interest.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div class="text-2xl mb-1">{interest.icon}</div>
                      <div class="text-sm font-medium">{interest.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div class="flex justify-between pt-6">
              {currentStep.value > 1 ? (
                <button
                  type="button"
                  onClick$={prevStep}
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('auth.welcome.previous') || 'Previous'}
                </button>
              ) : (
                <div></div>
              )}

              {currentStep.value < totalSteps ? (
                <button
                  type="button"
                  onClick$={nextStep}
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('auth.welcome.next') || 'Next'}
                </button>
              ) : (
                <button
                  type="submit"
                  class="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('auth.welcome.complete') || 'Complete Profile'}
                </button>
              )}
            </div>

            {/* Skip Option */}
            {currentStep.value === totalSteps && (
              <div class="text-center pt-4">
                <Link
                  href="/"
                  class="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('auth.welcome.skipForNow') || 'Skip for now'}
                </Link>
              </div>
            )}

            {/* Hidden fields for form submission */}
            <input type="hidden" name="interests" value={JSON.stringify(formData.interests)} />
          </Form>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Welcome • Rihigo",
  meta: [
    {
      name: "description",
      content: "Welcome to Rihigo! Complete your profile to get personalized recommendations.",
    },
  ],
};
