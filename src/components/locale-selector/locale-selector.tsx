import {component$, useSignal, useStore} from '@builder.io/qwik';
import {useLocation} from '@builder.io/qwik-city';
import {inlineTranslate, localizePath, useDisplayName, useSpeakConfig, useSpeakLocale} from 'qwik-speak';

export interface LocaleSelectorProps {
  class?: string;
}

// Flag emojis for supported locales
const FLAG_MAP: Record<string, string> = {
  'en-US': '🇺🇸',
  'it-IT': '🇮🇹',
};

export const LocaleSelector = component$<LocaleSelectorProps>(({ class: className }) => {
  const isExpanded = useSignal(false);
  const t = inlineTranslate();

  const pathname = useLocation().url.pathname;
  const locale = useSpeakLocale();
  const config = useSpeakConfig();
  const dn = useDisplayName();
  const getPath = localizePath();

  // Get unique currencies from the supported locales
  const uniqueCurrencies = [...new Set(config.supportedLocales.map(l => l.currency))];

  // Store the selected currency
  const store = useStore({
    selectedCurrency: locale.currency || config.defaultLocale.currency
  });

  return (
    <div class={`relative z-20 ${className || ''}`}>
      <button
        type="button"
        class="flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900 cursor-pointer"
        aria-expanded={isExpanded.value}
        aria-haspopup="true"
        onClick$={() => isExpanded.value = !isExpanded.value}
      >
        <span class="text-lg">{FLAG_MAP[locale.lang] || '🌐'}</span>
        <span class="border-l border-gray-300 h-4 mx-1"></span>
        <span>{store.selectedCurrency}</span>
        <svg class="size-5 flex-none text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon">
          <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
        </svg>
      </button>
      {isExpanded.value && (
        <div class="absolute top-full -left-8 z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white ring-1 shadow-lg ring-gray-900/5">
          <div class="p-4">
            {/* Language Section */}
            <div class="mb-2">
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">
                {t('app.locale.language@@Language')}
              </h3>
              {config.supportedLocales.map((value) => (
                <a
                  key={value.lang}
                  href={getPath(pathname, value.lang)}
                  class="group relative flex gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50 cursor-pointer"
                  onClick$={() => {
                    isExpanded.value = false;
                  }}
                >
                  <div class="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                    <span class="text-2xl">{FLAG_MAP[value.lang] || '🌐'}</span>
                  </div>
                  <div class="flex-auto">
                    <span class="block font-semibold text-gray-900">
                      {dn(value.lang, { type: 'language' })}
                      <span class="absolute inset-0"></span>
                    </span>
                    <p class="mt-1 text-gray-600">{value.lang}</p>
                  </div>
                  {value.lang === locale.lang && (
                    <div class="flex items-center">
                      <svg class="size-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  )}
                </a>
              ))}
            </div>

            {/* Divider */}
            <div class="border-t border-gray-200 my-2"></div>

            {/* Currency Section */}
            <div>
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 mb-2">
                {t('app.locale.currency@@Currency')}
              </h3>
              {uniqueCurrencies.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  class="group relative flex gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50 cursor-pointer w-full"
                  onClick$={() => {
                    store.selectedCurrency = currency;
                    isExpanded.value = false;
                  }}
                >
                  <div class="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                    <svg class="size-6 text-gray-600 group-hover:text-secondary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div class="flex-auto">
                    <span class="block font-semibold text-gray-900">
                      {currency}
                      <span class="absolute inset-0"></span>
                    </span>
                    <p class="mt-1 text-gray-600">{currency === 'USD' ? '$ (US Dollar)' : '€ (Euro)'}</p>
                  </div>
                  {currency === store.selectedCurrency && (
                    <div class="flex items-center">
                      <svg class="size-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
