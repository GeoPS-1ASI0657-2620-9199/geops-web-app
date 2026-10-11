import { TestBed } from '@angular/core/testing';
import { ApiError, NETWORK_ERROR } from '../../shared/domain/api-error';
import { LocationReading } from '../domain/model/location-reading';
import { LocationProvider } from '../domain/ports/location.provider';
import { OfferRepository } from '../domain/ports/offer.repository';
import { RadiusPreferenceGateway } from '../domain/ports/radius-preference.gateway';
import { RadiusPreferenceStore } from '../domain/ports/radius-preference.store';
import { Session } from '../../iam/domain/model/session';
import { SessionStorage } from '../../iam/domain/ports/session.storage';
import { MemoryRadiusPreferenceStore } from '../testing/radius-preference.testing';
import { OfferSearchStore } from './offer-search.store';
import { nearbyOffer, pageOf } from '../testing/nearby-offer.testing';

const JESUS_MARIA = { name: 'Jesús María', center: { latitude: -12.0782, longitude: -77.0464 } };
const POINT = { latitude: -12.12, longitude: -77.03 };

describe('OfferSearchStore', () => {
  let offers: jasmine.SpyObj<OfferRepository>;
  let store: OfferSearchStore;
  let saved: MemoryRadiusPreferenceStore;
  let profile: jasmine.SpyObj<RadiusPreferenceGateway>;

  const create = (reading: LocationReading, options: { saved?: number | null; session?: Session | null } = {}) => {
    offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById', 'categories']);
    offers.categories.and.resolveTo(['Gastronomía', 'Mascotas']);
    saved = new MemoryRadiusPreferenceStore(options.saved ?? null);
    profile = jasmine.createSpyObj<RadiusPreferenceGateway>('RadiusPreferenceGateway', ['fetch', 'save']);
    profile.fetch.and.resolveTo(10);
    profile.save.and.resolveTo();
    const session = options.session ?? null;
    TestBed.configureTestingModule({
      providers: [
        { provide: OfferRepository, useValue: offers },
        { provide: LocationProvider, useValue: { locate: () => Promise.resolve(reading) } },
        { provide: RadiusPreferenceStore, useValue: saved },
        { provide: RadiusPreferenceGateway, useValue: profile },
        { provide: SessionStorage, useValue: { read: () => session, write: () => undefined, clear: () => undefined } },
      ],
    });
    store = TestBed.inject(OfferSearchStore);
  };

  it('searches around a precise reading at 10 minutes and keeps the accuracy (CA-03.1)', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();

    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 10, 0, null);
    expect(store.state()).toBe('ready');
    expect(store.origin()?.accuracyMeters).toBe(12);
    expect(store.categories()).toEqual(['Gastronomía', 'Mascotas']);
  });

  it('asks Catalog again from page 0 with the chosen category and pages with it (US08)', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()], 0, 2, 2));
    await store.ensureStarted();

    await store.selectCategory('Mascotas');
    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 10, 0, 'Mascotas');

    await store.loadMore();
    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 10, 1, 'Mascotas');

    offers.findNearby.calls.reset();
    await store.selectCategory('Mascotas');
    expect(offers.findNearby).not.toHaveBeenCalled();
  });

  it('builds the chips from the results when the list of Catalog cannot be read', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.categories.and.rejectWith(new ApiError(NETWORK_ERROR, 'no'));
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();

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

    expect(offers.findNearby).toHaveBeenCalledWith(JESUS_MARIA.center, 10, 0, null);
    expect(store.origin()?.districtName).toBe('Jesús María');
  });

  it('warns above 100 m and lets the consumer confirm the point instead of a district (US46, QAS14)', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 150 });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();

    expect(store.state()).toBe('pick-district');
    expect(store.pickReason()).toBe('IMPRECISE');
    expect(store.imprecision()).toBe(150);
    expect(store.canConfirmReading()).toBeTrue();
    expect(offers.findNearby).not.toHaveBeenCalled();

    await store.confirmImpreciseReading();

    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 10, 0, null);
    expect(store.origin()?.accuracyMeters).toBe(150);
    expect(store.canConfirmReading()).toBeFalse();
  });

  it('searches right away from a reading of 80 m', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 80 });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();

    expect(store.state()).toBe('ready');
  });

  it('starts from the radius saved in this browser and saves every new choice (US46, scenario 2)', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 }, { saved: 15 });
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();
    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 15, 0, null);

    await store.setRadius(20);
    expect(saved.saved).toBe(20);
    expect(profile.save).not.toHaveBeenCalled();
  });

  it('uses the radius of the consumer profile and saves the choices there too (US46, scenario 4)', async () => {
    const consumer: Session = {
      accessToken: 't',
      expiresAt: Date.now() + 60_000,
      userId: 41,
      role: 'CONSUMER',
      email: 'lucia@correo.pe',
      consumerId: 41,
    };
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 }, { saved: 5, session: consumer });
    profile.fetch.and.resolveTo(15);
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();
    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 15, 0, null);
    expect(saved.saved).toBe(15);

    await store.widenRadius();
    expect(profile.save).toHaveBeenCalledWith(20);
    await store.ensureStarted();
    expect(profile.fetch).toHaveBeenCalledTimes(1);
  });

  it('searches with the local radius when Identity does not answer', async () => {
    const consumer: Session = { accessToken: 't', expiresAt: Date.now() + 60_000, userId: 41, role: 'CONSUMER', email: 'l@c.pe' };
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 }, { saved: 5, session: consumer });
    profile.fetch.and.rejectWith(new ApiError(NETWORK_ERROR, 'no'));
    profile.save.and.rejectWith(new ApiError(NETWORK_ERROR, 'no'));
    offers.findNearby.and.resolveTo(pageOf([nearbyOffer()]));

    await store.ensureStarted();
    await store.setRadius(10);

    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 5, 0, null);
    expect(store.state()).toBe('ready');
  });

  it('says there are no offers and widens the radius five minutes up to 20 (CA-03.3)', async () => {
    create({ status: 'GRANTED', point: POINT, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(pageOf([]));
    await store.ensureStarted();
    expect(store.state()).toBe('empty');

    await store.widenRadius();
    expect(offers.findNearby).toHaveBeenCalledWith(POINT, 15, 0, null);

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
