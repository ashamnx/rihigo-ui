// @ts-nocheck
import { component$, useSignal, useComputed$, $ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Link, useNavigate } from '@builder.io/qwik-city';
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import {
    type VendorResource,
    type ResourceAvailability,
    type AvailabilityStatus,
    resourceStatusLabels,
} from '~/types/resource';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

export const useResourceAvailabilityLoader = routeLoader$(async (requestEvent) => {
    const resourceId = requestEvent.params.id;
    const url = requestEvent.url;

    // Get month from query params, default to current month
    const monthParam = url.searchParams.get('month');
    const currentDate = monthParam ? new Date(monthParam + '-01') : new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Calculate start and end dates for the month view
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const resource = await apiClient.vendorPortal.resources?.get(resourceId, token);
            const availability = await apiClient.vendorPortal.resources?.getAvailability(
                resourceId,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                token
            );

            return {
                success: true,
                resource,
                availability: availability || [],
                year,
                month,
            };
        } catch (error) {
            console.error('Failed to load availability:', error);
            return {
                success: false,
                resource: null,
                availability: [],
                year,
                month,
            };
        }
    });
});

export const useUpdateAvailability = routeAction$(async (data, requestEvent) => {
    const resourceId = requestEvent.params.id;

    return authenticatedRequest(requestEvent, async (token) => {
        try {
            const updates = JSON.parse(data.updates as string);
            await apiClient.vendorPortal.resources?.updateAvailability(resourceId, updates, token);
            return { success: true };
        } catch (error) {
            console.error('Failed to update availability:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update availability',
            };
        }
    });
});

