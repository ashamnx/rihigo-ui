import { component$, useSignal, useComputed$, useVisibleTask$, $, type QRL } from '@builder.io/qwik';

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

interface SearchableSelectProps {
  name: string;
  value?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: SearchableSelectOption[];
  class?: string;
  onChange$?: QRL<(value: string) => void>;
}

export const SearchableSelect = component$<SearchableSelectProps>(
  ({
    name,
    value,
    label,
    required = false,
    disabled = false,
    placeholder = 'Select...',
    options,
    class: className = '',
    onChange$,
  }) => {
    const isOpen = useSignal(false);
    const searchText = useSignal('');
    const highlightedIndex = useSignal(-1);
    const containerRef = useSignal<HTMLDivElement>();

    const selectedLabel = useComputed$(() => {
      if (!value) return '';
      const option = options.find((o) => o.value === value);
      return option?.label || '';
    });

    const filtered = useComputed$(() => {
      if (!searchText.value) return options;
      const term = searchText.value.toLowerCase();
      return options.filter(
        (o) =>
          o.label.toLowerCase().includes(term) ||
          (o.searchText && o.searchText.toLowerCase().includes(term)) ||
          o.value.toLowerCase().includes(term)
      );
    });

    const selectOption = $((optionValue: string) => {
      if (onChange$) {
        onChange$(optionValue);
      }
      isOpen.value = false;
      searchText.value = '';
      highlightedIndex.value = -1;
    });

    const openDropdown = $(() => {
      if (disabled) return;
      isOpen.value = true;
      searchText.value = '';
      highlightedIndex.value = -1;
    });

    const closeDropdown = $(() => {
      isOpen.value = false;
      searchText.value = '';
      highlightedIndex.value = -1;
    });

    // Close on outside click
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const handler = (e: MouseEvent) => {
        if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
          isOpen.value = false;
          searchText.value = '';
          highlightedIndex.value = -1;
        }
      };
      document.addEventListener('mousedown', handler);
      cleanup(() => document.removeEventListener('mousedown', handler));
    });

    return (
      <div class="form-control" ref={containerRef}>
        {label && (
          <label class="label">
            <span class="label-text">
              {label}
              {required && <span class="text-error ml-1">*</span>}
            </span>
          </label>
        )}
        <input type="hidden" name={name} value={value || ''} />
        <div class="relative">
          <input
            type="text"
            class={`input input-bordered w-full pr-8 ${className}`}
            placeholder={isOpen.value ? 'Type to search...' : (value ? selectedLabel.value : placeholder)}
            value={isOpen.value ? searchText.value : selectedLabel.value}
            disabled={disabled}
            readOnly={!isOpen.value}
            onFocus$={openDropdown}
            onClick$={openDropdown}
            onInput$={(e) => {
              searchText.value = (e.target as HTMLInputElement).value;
              highlightedIndex.value = 0;
            }}
            onKeyDown$={$((e: KeyboardEvent) => {
              if (!isOpen.value && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openDropdown();
                return;
              }
              if (!isOpen.value) return;

              const filteredList = filtered.value;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex.value = Math.min(
                  highlightedIndex.value + 1,
                  filteredList.length - 1
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredList.length) {
                  selectOption(filteredList[highlightedIndex.value].value);
                }
              } else if (e.key === 'Escape') {
                closeDropdown();
              }
            })}
          />
          {/* Dropdown arrow */}
          <svg
            class={`size-4 absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none transition-transform ${isOpen.value ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>

          {/* Dropdown list */}
          {isOpen.value && (
            <ul class="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-base-100 border border-base-300 rounded-lg shadow-lg">
              {filtered.value.length === 0 ? (
                <li class="px-3 py-2 text-sm text-base-content/50">No results found</li>
              ) : (
                filtered.value.map((option, i) => (
                  <li
                    key={option.value}
                    class={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      option.value === value ? 'bg-primary/10 text-primary font-medium' : ''
                    } ${
                      i === highlightedIndex.value ? 'bg-base-200' : 'hover:bg-base-200'
                    }`}
                    onClick$={() => selectOption(option.value)}
                    onMouseEnter$={() => { highlightedIndex.value = i; }}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    );
  }
);

export default SearchableSelect;
