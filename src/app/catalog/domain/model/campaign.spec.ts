import { CampaignDraft, firstViolation, todayInLima } from './campaign';

const TODAY = '2026-10-05';
const DRAFT: CampaignDraft = {
  name: 'Almuerzos de octubre',
  description: 'Menú ejecutivo a mitad de precio para oficinas cercanas',
  period: { start: '2026-10-05', end: '2026-10-31' },
  estimatedBudget: 500,
  storeLocation: { address: 'Av. Larco 345, Miraflores', point: { latitude: -12.1211, longitude: -77.0297 } },
  zone: { type: 'RADIUS', center: { latitude: -12.1211, longitude: -77.0297 }, radiusMeters: 800 },
  offers: [
    {
      title: '2x1 en almuerzos ejecutivos',
      conditions: 'Válido de lunes a viernes de 12:00 a 15:00. Un cupón por mesa.',
      price: 15,
      validTo: '2026-10-15',
      category: 'Gastronomía',
    },
  ],
};

describe('campaign rules (BRD-05 RF-02 and RF-03)', () => {
  it('accepts the example campaign of BRD-05', () => {
    expect(firstViolation(DRAFT, TODAY)).toBeNull();
  });

  it('rejects a validity that already ended (CA-05.3)', () => {
    expect(firstViolation({ ...DRAFT, period: { start: '2026-09-01', end: '2026-09-30' } }, TODAY)).toBe(
      'CAMPAIGN_ALREADY_ENDED',
    );
  });

  it('rejects an end before the start', () => {
    expect(firstViolation({ ...DRAFT, period: { start: '2026-10-20', end: '2026-10-10' } }, TODAY)).toBe(
      'INVALID_CAMPAIGN_PERIOD',
    );
  });

  it('keeps the radius between 400 m and 5 km', () => {
    const zone = (radiusMeters: number) => ({ ...DRAFT, zone: { ...DRAFT.zone, radiusMeters } as CampaignDraft['zone'] });
    expect(firstViolation(zone(300), TODAY)).toBe('INVALID_CAMPAIGN_ZONE');
    expect(firstViolation(zone(5000), TODAY)).toBeNull();
    expect(firstViolation(zone(5100), TODAY)).toBe('INVALID_CAMPAIGN_ZONE');
  });

  it('accepts a district zone with its center (US06)', () => {
    const district: CampaignDraft = {
      ...DRAFT,
      zone: { type: 'DISTRICT', district: 'Miraflores', center: { latitude: -12.1215, longitude: -77.0259 } },
    };
    expect(firstViolation(district, TODAY)).toBeNull();
  });

  it('asks for at least one offer and for offers inside the period', () => {
    expect(firstViolation({ ...DRAFT, offers: [] }, TODAY)).toBe('CAMPAIGN_WITHOUT_OFFERS');
    expect(firstViolation({ ...DRAFT, offers: [{ ...DRAFT.offers[0], validTo: '2026-11-15' }] }, TODAY)).toBe(
      'OFFER_VALIDITY_OUTSIDE_CAMPAIGN',
    );
  });

  it('asks for the store on the map', () => {
    expect(firstViolation({ ...DRAFT, storeLocation: { ...DRAFT.storeLocation, point: null } }, TODAY)).toBe(
      'INVALID_STORE_LOCATION',
    );
  });

  it('takes the day in Lima, not in UTC', () => {
    expect(todayInLima(new Date('2026-10-05T03:00:00Z'))).toBe('2026-10-04');
  });
});
