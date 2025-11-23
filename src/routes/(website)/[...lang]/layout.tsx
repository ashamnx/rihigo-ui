import {component$, Slot} from '@builder.io/qwik';
import {Nav} from '~/components/nav/nav';
import { routeLoader$ } from "@builder.io/qwik-city";
import { apiClient } from "~/utils/api-client";

export const useCurrencyData = routeLoader$(async (requestEvent) => {
  try {
    requestEvent.cacheControl({
      maxAge: 60,
      sMaxAge: 3600,
      staleWhileRevalidate: 60 * 60 * 24, // 1 day
    });

    console.log('--- FETCHING CURRENCIES FROM DB ---');
    // Fetch featured activities for the home page
    return await apiClient.currency.listAll();
  } catch (error) {
    // Handle network errors
    if (typeof process !== 'undefined') {
      console.error('Network error fetching activities:', error);
    }
    return {
      data: [],
      error: 'Unable to connect to the server'
    };
  }
})

export default component$(() => {
    return <Nav><Slot/></Nav>;
});
