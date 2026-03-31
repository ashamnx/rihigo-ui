import { component$, type QRL } from '@builder.io/qwik';
import { COUNTRIES } from '~/types/imuga';
import { SearchableSelect } from './SearchableSelect';

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
    const options = COUNTRIES.map((c) => ({
      value: c.code,
      label: showPhoneCode ? `${c.name} (${c.phone_code})` : c.name,
      searchText: `${c.phone_code} ${c.code}`,
    }));

    return (
      <SearchableSelect
        name={name}
        value={value}
        label={label}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        options={options}
        class={className}
        onChange$={onChange$}
      />
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
    const options = COUNTRIES.map((c) => ({
      value: c.phone_code,
      label: `${c.phone_code} (${c.code})`,
      searchText: c.name,
    }));

    return (
      <SearchableSelect
        name={name}
        value={value}
        label={label}
        required={required}
        disabled={disabled}
        placeholder="Code"
        options={options}
        class={className}
        onChange$={onChange$}
      />
    );
  }
);

export default CountrySelect;
