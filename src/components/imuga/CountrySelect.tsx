import { component$, type QRL } from '@builder.io/qwik';
import { COUNTRIES } from '~/types/imuga';

interface CountrySelectProps {
  name: string;
  value?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showPhoneCode?: boolean;
  class?: string;
  onChange$?: QRL<(value: string) => void>;
}

export const CountrySelect = component$<CountrySelectProps>(
  ({
    name,
    value,
    label,
    required = false,
    disabled = false,
    placeholder = 'Select a country',
    showPhoneCode = false,
    class: className = '',
    onChange$,
  }) => {
    return (
      <div class="form-control">
        {label && (
          <label class="label">
            <span class="label-text">
              {label}
              {required && <span class="text-error ml-1">*</span>}
            </span>
          </label>
        )}
        <select
          name={name}
          value={value}
          class={`select select-bordered w-full ${className}`}
          required={required}
          disabled={disabled}
          onChange$={(e) => {
            if (onChange$) {
              onChange$((e.target as HTMLSelectElement).value);
            }
          }}
        >
          <option value="">{placeholder}</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {showPhoneCode
                ? `${country.name} (${country.phone_code})`
                : country.name}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

interface PhoneCodeSelectProps {
  name: string;
  value?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
  onChange$?: QRL<(value: string) => void>;
}

export const PhoneCodeSelect = component$<PhoneCodeSelectProps>(
  ({
    name,
    value,
    label,
    required = false,
    disabled = false,
    class: className = '',
    onChange$,
  }) => {
    return (
      <div class="form-control">
        {label && (
          <label class="label">
            <span class="label-text">
              {label}
              {required && <span class="text-error ml-1">*</span>}
            </span>
          </label>
        )}
        <select
          name={name}
          value={value}
          class={`select select-bordered w-full ${className}`}
          required={required}
          disabled={disabled}
          onChange$={(e) => {
            if (onChange$) {
              onChange$((e.target as HTMLSelectElement).value);
            }
          }}
        >
          <option value="">Code</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.phone_code}>
              {`${country.phone_code} (${country.code})`}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

export default CountrySelect;
