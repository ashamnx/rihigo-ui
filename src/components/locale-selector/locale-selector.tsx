import { component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import {
  inlineTranslate,
  localizePath,
  useDisplayName,
  useSpeakConfig,
  useSpeakLocale,
} from "qwik-speak";
import { useCurrency } from "~/context/currency-context";

export interface LocaleSelectorProps {
  class?: string;
  isScrolled?: boolean;
}

// Flag emojis for supported locales
const FLAG_MAP: Record<string, string> = {
  "en-US": "🇺🇸",
  "it-IT": "🇮🇹",
};

export const LocaleSelector = component$<LocaleSelectorProps>(
  ({ class: className, isScrolled = true }) => {
    const isExpanded = useSignal(false);
    const buttonRef = useSignal<HTMLButtonElement>();
    const panelRef = useSignal<HTMLDivElement>();
    const panelPosition = useStore<{
      left: number | string;
      right: number | string;
      maxWidth: string;
      top: string;
      bottom: string;
    }>({
      left: -32,
      right: 'auto',
      maxWidth: '28rem',
      top: '100%',
      bottom: 'auto'
    });
    const t = inlineTranslate();

    const pathname = useLocation().url.pathname;
    const locale = useSpeakLocale();
    const config = useSpeakConfig();
    const dn = useDisplayName();
    const getPath = localizePath();

    // Use currency context for persistence
    const { selectedCurrency, currencies } = useCurrency();

    // Calculate panel position to avoid clipping
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      track(() => isExpanded.value);

      if (isExpanded.value && buttonRef.value) {
        const buttonRect = buttonRef.value.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Default panel dimensions (28rem = 448px width, estimated ~400px height)
        const panelWidth = 448;
        const estimatedPanelHeight = 400;
        const padding = 16; // Safe padding from viewport edges
        const marginTop = 12; // mt-3 equivalent

        // Calculate available space on both sides (horizontal)
        const spaceOnRight = viewportWidth - buttonRect.right;
        const spaceOnLeft = buttonRect.left;

        // Calculate available space above and below (vertical)
        const spaceBelow = viewportHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;

        // Determine vertical positioning (below or above)
        if (spaceBelow >= estimatedPanelHeight + marginTop + padding) {
          // Enough space below - open downward
          panelPosition.top = '100%';
          panelPosition.bottom = 'auto';
        } else if (spaceAbove >= estimatedPanelHeight + marginTop + padding) {
          // Not enough space below but enough above - open upward
          panelPosition.top = 'auto';
          panelPosition.bottom = '100%';
        } else {
          // Limited space both directions - open downward but will scroll
          panelPosition.top = '100%';
          panelPosition.bottom = 'auto';
        }

        // Determine horizontal positioning (left/right alignment)
        if (spaceOnRight >= panelWidth + padding) {
          // Enough space on the right, align panel to the left of the button
          panelPosition.left = -32; // -left-8 equivalent
          panelPosition.right = 'auto';
          panelPosition.maxWidth = '28rem';
        } else if (spaceOnLeft >= panelWidth + padding) {
          // Not enough space on right, but enough on left - align panel to the right
          panelPosition.left = 'auto';
          panelPosition.right = 0;
          panelPosition.maxWidth = '28rem';
        } else {
          // Not enough space on either side - center and constrain width
          const availableWidth = Math.min(viewportWidth - (padding * 2), panelWidth);

          panelPosition.left = Math.max(padding - buttonRect.left, -(buttonRect.right - viewportWidth + padding));
          panelPosition.right = 'auto';
          panelPosition.maxWidth = `${availableWidth}px`;
        }
      }
    });

    return (
      <div class={`relative z-20 ${className || ""}`}>
        <button
          ref={buttonRef}
          type="button"
          class={`flex cursor-pointer items-center gap-x-1 text-sm/6 font-semibold transition-colors duration-300 ${isScrolled ? 'text-gray-900' : 'text-white'}`}
          aria-expanded={isExpanded.value}
          aria-haspopup="true"
          onClick$={() => (isExpanded.value = !isExpanded.value)}
        >
          <span class="text-lg">{FLAG_MAP[locale.lang] || "🌐"}</span>
          <span class={`mx-1 h-4 border-l transition-colors ${isScrolled ? 'border-gray-300' : 'border-white/50'}`}></span>
          <span>{selectedCurrency.value}</span>
          <svg
            class={`size-5 flex-none transition-colors ${isScrolled ? 'text-gray-400' : 'text-white/70'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            data-slot="icon"
          >
            <path
              fill-rule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        {isExpanded.value && (
          <div
            ref={panelRef}
            class={`absolute z-10 w-screen overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5 ${panelPosition.top === '100%' ? 'mt-3' : 'mb-3'}`}
            style={{
              left: typeof panelPosition.left === 'number' ? `${panelPosition.left}px` : panelPosition.left,
              right: typeof panelPosition.right === 'number' ? `${panelPosition.right}px` : panelPosition.right,
              top: panelPosition.top,
              bottom: panelPosition.bottom,
              maxWidth: panelPosition.maxWidth
            }}
          >
            <div class="p-4">
              {/* Language Section */}
              <div class="mb-2">
                <h3 class="mb-2 px-4 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  {t("app.locale.language@@Language")}
                </h3>
                {config.supportedLocales.map((value) => (
                  <a
                    key={value.lang}
                    href={getPath(pathname, value.lang)}
                    class="group relative flex cursor-pointer gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50"
                    onClick$={() => {
                      isExpanded.value = false;
                    }}
                  >
                    <div class="mt-1 flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      <span class="text-2xl">
                        {FLAG_MAP[value.lang] || "🌐"}
                      </span>
                    </div>
                    <div class="flex-auto">
                      <span class="block font-semibold text-gray-900">
                        {dn(value.lang, { type: "language" })}
                        <span class="absolute inset-0"></span>
                      </span>
                      <p class="mt-1 text-gray-600">{value.lang}</p>
                    </div>
                    {value.lang === locale.lang && (
                      <div class="flex items-center">
                        <svg
                          class="text-primary size-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </a>
                ))}
              </div>

              {/* Divider */}
              <div class="my-2 border-t border-gray-200"></div>

              {/* Currency Section */}
              <div>
                <h3 class="mb-2 px-4 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  {t("app.locale.currency@@Currency")}
                </h3>
                <div class="grid grid-cols-3 gap-2">
                  {currencies.value.map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      class={`group relative flex w-full cursor-pointer gap-x-6 rounded-xl px-4 py-2 text-sm/6 hover:bg-gray-50 ${selectedCurrency.value === currency.code ? "border-primary bg-primary/10 border-2" : ""}`}
                      onClick$={() => {
                        selectedCurrency.value = currency.code;
                        isExpanded.value = false;
                      }}
                    >
                      <div class="block flex-auto font-semibold text-gray-900">
                        <span>{currency.code} </span>
                        <span class="text-gray-600">( {currency.symbol} )</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);
