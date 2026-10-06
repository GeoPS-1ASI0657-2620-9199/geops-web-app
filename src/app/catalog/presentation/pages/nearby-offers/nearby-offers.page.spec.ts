import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { LocationReading } from '../../../domain/model/location-reading';
import { NearbyOfferPage } from '../../../domain/model/nearby-offer';
import { DistrictDirectory } from '../../../domain/ports/district.directory';
import { LocationProvider } from '../../../domain/ports/location.provider';
import { OfferRepository } from '../../../domain/ports/offer.repository';
import { NearbyOffersPage } from './nearby-offers.page';

const JESUS_MARIA = { name: 'Jesús María', center: { latitude: -12.0782, longitude: -77.0464 } };
const ONE_OFFER: NearbyOfferPage = {
  offers: [
    {
      offerId: 1052,
      title: '2x1 en almuerzos ejecutivos',
      businessId: 84,
      businessName: 'Restaurante Don Pepe',
      verifiedSeal: true,
      distanceMeters: 350,
      walkMinutes: 5,
      category: 'Gastronomía',
      price: 15,
      validTo: '2099-10-15',
    },
  ],
  page: 0,
  totalElements: 1,
  totalPages: 1,
};
const EMPTY: NearbyOfferPage = { offers: [], page: 0, totalElements: 0, totalPages: 0 };

describe('NearbyOffersPage', () => {
  let fixture: ComponentFixture<NearbyOffersPage>;
  let page: NearbyOffersPage;
  let offers: jasmine.SpyObj<OfferRepository>;

  const create = async (reading: LocationReading) => {
    offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby']);
    await TestBed.configureTestingModule({
      imports: [NearbyOffersPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: OfferRepository, useValue: offers },
        { provide: LocationProvider, useValue: { locate: () => Promise.resolve(reading) } },
        { provide: DistrictDirectory, useValue: { all: () => [JESUS_MARIA] } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NearbyOffersPage);
    page = fixture.componentInstance;
  };
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const state = () => (page as unknown as { state(): string }).state();

  it('lists the offers around a precise reading with their distance (CA-03.1)', async () => {
    await create({ status: 'GRANTED', point: { latitude: -12.12, longitude: -77.03 }, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(ONE_OFFER);

    await settle();

    expect(offers.findNearby).toHaveBeenCalledWith({ latitude: -12.12, longitude: -77.03 }, 10, 0);
    expect(text()).toContain('Restaurante Don Pepe');
    expect(text()).toContain('350 m · 5 min');
  });

  it('offers the district choice when the permission is denied and searches from its center (CA-03.2)', async () => {
    await create({ status: 'DENIED' });
    offers.findNearby.and.resolveTo(ONE_OFFER);
    await settle();

    expect(state()).toBe('pick-district');
    expect(offers.findNearby).not.toHaveBeenCalled();

    await page.onDistrictSelected(JESUS_MARIA);

    expect(offers.findNearby).toHaveBeenCalledWith(JESUS_MARIA.center, 10, 0);
  });

  it('says there are no offers and widens the radius five minutes (CA-03.3)', async () => {
    await create({ status: 'GRANTED', point: { latitude: -12.12, longitude: -77.03 }, accuracyMeters: 12 });
    offers.findNearby.and.resolveTo(EMPTY);
    await settle();

    expect(state()).toBe('empty');

    await page.widenRadius();

    expect(offers.findNearby).toHaveBeenCalledWith({ latitude: -12.12, longitude: -77.03 }, 15, 0);
  });

  it('shows a retry when Catalog cannot be reached', async () => {
    await create({ status: 'GRANTED', point: { latitude: -12.12, longitude: -77.03 }, accuracyMeters: 12 });
    offers.findNearby.and.rejectWith(new ApiError(NETWORK_ERROR, 'No se pudo conectar con el servidor.'));
    await settle();

    expect(state()).toBe('error');

    offers.findNearby.and.resolveTo(ONE_OFFER);
    await page.retry();

    expect(state()).toBe('ready');
  });
});
