import { createContextId } from '@builder.io/qwik';

export interface NavState {
  currencies: string[];
  locales: string[];
  selectedLocale: string;
}

export const navStore = createContextId<NavState>('navStore');
