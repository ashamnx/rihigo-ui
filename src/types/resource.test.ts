import { getResourceTypesForService, type ServiceType } from './resource';

describe('getResourceTypesForService', () => {
  it('returns [room] for accommodation', () => {
    expect(getResourceTypesForService('accommodation')).toEqual(['room']);
  });

  it('returns [vehicle, boat] for transfer', () => {
    expect(getResourceTypesForService('transfer')).toEqual(['vehicle', 'boat']);
  });

  it('returns [vehicle, equipment, boat] for rental', () => {
    expect(getResourceTypesForService('rental')).toEqual(['vehicle', 'equipment', 'boat']);
  });

  it('returns [vehicle, boat, equipment] for tour', () => {
    expect(getResourceTypesForService('tour')).toEqual(['vehicle', 'boat', 'equipment']);
  });

  it('returns [vehicle, boat, equipment] for activity', () => {
    expect(getResourceTypesForService('activity')).toEqual(['vehicle', 'boat', 'equipment']);
  });

  it('returns all types for unknown service type', () => {
    expect(getResourceTypesForService('unknown' as ServiceType)).toEqual(['room', 'vehicle', 'equipment', 'boat']);
  });
});
