import { component$, useSignal, useComputed$, $ } from '@builder.io/qwik';
import {
  routeLoader$,
  Link,
  useNavigate,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { PageHeader } from '~/components/vendor/shared/PageHeader';
import {
    type CalendarBooking,
    type BookingStatus,
} from '~/types/booking-vendor';
import { authenticatedRequest } from '~/utils/auth';
import { apiClient } from '~/utils/api-client';

interface CalendarData {
    success: boolean;
    bookings: CalendarBooking[];
    resources: { id: string; name: string }[];
}

export const useCalendarLoader = routeLoader$<CalendarData>(async (requestEvent) => {
    const url = requestEvent.url;
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const [year, monthNum] = month.split('-').map(Number);

    // Get first and last day of month for API call
    const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];

    const bookingsResult = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.bookings.getCalendar(startDate, endDate, token);
    });

    const resourcesResult = await authenticatedRequest(requestEvent, async (token: string) => {
        return apiClient.vendorPortal.resources.list(token, { limit: 100 });
    });

    return {
        success: bookingsResult.success,
        bookings: (bookingsResult.data?.bookings || []) as CalendarBooking[],
        resources: (resourcesResult.data?.resources || []) as { id: string; name: string }[],
    };
});

export default component$(() => {
    const calendarData = useCalendarLoader();
    const navigate = useNavigate();

    const currentMonth = useSignal(new Date().toISOString().slice(0, 7));
    const viewMode = useSignal<'month' | 'timeline'>('month');

    const bookings = calendarData.value?.bookings || [];
    const resources = calendarData.value?.resources || [];

    // Parse current month
    const parsedMonth = useComputed$(() => {
        const [year, month] = currentMonth.value.split('-').map(Number);
        return { year, month };
    });

    // Get days in month
    const daysInMonth = useComputed$(() => {
        const { year, month } = parsedMonth.value;
        return new Date(year, month, 0).getDate();
    });

    // Get first day of month (0 = Sunday)
    const firstDayOfMonth = useComputed$(() => {
        const { year, month } = parsedMonth.value;
        return new Date(year, month - 1, 1).getDay();
    });

    // Generate calendar days array
    const calendarDays = useComputed$(() => {
        const days: (number | null)[] = [];
        // Add empty cells for days before start of month
        for (let i = 0; i < firstDayOfMonth.value; i++) {
            days.push(null);
        }
        // Add days of month
        for (let i = 1; i <= daysInMonth.value; i++) {
            days.push(i);
        }
        return days;
    });

    const navigateMonth = $((direction: 'prev' | 'next') => {
        const { year, month } = parsedMonth.value;
        let newYear = year;
        let newMonth = month;

        if (direction === 'prev') {
            newMonth--;
            if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
        } else {
            newMonth++;
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            }
        }

        const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
        currentMonth.value = newMonthStr;
        navigate(`/vendor/bookings/calendar?month=${newMonthStr}`);
    });

    const goToToday = $(() => {
        const today = new Date().toISOString().slice(0, 7);
        currentMonth.value = today;
        navigate(`/vendor/bookings/calendar?month=${today}`);
    });

    const formatMonthYear = (monthStr: string) => {
        const [year, month] = monthStr.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    };

    const isToday = (day: number) => {
        const today = new Date();
        const { year, month } = parsedMonth.value;
        return (
            today.getDate() === day &&
            today.getMonth() + 1 === month &&
            today.getFullYear() === year
        );
    };

    const getStatusColor = (status: BookingStatus) => {
        const colors: Record<BookingStatus, string> = {
            pending: 'bg-warning/80',
            confirmed: 'bg-info/80',
            checked_in: 'bg-success/80',
            checked_out: 'bg-neutral/80',
            cancelled: 'bg-error/30',
            no_show: 'bg-base-300',
        };
        return colors[status] || 'bg-primary/80';
    };

    return (
        <div>
            <PageHeader
                title="Booking Calendar"
                subtitle="Visual overview of all bookings"
                breadcrumbs={[
                    { label: 'Vendor Portal', href: '/vendor' },
                    { label: 'Bookings', href: '/vendor/bookings' },
                    { label: 'Calendar' },
                ]}
            >
                <div q:slot="actions" class="flex gap-2">
                    <Link href="/vendor/bookings" class="btn btn-ghost btn-sm">
                        List View
                    </Link>
                    <Link href="/vendor/bookings/new" class="btn btn-primary btn-sm">
                        New Booking
                    </Link>
                </div>
            </PageHeader>

            {/* Calendar Controls */}
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        class="btn btn-sm btn-ghost"
                        onClick$={() => navigateMonth('prev')}
                    >
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <h2 class="text-xl font-semibold min-w-[180px] text-center">
                        {formatMonthYear(currentMonth.value)}
                    </h2>
                    <button
                        type="button"
                        class="btn btn-sm btn-ghost"
                        onClick$={() => navigateMonth('next')}
                    >
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline ml-2" onClick$={goToToday}>
                        Today
                    </button>
                </div>

                <div class="flex items-center gap-2">
                    <div class="btn-group">
                        <button
                            type="button"
                            class={`btn btn-sm ${viewMode.value === 'month' ? 'btn-active' : ''}`}
                            onClick$={() => viewMode.value = 'month'}
                        >
                            Month
                        </button>
                        <button
                            type="button"
                            class={`btn btn-sm ${viewMode.value === 'timeline' ? 'btn-active' : ''}`}
                            onClick$={() => viewMode.value = 'timeline'}
                        >
                            Timeline
                        </button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div class="flex flex-wrap gap-4 mb-4 text-sm">
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded bg-warning/80"></div>
                    <span>Pending</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded bg-info/80"></div>
                    <span>Confirmed</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded bg-success/80"></div>
                    <span>Checked In</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded bg-neutral/80"></div>
                    <span>Checked Out</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded bg-error/30"></div>
                    <span>Cancelled</span>
                </div>
            </div>

            {/* Month View */}
            {viewMode.value === 'month' && (
                <div class="card bg-base-100 shadow-sm border border-base-200">
                    <div class="card-body p-2 sm:p-4">
                        {/* Day Headers */}
                        <div class="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} class="text-center text-sm font-medium text-base-content/60 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div class="grid grid-cols-7 gap-1">
                            {calendarDays.value.map((day, index) => (
                                <div
                                    key={index}
                                    class={`min-h-[100px] p-1 border rounded-lg ${
                                        day === null
                                            ? 'bg-base-200/50 border-transparent'
                                            : isToday(day)
                                                ? 'border-primary bg-primary/5'
                                                : 'border-base-200 hover:bg-base-200/50'
                                    }`}
                                >
                                    {day !== null && (
                                        <>
                                            <div class={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                                                {day}
                                            </div>
                                            <div class="space-y-1">
                                                {bookings
                                                    .filter((booking: CalendarBooking) => {
                                                        const { year, month } = parsedMonth.value;
                                                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                        return dateStr >= booking.check_in_date && dateStr < booking.check_out_date;
                                                    })
                                                    .slice(0, 3)
                                                    .map((booking: CalendarBooking) => (
                                                        <Link
                                                            key={booking.id}
                                                            href={`/vendor/bookings/${booking.id}`}
                                                            class={`block text-xs p-1 rounded truncate text-white ${getStatusColor(booking.status)}`}
                                                            title={`${booking.guest_name} - ${booking.resource_name}`}
                                                        >
                                                            {booking.guest_name}
                                                        </Link>
                                                    ))}
                                                {bookings.filter((booking: CalendarBooking) => {
                                                    const { year, month } = parsedMonth.value;
                                                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                    return dateStr >= booking.check_in_date && dateStr < booking.check_out_date;
                                                }).length > 3 && (
                                                    <div class="text-xs text-base-content/60 text-center">
                                                        +{bookings.filter((booking: CalendarBooking) => {
                                                            const { year, month } = parsedMonth.value;
                                                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                            return dateStr >= booking.check_in_date && dateStr < booking.check_out_date;
                                                        }).length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline View */}
            {viewMode.value === 'timeline' && (
                <div class="card bg-base-100 shadow-sm border border-base-200">
                    <div class="card-body p-0">
                        <div class="overflow-x-auto">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th class="sticky left-0 bg-base-100 z-10 w-40">Resource</th>
                                        {Array.from({ length: daysInMonth.value }, (_, i) => (
                                            <th
                                                key={i + 1}
                                                class={`text-center min-w-[40px] ${isToday(i + 1) ? 'bg-primary/10' : ''}`}
                                            >
                                                {i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {resources.length === 0 ? (
                                        <tr>
                                            <td colSpan={daysInMonth.value + 1} class="text-center py-8 text-base-content/50">
                                                No resources found. Add resources to see the timeline.
                                            </td>
                                        </tr>
                                    ) : (
                                        resources.map((resource: { id: string; name: string }) => (
                                            <tr key={resource.id}>
                                                <td class="sticky left-0 bg-base-100 z-10 font-medium">
                                                    {resource.name}
                                                </td>
                                                {Array.from({ length: daysInMonth.value }, (_, dayIndex) => {
                                                    const day = dayIndex + 1;
                                                    const { year, month } = parsedMonth.value;
                                                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                                                    const booking = bookings.find(
                                                        (b: CalendarBooking) =>
                                                            b.resource_id === resource.id &&
                                                            dateStr >= b.check_in_date &&
                                                            dateStr < b.check_out_date
                                                    );

                                                    return (
                                                        <td
                                                            key={day}
                                                            class={`p-0 ${isToday(day) ? 'bg-primary/5' : ''}`}
                                                        >
                                                            {booking && (
                                                                <Link
                                                                    href={`/vendor/bookings/${booking.id}`}
                                                                    class={`block h-8 ${getStatusColor(booking.status)} hover:opacity-80`}
                                                                    title={`${booking.guest_name} - ${booking.booking_number}`}
                                                                />
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Total Bookings</div>
                    <div class="stat-value text-xl">{bookings.length}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Check-ins</div>
                    <div class="stat-value text-xl text-info">
                        {bookings.filter((b: CalendarBooking) => {
                            const { year, month } = parsedMonth.value;
                            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
                            return b.check_in_date.startsWith(monthStr);
                        }).length}
                    </div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Check-outs</div>
                    <div class="stat-value text-xl text-success">
                        {bookings.filter((b: CalendarBooking) => {
                            const { year, month } = parsedMonth.value;
                            const monthStr = `${year}-${String(month).padStart(2, '0')}`;
                            return b.check_out_date.startsWith(monthStr);
                        }).length}
                    </div>
                </div>
                <div class="stat bg-base-100 shadow-sm rounded-lg border border-base-200 py-3 px-4">
                    <div class="stat-title text-xs">Occupancy</div>
                    <div class="stat-value text-xl">
                        {resources.length > 0
                            ? Math.round(
                                (bookings.filter((b: CalendarBooking) => b.status === 'checked_in').length /
                                    resources.length) *
                                100
                            )
                            : 0}%
                    </div>
                </div>
            </div>
        </div>
    );
});


export const head: DocumentHead = {
  title: 'Booking Calender | Vendor Portal',
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow',
    },
  ],
};
