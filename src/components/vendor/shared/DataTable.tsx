import { component$, type QRL } from '@builder.io/qwik';

export interface Column<T> {
    key: string;
    header: string;
    render?: QRL<(value: unknown, row: T) => any>;
    class?: string;
    headerClass?: string;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick$?: QRL<(row: T) => void>;
    rowKey?: string;
    compact?: boolean;
    zebra?: boolean;
    hover?: boolean;
}

export const DataTable = component$(<T extends Record<string, unknown>>({
    columns,
    data,
    isLoading = false,
    emptyMessage = 'No data available',
    onRowClick$,
    rowKey = 'id',
    compact = false,
    zebra = true,
    hover = true,
}: DataTableProps<T>) => {
    const getNestedValue = (obj: T, path: string): unknown => {
        return path.split('.').reduce((acc: unknown, part) => {
            if (acc && typeof acc === 'object') {
                return (acc as Record<string, unknown>)[part];
            }
            return undefined;
        }, obj);
    };

    return (
        <div class="overflow-x-auto">
            <table class={[
                'table',
                compact ? 'table-compact' : '',
                zebra ? 'table-zebra' : '',
            ].filter(Boolean).join(' ')}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} class={col.headerClass || ''}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={columns.length} class="text-center py-8">
                                <span class="loading loading-spinner loading-md"></span>
                                <span class="ml-2 text-base-content/60">Loading...</span>
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} class="text-center py-8 text-base-content/60">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => (
                            <tr
                                key={String(row[rowKey])}
                                class={[
                                    hover ? 'hover' : '',
                                    onRowClick$ ? 'cursor-pointer' : '',
                                ].filter(Boolean).join(' ')}
                                onClick$={() => onRowClick$?.(row)}
                            >
                                {columns.map((col) => {
                                    const value = getNestedValue(row, col.key);
                                    return (
                                        <td key={col.key} class={col.class || ''}>
                                            {col.render ? col.render(value, row) : String(value ?? '-')}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
});
