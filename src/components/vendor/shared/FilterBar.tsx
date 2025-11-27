import { component$, useSignal, type QRL } from '@builder.io/qwik';

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterDefinition {
    key: string;
    label: string;
    type: 'select' | 'date' | 'text';
    options?: FilterOption[];
    placeholder?: string;
}

export interface FilterBarProps {
    filters: FilterDefinition[];
    values: Record<string, string>;
    onChange$: QRL<(key: string, value: string) => void>;
    onReset$?: QRL<() => void>;
    searchPlaceholder?: string;
    onSearch$?: QRL<(value: string) => void>;
    searchValue?: string;
}

export const FilterBar = component$<FilterBarProps>(({
    filters,
    values,
    onChange$,
    onReset$,
    searchPlaceholder = 'Search...',
    onSearch$,
    searchValue = '',
}) => {
    const localSearch = useSignal(searchValue);

    const hasActiveFilters = Object.values(values).some(v => v && v !== '');

    return (
        <div class="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search Input */}
            {onSearch$ && (
                <div class="form-control flex-1 max-w-xs">
                    <div class="input-group input-group-sm">
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            class="input input-bordered input-sm w-full"
                            value={localSearch.value}
                            onInput$={(e) => {
                                const target = e.target as HTMLInputElement;
                                localSearch.value = target.value;
                            }}
                            onKeyUp$={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch$(localSearch.value);
                                }
                            }}
                        />
                        <button
                            type="button"
                            class="btn btn-sm btn-square"
                            onClick$={() => onSearch$(localSearch.value)}
                        >
                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Dropdowns */}
            <div class="flex flex-wrap gap-2">
                {filters.map((filter) => (
                    <div key={filter.key} class="form-control">
                        {filter.type === 'select' && filter.options && (
                            <select
                                class="select select-bordered select-sm"
                                value={values[filter.key] || ''}
                                onChange$={(e) => {
                                    const target = e.target as HTMLSelectElement;
                                    onChange$(filter.key, target.value);
                                }}
                            >
                                <option value="">{filter.label}</option>
                                {filter.options.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        )}
                        {filter.type === 'date' && (
                            <input
                                type="date"
                                class="input input-bordered input-sm"
                                value={values[filter.key] || ''}
                                onChange$={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    onChange$(filter.key, target.value);
                                }}
                                placeholder={filter.placeholder || filter.label}
                            />
                        )}
                        {filter.type === 'text' && (
                            <input
                                type="text"
                                class="input input-bordered input-sm"
                                value={values[filter.key] || ''}
                                onChange$={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    onChange$(filter.key, target.value);
                                }}
                                placeholder={filter.placeholder || filter.label}
                            />
                        )}
                    </div>
                ))}

                {/* Reset Button */}
                {hasActiveFilters && onReset$ && (
                    <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        onClick$={() => {
                            localSearch.value = '';
                            onReset$();
                        }}
                    >
                        <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
});
