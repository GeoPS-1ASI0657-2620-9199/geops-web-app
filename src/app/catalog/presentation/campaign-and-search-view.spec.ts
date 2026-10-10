import { PublishedCampaign, countByStatus } from '../domain/model/campaign';
import { nearbyOffer } from '../testing/nearby-offer.testing';
import { campaignPeriodLabel, zoneLabel } from './campaign-view';
import { sortOffers } from './pages/categories/categories.page';
import { matchesTerm, placeLabelOf, precisionLabelOf, toPins } from './search-view';
import { categoryIcon } from '../../shared/ui/category-icon';
import { remainingTime } from '../../reservation/presentation/reservation-view';

const CAMPAIGN: PublishedCampaign = {
  campaignId: 5,
  name: 'Ceviches de primavera',
  description: '',
  period: { start: '2026-10-09', end: '2026-12-23' },
  zone: { type: 'RADIUS', center: { latitude: -12.12, longitude: -77.03 }, radiusMeters: 800 },
  status: 'ACTIVE',
  offers: [],
};

describe('campaign and search views', () => {
  it('describes the validity of a campaign as the Figma table does', () => {
    expect(campaignPeriodLabel(CAMPAIGN, '2026-10-10')).toBe('Hasta el 23 de diciembre');
    expect(campaignPeriodLabel(CAMPAIGN, '2026-10-01')).toBe('Desde el 9 de octubre hasta el 23 de diciembre');
    expect(campaignPeriodLabel({ ...CAMPAIGN, status: 'FINISHED' }, '2026-10-10')).toBe('Terminó el 23 de diciembre');
  });

  it('describes the zone by radius or by district', () => {
    expect(zoneLabel(CAMPAIGN.zone)).toBe('800 m alrededor del local');
    expect(zoneLabel({ type: 'DISTRICT', district: 'Miraflores', center: CAMPAIGN.zone.center })).toBe('Distrito de Miraflores');
  });

  it('counts the campaigns by status', () => {
    expect(countByStatus([CAMPAIGN, { ...CAMPAIGN, status: 'PAUSED' }, CAMPAIGN])).toEqual({ ACTIVE: 2, PAUSED: 1, FINISHED: 0 });
  });

  it('labels the place and the precision of the search', () => {
    const point = { latitude: -12.12, longitude: -77.03 };
    expect(placeLabelOf({ point, accuracyMeters: 12 })).toBe('Tu ubicación · ±12 m');
    expect(placeLabelOf({ point, districtName: 'Barranco' })).toBe('Barranco');
    expect(placeLabelOf(null)).toBe('');
    expect(precisionLabelOf({ point, accuracyMeters: 12 })).toBe('Precisión ±12 m');
    expect(precisionLabelOf({ point, districtName: 'Barranco' })).toBe('Centro de Barranco');
  });

  it('matches the top bar search against title, business and category without accents', () => {
    const offer = nearbyOffer({ title: 'Ceviche clásico', businessName: 'Cevichería Mar', category: 'Gastronomía' });
    expect(matchesTerm(offer, 'clasico')).toBeTrue();
    expect(matchesTerm(offer, 'GASTRONOMIA')).toBeTrue();
    expect(matchesTerm(offer, '')).toBeTrue();
    expect(matchesTerm(offer, 'pizza')).toBeFalse();
  });

  it('puts a pin with the category icon on each offer', () => {
    const [pin] = toPins([nearbyOffer({ category: 'Cafetería' })]);
    expect(pin.icon).toBe('coffee');
    expect(pin.kind).toBe('verified');
    expect(categoryIcon('Salud y belleza')).toBe('content_cut');
    expect(categoryIcon('Mascotas')).toBe('pets');
    expect(categoryIcon(null)).toBe('sell');
  });

  it('sorts the offers of Categorías by distance, price or end of validity', () => {
    const a = nearbyOffer({ offerId: 1, distanceMeters: 300, price: 30, validTo: '2026-12-01' });
    const b = nearbyOffer({ offerId: 2, distanceMeters: 100, price: 50, validTo: '2026-11-01' });
    const c = nearbyOffer({ offerId: 3, distanceMeters: 200, price: 10, validTo: '2026-12-31' });
    expect(sortOffers([a, b, c], 'distance').map((o) => o.offerId)).toEqual([2, 3, 1]);
    expect(sortOffers([a, b, c], 'price').map((o) => o.offerId)).toEqual([3, 1, 2]);
    expect(sortOffers([a, b, c], 'expiry').map((o) => o.offerId)).toEqual([2, 1, 3]);
  });

  it('counts down to the end of a reservation in minutes, hours or days', () => {
    const now = Date.parse('2026-10-09T12:00:00Z');
    expect(remainingTime('2026-10-09T12:45:00Z', now)).toBe('45 min');
    expect(remainingTime('2026-10-09T15:20:00Z', now)).toBe('3 h 20 min');
    expect(remainingTime('2026-12-08T12:00:00Z', now)).toBe('60 días');
    expect(remainingTime('2026-10-09T11:00:00Z', now)).toBeNull();
  });
});
