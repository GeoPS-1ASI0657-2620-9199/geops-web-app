import { TestBed } from '@angular/core/testing';
import { ApiError, NETWORK_ERROR } from '../../shared/domain/api-error';
import { LocationReading } from '../domain/model/location-reading';
import { LocationProvider } from '../domain/ports/location.provider';
import { OfferRepository } from '../domain/ports/offer.repository';
import { OfferSearchStore } from './offer-search.store';
import { nearbyOffer, pageOf } from '../testing/nearby-offer.testing';

const JESUS_MARIA = { name: 'Jesús María', center: { latitude: -12.0782, longitude: -77.0464 } };
const POINT = { latitude: -12.12, longitude: -77.03 };

describe('OfferSearchStore', () => {
  let offers: jasmine.SpyObj<OfferRepository>;
  let store: OfferSearchStore;

  const create = (reading: LocationReading) => {
    offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById']);
    TestBed.configureTestingModule({
      providers: [
        { provide: OfferRepository, useValue: offers },
        { provide: LocationProvider, useValue: { locate: () => Promise.resolve(reading) } },
      ],
    });
    store = TestBed.inject(OfferSearchStore);
  };

  it('searches around a precise reading at 10 minutes and keeps the accuracy (CA-03.1)', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();

    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 10, 0);
    expect(store.state()).toBe('ready');
    expect(store.origin()?.accuracyMeters).toBe(12);
    expect(store.categories()).toEqual(['Gastronomía']);
  });

  it('starts only once, so a change of tab keeps the search', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();
    await store.ensureStarted();

    expect(offers.findNearby).toHaveBeenCalledTimes(1);
  });

  it('asks for a district when the permission is denied and searches from its center (CA-03.2)', async () => {
    create({ status: 'DENIED' });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();
    expect(store.state()).toBe('pick-district');
    expect(store.pickReason()).toBe('DENIED');
    expect(offers.findNearby).not.toHaveBeenCalled();

    await store.chooseDistrict(JESUS_MARIA);

    expect(offers.findNearby).toHaveBeenCalledWith(JESUS_MARIA.center, 10, 0);
    expect(store.origin()?.districtName).toBe('Jesús María');
  });

  it('keeps the margin of an imprecise reading to warn about it (US46)', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 1200 });

    await store.ensureStarted();

    expect(store.state()).toBe('pick-district');
    expect(store.pickReason()).toBe('IMPRECISE');
    expect(store.imprecision()).toBe(1200);
  });

  it('says there are no offers and widens the radius five minutes up to 20 (CA-03.3)', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(pageOf([]));
    await store.ensureStarted();
    expect(store.state()).toBe('empty');

    await store.widenRadius();
    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 15, 0);

    await store.setRadius(20);
    expect(store.nextRadius()).toBeNull();
  });

  it('clamps the radius to the 5 to 20 minutes of the platform', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));
    await store.ensureStarted();

    await store.setRadius(45);

    expect(store.radius()).toBe(20);
  });

  it('shows a retry when Catalog cannot be reached, without its technical message', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.rejectWith(new ApiError(NETWORK_ERROR, 'No se pudo conectar con el servidor.'));
    await store.ensureStarted();

    expect(store.state()).toBe('error');
    expect(store.errorMessage()).toBeNull();

    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));
    await store.retry();

    expect(store.state()).toBe('ready');
  });

  it('appends the next pages, and loadAll brings every page for the counters', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.callFake((_origin, _radius, page) =>
      Promise.resolve(pageOf([nearbyOffer({ offerId: 100 + page })], page, 3, 3)),
    );
    await store.ensureStarted();
    expect(store.canLoadMore()).toBeTrue();

    await store.loadAll();

    expect(store.offers().map((o) => o.offerId)).toEqual([100, 101, 102]);
    expect(store.canLoadMore()).toBeFalse();
  });
});
