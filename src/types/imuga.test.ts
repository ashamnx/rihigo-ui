import { getCountryByCode, getCountryName, createEmptyTravelerData, COUNTRIES } from './imuga';

describe('getCountryByCode', () => {
  it('returns country object for valid code', () => {
    const country = getCountryByCode('MV');
    expect(country).toBeDefined();
    expect(country!.name).toBe('Maldives');
    expect(country!.phone_code).toBeDefined();
  });

  it('returns undefined for invalid code', () => {
    expect(getCountryByCode('XX')).toBeUndefined();
  });

  it('finds US country', () => {
    const country = getCountryByCode('US');
    expect(country).toBeDefined();
    expect(country!.name).toBe('United States');
  });
});

describe('getCountryName', () => {
  it('returns country name for valid code', () => {
    expect(getCountryName('MV')).toBe('Maldives');
  });

  it('returns code itself for invalid code', () => {
    expect(getCountryName('XX')).toBe('XX');
  });
});

describe('createEmptyTravelerData', () => {
  it('returns object with all required fields', () => {
    const data = createEmptyTravelerData();
    expect(data.first_name).toBe('');
    expect(data.last_name).toBe('');
    expect(data.passport_number).toBe('');
    expect(data.email).toBe('');
    expect(data.phone).toBe('');
  });

  it('has correct default values', () => {
    const data = createEmptyTravelerData();
    expect(data.title).toBe('mr');
    expect(data.gender).toBe('male');
    expect(data.visit_purpose).toBe('tourism');
  });

  it('has default boolean values', () => {
    const data = createEmptyTravelerData();
    expect(data.yellow_fever_endemic_travel).toBe(false);
    expect(data.customs_items_to_declare).toBe(false);
  });
});
