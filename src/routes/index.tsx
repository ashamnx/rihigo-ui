import { component$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { config } from '~/i18n/config';

// Use onGet for immediate redirect before rendering
export const onGet: RequestHandler = async ({ redirect }) => {
  // Redirect to the default locale immediately
  throw redirect(302, `/${config.defaultLocale.lang}/`);
};

export default component$(() => {
  // This component won't be rendered because of the redirect
  return null;
});
