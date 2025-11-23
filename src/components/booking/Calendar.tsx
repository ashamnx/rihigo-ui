import {component$, useSignal, useComputed$, $, type Signal} from '@builder.io/qwik';

interface CalendarProps {
  value?: Signal<string>;
  name: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
}

export const Calendar = component$<CalendarProps>(({value, name, required, minDate, maxDate}) => {
  const selectedDate = useComputed$(() => {
    const dateValue = value?.value;
    return dateValue ? new Date(dateValue) : null;
  });

  // Current view month/year
  const currentMonth = useSignal(new Date().getMonth());
  const currentYear = useSignal(new Date().getFullYear());

  const daysInMonth = useComputed$(() => {
    return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  });

  const firstDayOfMonth = useComputed$(() => {
    return new Date(currentYear.value, currentMonth.value, 1).getDay();
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleDateSelect = $((day: number) => {
    const date = new Date(currentYear.value, currentMonth.value, day, 12, 0, 0);
    // Use ISO string which includes timezone offset
    const formattedDate = date.toISOString();

    if (value) {
      value.value = formattedDate;
    }
  });

  const previousMonth = $(() => {
    if (currentMonth.value === 0) {
      currentMonth.value = 11;
      currentYear.value--;
    } else {
      currentMonth.value--;
    }
  });

  const nextMonth = $(() => {
    if (currentMonth.value === 11) {
      currentMonth.value = 0;
      currentYear.value++;
    } else {
      currentMonth.value++;
    }
  });

  const isDateDisabled = (day: number): boolean => {
    const year = currentYear.value;
    const month = String(currentMonth.value + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;

    // Default minimum date is today if not specified
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const effectiveMinDate = minDate || todayStr;

    if (dateStr < effectiveMinDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate calendar days
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth.value; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth.value; day++) {
    calendarDays.push(day);
  }

  return (
    <div class="w-full">
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={value?.value || ''}
        required={required}
      />

      {/* Always visible calendar */}
      <div class="bg-white rounded-lg border border-gray-200 p-4 w-full max-w-md mx-auto">
          {/* Month/Year navigation */}
          <div class="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick$={previousMonth}
              class="btn btn-ghost btn-sm btn-circle"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="font-semibold text-gray-900">
              {monthNames[currentMonth.value]} {currentYear.value}
            </div>

            <button
              type="button"
              onClick$={nextMonth}
              class="btn btn-ghost btn-sm btn-circle"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div class="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} class="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div class="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} class="aspect-square" />;
              }

              const isSelected = selectedDate.value?.getDate() === day &&
                selectedDate.value?.getMonth() === currentMonth.value &&
                selectedDate.value?.getFullYear() === currentYear.value;

              const isToday = new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.value &&
                new Date().getFullYear() === currentYear.value;

              const disabled = isDateDisabled(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick$={() => !disabled && handleDateSelect(day)}
                  disabled={disabled}
                  class={`
                    aspect-square flex items-center justify-center rounded-lg text-sm
                    transition-colors
                    ${isSelected
                      ? 'bg-primary text-primary-content font-bold'
                      : isToday
                      ? 'bg-primary/10 text-primary font-semibold'
                      : disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-900'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Selected date display */}
          <div class="mt-4 pt-3 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Selected:</span>
              <span class="text-sm font-semibold text-gray-900">
                {selectedDate.value ? formatDisplayDate(selectedDate.value) : 'No date selected'}
              </span>
            </div>
            <button
              type="button"
              onClick$={() => {
                const today = new Date();
                today.setHours(12, 0, 0, 0);
                const todayStr = today.toISOString();
                if (value) {
                  value.value = todayStr;
                }
                currentMonth.value = today.getMonth();
                currentYear.value = today.getFullYear();
              }}
              class="btn btn-ghost btn-sm w-full mt-2"
            >
              Select Today
            </button>
          </div>
        </div>
    </div>
  );
});
