import {component$, useSignal, useTask$} from '@builder.io/qwik';
import type {BookingFieldDefinition} from '~/types/booking-fields';
import {Calendar} from './Calendar';

interface DynamicFormFieldProps {
  field: BookingFieldDefinition;
  formValues?: Record<string, any>;
}

export const DynamicFormField = component$<DynamicFormFieldProps>(({field, formValues}) => {
  // Create internal signal for the field value
  const internalValue = useSignal(formValues?.[field.name] || field.defaultValue || '');

  // Sync internal value with formValues
  useTask$(({track}) => {
    const val = track(() => internalValue.value);
    if (formValues) {
      formValues[field.name] = val;
    }
  });

  // Check conditional display
  if (field.conditional && formValues) {
    const conditionField = formValues[field.conditional.field];
    const conditionMet = conditionField === field.conditional.value;

    if (!conditionMet) {
      return null;
    }
  }

  const gridClass = field.gridColumns === 2 ? 'md:col-span-1' : 'md:col-span-2';

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            class="input input-bordered w-full"
            value={internalValue.value}
            onInput$={(e) => internalValue.value = (e.target as HTMLInputElement).value}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            pattern={field.validation?.pattern}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            class="input input-bordered w-full"
            value={internalValue.value}
            onInput$={(e) => internalValue.value = parseInt((e.target as HTMLInputElement).value)}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <Calendar
            value={internalValue}
            name={field.name}
            required={field.required}
            minDate={field.validation?.minDate}
            maxDate={field.validation?.maxDate}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            name={field.name}
            required={field.required}
            class="input input-bordered w-full"
            value={internalValue.value}
            onInput$={(e) => internalValue.value = (e.target as HTMLInputElement).value}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            name={field.name}
            required={field.required}
            class="input input-bordered w-full"
            value={internalValue.value}
            onInput$={(e) => internalValue.value = (e.target as HTMLInputElement).value}
          />
        );

      case 'select':
        return (
          <select
            name={field.name}
            required={field.required}
            class="select select-bordered w-full"
            value={internalValue.value}
            onChange$={(e) => internalValue.value = (e.target as HTMLSelectElement).value}
          >
            <option value="" disabled selected={!internalValue.value}>
              {field.placeholder || `Select ${field.label}`}
            </option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                name={field.name}
                class="checkbox"
                checked={internalValue.value}
                onChange$={(e) => internalValue.value = (e.target as HTMLInputElement).checked}
              />
              <span class="label-text">{field.label}</span>
            </label>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            class="textarea textarea-bordered w-full h-24"
            value={internalValue.value}
            onInput$={(e) => internalValue.value = (e.target as HTMLTextAreaElement).value}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );

      default:
        return null;
    }
  };

  // Checkbox fields render differently
  if (field.type === 'checkbox') {
    return (
      <div class={`form-control ${gridClass}`}>
        {renderField()}
        {field.helpText && (
          <label class="label">
            <span class="label-text-alt text-gray-500">{field.helpText}</span>
          </label>
        )}
      </div>
    );
  }

  return (
    <div class={`form-control ${gridClass}`}>
      <label class="label">
        <span class="label-text font-semibold">
          {field.label}
          {field.required && <span class="text-error ml-1">*</span>}
        </span>
      </label>
      {renderField()}
      {field.helpText && (
        <label class="label">
          <span class="label-text-alt text-gray-500">{field.helpText}</span>
        </label>
      )}
    </div>
  );
});
