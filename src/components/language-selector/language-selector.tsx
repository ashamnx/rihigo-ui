import {component$, useSignal} from '@builder.io/qwik';
import {useLocation} from '@builder.io/qwik-city';
import {inlineTranslate, localizePath, useDisplayName, useSpeakConfig, useSpeakLocale} from 'qwik-speak';

export interface LanguageSelectorProps {
  class?: string;
}

export const LanguageSelector = component$<LanguageSelectorProps>(({ class: className }) => {
  const isExpanded = useSignal(false);

    const t = inlineTranslate();

    const pathname = useLocation().url.pathname;

    const locale = useSpeakLocale();
    const config = useSpeakConfig();
    const dn = useDisplayName();

    const getPath = localizePath();

  return (
    <div class={`relative ${className || ''}`}>
      <button
        type="button"
        class="flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900 cursor-pointer"
        aria-expanded={isExpanded.value}
        aria-haspopup="true"
        onClick$={() => isExpanded.value = !isExpanded.value}
      >
        <span>{t('app.changeLocale@@Change locale')}</span>
        <svg class="size-5 flex-none text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" data-slot="icon">
          <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>
        </svg>
      </button>
      {isExpanded.value && (
        <div class="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div class="py-1">
            {config.supportedLocales.map((value) => (
              <a
                key={value.lang}
                href={getPath(pathname, value.lang)}
                class={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${value.lang == locale.lang && 'text-gray-700 hover:bg-gray-100'}`}
                onClick$={() => isExpanded.value = false}
              >
                  {dn(value.lang, { type: 'language' })}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
