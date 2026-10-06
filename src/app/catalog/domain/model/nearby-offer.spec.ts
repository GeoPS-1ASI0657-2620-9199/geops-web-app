import { clampRadius, hasMorePages, widerRadius } from './nearby-offer';
import { isPrecise } from './location-reading';

describe('nearby offer rules', () => {
  it('keeps the radius between 5 and 20 walking minutes', () => {
    expect(clampRadius(3)).toBe(5);
    expect(clampRadius(12.4)).toBe(12);
    expect(clampRadius(25)).toBe(20);
  });

  it('widens five minutes at a time and stops at the platform limit (CA-03.3)', () => {
    expect(widerRadius(10)).toBe(15);
    expect(widerRadius(18)).toBe(20);
    expect(widerRadius(20)).toBeNull();
  });

  it('knows when there is another page', () => {
    expect(hasMorePages({ offers: [], page: 0, totalElements: 25, totalPages: 2 })).toBeTrue();
    expect(hasMorePages({ offers: [], page: 1, totalElements: 25, totalPages: 2 })).toBeFalse();
  });

  it('treats a reading worse than 1000 m as not precise (E-05)', () => {
    const point = { latitude: -12.07, longitude: -77.04 };
    expect(isPrecise({ status: 'GRANTED', point, accuracyMeters: 12 })).toBeTrue();
    expect(isPrecise({ status: 'GRANTED', point, accuracyMeters: 1200 })).toBeFalse();
    expect(isPrecise({ status: 'DENIED' })).toBeFalse();
  });
});