export default component$(() => {
    const loaderData = useResourceAvailabilityLoader();
    const updateAction = useUpdateAvailability();
    const navigate = useNavigate();

    const resource = loaderData.value?.resource as VendorResource | null;
    const availability = loaderData.value?.availability || [];
    const year = loaderData.value?.year || new Date().getFullYear();
    const month = loaderData.value?.month || new Date().getMonth();

    // Selected dates for bulk edit
    const selectedDates = useSignal<string[]>([]);
    const editMode = useSignal(false);
    const bulkStatus = useSignal<AvailabilityStatus>('available');
    const bulkPrice = useSignal<number | undefined>(undefined);
    const bulkMinStay = useSignal<number | undefined>(undefined);
    const bulkMaxStay = useSignal<number | undefined>(undefined);

    if (!resource) {
        return (
            <div class="flex flex-col items-center justify-center py-12">
                <svg class="size-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <h3 class="text-lg font-medium mb-2">Resource Not Found</h3>
                <p class="text-base-content/60 mb-4">The resource you're looking for doesn't exist.</p>
                <Link href="/vendor/resources" class="btn btn-primary">
                    Back to Resources
                </Link>
            </div>
        );
    }

    // Create availability map for quick lookup
    const availabilityMap = useComputed$(() => {
        const map: Record<string, ResourceAvailability> = {};
        availability.forEach((a) => {
            map[a.date] = a;
        });
        return map;
    });

    // Generate calendar days
    const calendarDays = useComputed$(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

        // Add previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const date = new Date(year, month - 1, day);
            days.push({
                date: date.toISOString().split('T')[0],
                day,
                isCurrentMonth: false,
            });
        }

        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push({
                date: date.toISOString().split('T')[0],
                day,
                isCurrentMonth: true,
            });
        }

        // Add next month's days to complete the grid
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            days.push({
                date: date.toISOString().split('T')[0],
                day,
                isCurrentMonth: false,
            });
        }

        return days;
    });

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    const handlePrevMonth = $(() => {
        const newDate = new Date(year, month - 1, 1);
        const monthStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
        navigate(`/vendor/resources/${resource.id}/availability?month=${monthStr}`);
    });

    const handleNextMonth = $(() => {
        const newDate = new Date(year, month + 1, 1);
        const monthStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
        navigate(`/vendor/resources/${resource.id}/availability?month=${monthStr}`);
    });

    const handleToday = $(() => {
        navigate(`/vendor/resources/${resource.id}/availability`);
    });

    const toggleDateSelection = $((date: string) => {
        if (!editMode.value) return;

        const index = selectedDates.value.indexOf(date);
        if (index === -1) {
            selectedDates.value = [...selectedDates.value, date];
        } else {
            selectedDates.value = selectedDates.value.filter((d) => d !== date);
        }
    });

    const selectAllDates = $(() => {
        const currentMonthDates = calendarDays.value
            .filter((d) => d.isCurrentMonth)
            .map((d) => d.date);
        selectedDates.value = currentMonthDates;
    });

    const clearSelection = $(() => {
        selectedDates.value = [];
    });

    const handleBulkUpdate = $(async () => {
        if (selectedDates.value.length === 0) return;

        const updates = selectedDates.value.map((date) => ({
            date,
            status: bulkStatus.value,
            price_override: bulkPrice.value,
            min_stay: bulkMinStay.value,
            max_stay: bulkMaxStay.value,
        }));

        await updateAction.submit({ updates: JSON.stringify(updates) });
        selectedDates.value = [];
        editMode.value = false;
        navigate(`/vendor/resources/${resource.id}/availability?month=${year}-${String(month + 1).padStart(2, '0')}`, { forceReload: true });
    });

    const getStatusColor = (status: AvailabilityStatus | undefined) => {
        switch (status) {
            case 'available':
                return 'bg-success/20 border-success/40';
            case 'blocked':
                return 'bg-error/20 border-error/40';
            case 'maintenance':
                return 'bg-warning/20 border-warning/40';
            default:
                return 'bg-base-200';
        }
    };

    const isToday = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    const isPast = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr < today;
    };

    return (
        <div>
            <PageHeader
                title={`Availability: ${resource.name}`}
                subtitle="Manage daily availability and pricing"
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Resources', href: '/vendor/resources' },
                    { label: resource.name, href: `/vendor/resources/${resource.id}` },
                    { label: 'Availability' },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    {editMode.value ? (
                        <>
                            <button class="btn btn-ghost btn-sm" onClick$={() => { editMode.value = false; selectedDates.value = []; }}>
                                Cancel
                            </button>
                            <button
                                class="btn btn-primary btn-sm"
                                onClick$={handleBulkUpdate}
                                disabled={selectedDates.value.length === 0 || updateAction.isRunning}
                            >
                                {updateAction.isRunning && <span class="loading loading-spinner loading-sm"></span>}
                                Apply Changes ({selectedDates.value.length})
                            </button>
                        </>
                    ) : (
                        <button class="btn btn-primary btn-sm" onClick$={() => editMode.value = true}>
                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Edit Availability
                        </button>
                    )}
                </div>
            </PageHeader>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar */}
                <div class="lg:col-span-3">
                    <div class="card bg-base-100 shadow-sm border border-base-200">
                        <div class="card-body">
                            {/* Calendar Navigation */}
                            <div class="flex justify-between items-center mb-4">
                                <button class="btn btn-ghost btn-sm" onClick$={handlePrevMonth}>
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <div class="flex items-center gap-2">
                                    <h2 class="text-xl font-bold">
                                        {monthNames[month]} {year}
                                    </h2>
                                    <button class="btn btn-ghost btn-xs" onClick$={handleToday}>
                                        Today
                                    </button>
                                </div>
                                <button class="btn btn-ghost btn-sm" onClick$={handleNextMonth}>
                                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>

                            {/* Selection controls */}
                            {editMode.value && (
                                <div class="flex gap-2 mb-4">
                                    <button class="btn btn-ghost btn-xs" onClick$={selectAllDates}>
                                        Select All
                                    </button>
                                    <button class="btn btn-ghost btn-xs" onClick$={clearSelection}>
                                        Clear Selection
                                    </button>
                                    <span class="text-sm text-base-content/60">
                                        {selectedDates.value.length} date(s) selected
                                    </span>
                                </div>
                            )}

                            {/* Calendar Grid */}
                            <div class="grid grid-cols-7 gap-1">
                                {/* Day headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <div key={day} class="text-center text-sm font-medium text-base-content/60 py-2">
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar days */}
                                {calendarDays.value.map((dayInfo) => {
                                    const avail = availabilityMap.value[dayInfo.date];
                                    const isSelected = selectedDates.value.includes(dayInfo.date);
                                    const today = isToday(dayInfo.date);
                                    const past = isPast(dayInfo.date);

                                    return (
                                        <div
                                            key={dayInfo.date}
                                            class={`
                                                min-h-24 p-2 border rounded-lg cursor-pointer transition-all
                                                ${dayInfo.isCurrentMonth ? '' : 'opacity-40'}
                                                ${getStatusColor(avail?.status)}
                                                ${isSelected ? 'ring-2 ring-primary' : ''}
                                                ${today ? 'ring-2 ring-info' : ''}
                                                ${past && !editMode.value ? 'opacity-50' : ''}
                                                ${editMode.value && !past ? 'hover:ring-2 hover:ring-primary/50' : ''}
                                            `}
                                            onClick$={() => {
                                                if (dayInfo.isCurrentMonth && !past) {
                                                    toggleDateSelection(dayInfo.date);
                                                }
                                            }}
                                        >
                                            <div class="flex justify-between items-start">
                                                <span class={`text-sm font-medium ${today ? 'text-info' : ''}`}>
                                                    {dayInfo.day}
                                                </span>
                                                {avail && (
                                                    <span class={`text-xs badge badge-xs ${
                                                        avail.status === 'available' ? 'badge-success' :
                                                        avail.status === 'blocked' ? 'badge-error' :
                                                        'badge-warning'
                                                    }`}>
                                                        {avail.available_count || 1}
                                                    </span>
                                                )}
                                            </div>
                                            {dayInfo.isCurrentMonth && (
                                                <div class="mt-1 text-xs">
                                                    {avail?.price_override ? (
                                                        <div class="font-medium text-primary">
                                                            {formatCurrency(avail.price_override, resource.currency)}
                                                        </div>
                                                    ) : (
                                                        <div class="text-base-content/50">
                                                            {formatCurrency(resource.base_price, resource.currency)}
                                                        </div>
                                                    )}
                                                    {avail?.min_stay && (
                                                        <div class="text-base-content/50">
                                                            Min: {avail.min_stay}n
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-base-200">
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 rounded bg-success/20 border border-success/40"></div>
                                    <span class="text-sm">Available</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 rounded bg-error/20 border border-error/40"></div>
                                    <span class="text-sm">Blocked</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 rounded bg-warning/20 border border-warning/40"></div>
                                    <span class="text-sm">Maintenance</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 rounded bg-base-200"></div>
                                    <span class="text-sm">No data (uses base price)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Bulk Edit Panel */}
                <div class="space-y-6">
                    {editMode.value ? (
                        <div class="card bg-base-100 shadow-sm border border-base-200">
                            <div class="card-body">
                                <h3 class="card-title text-base">Bulk Edit</h3>
                                <p class="text-sm text-base-content/60">
                                    Select dates on the calendar and update their settings.
                                </p>

                                <div class="form-control mt-4">
                                    <label class="label">
                                        <span class="label-text">Status</span>
                                    </label>
                                    <select
                                        class="select select-bordered select-sm"
                                        value={bulkStatus.value}
                                        onChange$={(e) => bulkStatus.value = (e.target as HTMLSelectElement).value as AvailabilityStatus}
                                    >
                                        <option value="available">Available</option>
                                        <option value="blocked">Blocked</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>

                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">Price Override</span>
                                    </label>
                                    <input
                                        type="number"
                                        class="input input-bordered input-sm"
                                        placeholder={`Base: ${resource.base_price}`}
                                        min="0"
                                        step="0.01"
                                        value={bulkPrice.value || ''}
                                        onInput$={(e) => {
                                            const val = (e.target as HTMLInputElement).value;
                                            bulkPrice.value = val ? parseFloat(val) : undefined;
                                        }}
                                    />
                                    <label class="label">
                                        <span class="label-text-alt">Leave empty to use base price</span>
                                    </label>
                                </div>

                                <div class="grid grid-cols-2 gap-2">
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Min Stay</span>
                                        </label>
                                        <input
                                            type="number"
                                            class="input input-bordered input-sm"
                                            placeholder="Nights"
                                            min="1"
                                            value={bulkMinStay.value || ''}
                                            onInput$={(e) => {
                                                const val = (e.target as HTMLInputElement).value;
                                                bulkMinStay.value = val ? parseInt(val) : undefined;
                                            }}
                                        />
                                    </div>
                                    <div class="form-control">
                                        <label class="label">
                                            <span class="label-text">Max Stay</span>
                                        </label>
                                        <input
                                            type="number"
                                            class="input input-bordered input-sm"
                                            placeholder="Nights"
                                            min="1"
                                            value={bulkMaxStay.value || ''}
                                            onInput$={(e) => {
                                                const val = (e.target as HTMLInputElement).value;
                                                bulkMaxStay.value = val ? parseInt(val) : undefined;
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    class="btn btn-primary btn-sm mt-4"
                                    onClick$={handleBulkUpdate}
                                    disabled={selectedDates.value.length === 0 || updateAction.isRunning}
                                >
                                    {updateAction.isRunning && <span class="loading loading-spinner loading-sm"></span>}
                                    Apply to {selectedDates.value.length} date(s)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Resource Info */}
                            <div class="card bg-base-100 shadow-sm border border-base-200">
                                <div class="card-body">
                                    <h3 class="card-title text-base">Resource Info</h3>
                                    <div class="space-y-3 mt-4 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-base-content/60">Status</span>
                                            <span class={`badge badge-sm ${
                                                resource.status === 'available' ? 'badge-success' :
                                                resource.status === 'maintenance' ? 'badge-warning' :
                                                'badge-ghost'
                                            }`}>
                                                {resourceStatusLabels[resource.status]}
                                            </span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-base-content/60">Base Price</span>
                                            <span class="font-medium">
                                                {formatCurrency(resource.base_price, resource.currency)}
                                            </span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-base-content/60">Max Occupancy</span>
                                            <span>{resource.max_occupancy} guests</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div class="card bg-base-100 shadow-sm border border-base-200">
                                <div class="card-body">
                                    <h3 class="card-title text-base">Quick Actions</h3>
                                    <div class="flex flex-col gap-2 mt-4">
                                        <button
                                            class="btn btn-outline btn-sm justify-start"
                                            onClick$={() => editMode.value = true}
                                        >
                                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                            </svg>
                                            Edit Dates
                                        </button>
                                        <Link
                                            href={`/vendor/resources/${resource.id}`}
                                            class="btn btn-outline btn-sm justify-start"
                                        >
                                            <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            View Resource
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div class="card bg-info/10 border border-info/20">
                                <div class="card-body">
                                    <h3 class="card-title text-base text-info">How to Use</h3>
                                    <ul class="text-sm space-y-2 mt-2">
                                        <li class="flex gap-2">
                                            <span class="text-info">1.</span>
                                            Click "Edit Availability" to enter edit mode
                                        </li>
                                        <li class="flex gap-2">
                                            <span class="text-info">2.</span>
                                            Click on dates to select them
                                        </li>
                                        <li class="flex gap-2">
                                            <span class="text-info">3.</span>
                                            Set status, price override, or stay limits
                                        </li>
                                        <li class="flex gap-2">
                                            <span class="text-info">4.</span>
                                            Click "Apply Changes" to save
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});
