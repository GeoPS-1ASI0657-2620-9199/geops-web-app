import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { ReservationRepository } from '../../../../reservation/domain/ports/reservation.repository';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { OfferDetail } from '../../../domain/model/offer-detail';
import { OfferRepository } from '../../../domain/ports/offer.repository';
import { OfferDetailPage } from './offer-detail.page';
import { of } from 'rxjs';
import { SavedOfferRepository } from '../../../../engagement/domain/ports/saved-offer.repository';
import { LocationProvider } from '../../../domain/ports/location.provider';

const OFFER: OfferDetail = {
  offerId: 1052,
  title: '2x1 en almuerzos ejecutivos',
  conditions: 'Válido de lunes a viernes de 12:00 a 15:00. Un cupón por mesa.',
  price: 15,
  validTo: '2099-10-15',
  category: 'Gastronomía',
  address: 'Av. Larco 345, Miraflores',
  location: { latitude: -12.1211, longitude: -77.0297 },
  imageUrl: null,
  source: 'AFFILIATED',
  businessId: 84,
  businessName: 'Restaurante Don Pepe',
  verifiedSeal: true,
  available: true,
};

const SESSION_LIFETIME_MS = 60_000;
const sessionOf = (role: Session['role']): Session => ({
  accessToken: 't',
  expiresAt: Date.now() + SESSION_LIFETIME_MS,
  userId: 7,
  role,
  email: 'ana@correo.pe',
  consumerId: 2001,
});
const PLACED = { reservationId: 15, code: 'K7P3XM9Q', expiresAt: '2026-10-15T04:59:59Z', isNew: true };

class MemorySessionStorage extends SessionStorage {
  constructor(private readonly stored: Session | null) {
    super();
  }
  override read(): Session | null {
    return this.stored;
  }
  override write(): void {}
  override clear(): void {}
}

describe('OfferDetailPage', () => {
  let fixture: ComponentFixture<OfferDetailPage>;
  let offers: jasmine.SpyObj<OfferRepository>;
  let reservations: jasmine.SpyObj<ReservationRepository>;
  let savedOffers: jasmine.SpyObj<SavedOfferRepository>;
  let session: Session | null;

  const render = async (id = '1052') => {
    await TestBed.configureTestingModule({
      imports: [OfferDetailPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: OfferRepository, useValue: offers },
        { provide: ReservationRepository, useValue: reservations },
        { provide: SessionStorage, useValue: new MemorySessionStorage(session) },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) }, paramMap: of(convertToParamMap({ id })) } },
        { provide: SavedOfferRepository, useValue: savedOffers },
        { provide: LocationProvider, useValue: { locate: () => Promise.resolve({ status: 'DENIED' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OfferDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  };

  const reserveButton = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button.reserve');
  const clickReserve = async () => {
    reserveButton()!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  };

  beforeEach(() => {
    offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById']);
    savedOffers = jasmine.createSpyObj<SavedOfferRepository>('SavedOfferRepository', ['findMine', 'save', 'remove']);
    reservations = jasmine.createSpyObj<ReservationRepository>('ReservationRepository', [
      'reserve',
      'findById',
      'findMine',
    ]);
    session = sessionOf('CONSUMER');
  });

  it('shows price, validity, conditions and the business with its seal (CA-04.1)', async () => {
    offers.findById.and.resolveTo(OFFER);

    const text = await render();

    expect(offers.findById).toHaveBeenCalledWith(1052);
    expect(text).toContain('2x1 en almuerzos ejecutivos');
    expect(text).toContain('15.00');
    expect(text).toContain('Un cupón por mesa.');
    expect(text).toContain('Restaurante Don Pepe');
    expect(text).toContain('Verificado');
  });

  it('marks an expired offer as not available (CA-04.2)', async () => {
    offers.findById.and.resolveTo({ ...OFFER, validTo: '2026-10-01', available: false });

    const text = await render();

    expect(text).toContain('offerDetailPage.unavailable.title');
    expect(text).toContain('Vencida');
  });

  it('says the offer does not exist on OFFER_NOT_FOUND', async () => {
    offers.findById.and.rejectWith(new ApiError('OFFER_NOT_FOUND', 'La oferta 9999 no existe.'));

    expect(await render('9999')).toContain('offerDetailPage.notFound.title');
  });

  it('offers a retry when Catalog cannot be reached', async () => {
    offers.findById.and.rejectWith(new ApiError(NETWORK_ERROR, 'No se pudo conectar con el servidor.'));

    expect(await render()).toContain('offerDetailPage.error.retry');
  });

  it('does not call Catalog with an invalid id', async () => {
    expect(await render('abc')).toContain('offerDetailPage.notFound.title');
    expect(offers.findById).not.toHaveBeenCalled();
  });

  describe('reserve (US40)', () => {
    let navigate: jasmine.Spy;

    const renderAvailable = async () => {
      offers.findById.and.resolveTo(OFFER);
      const text = await render();
      navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      return text;
    };

    it('lets a consumer reserve and opens the new reservation', async () => {
      reservations.reserve.and.resolveTo(PLACED);
      await renderAvailable();

      expect(reserveButton()!.disabled).toBeFalse();
      await clickReserve();

      expect(reservations.reserve).toHaveBeenCalledWith(1052);
      expect(navigate).toHaveBeenCalledWith(['/reservations', 15], { queryParams: { placed: 'new' } });
    });

    it('opens the reservation the consumer already had when the service answers 200', async () => {
      reservations.reserve.and.resolveTo({ ...PLACED, isNew: false });
      await renderAvailable();

      await clickReserve();

      expect(navigate).toHaveBeenCalledWith(['/reservations', 15], { queryParams: { placed: 'existing' } });
    });

    it('explains that the offer can no longer be reserved on OFFER_NOT_AVAILABLE', async () => {
      reservations.reserve.and.rejectWith(new ApiError('OFFER_NOT_AVAILABLE', 'Offer 1052 is no longer valid'));
      await renderAvailable();

      const text = await clickReserve();

      expect(text).toContain('offerDetailPage.reserveError.OFFER_NOT_AVAILABLE.title');
      expect(navigate).not.toHaveBeenCalled();
      expect(reserveButton()!.disabled).toBeFalse();
    });

    it('shows the message of the service for an answer it has no text for', async () => {
      reservations.reserve.and.rejectWith(new ApiError('INTERNAL_ERROR', 'The operation could not be completed'));
      await renderAvailable();

      const text = await clickReserve();

      expect(text).toContain('offerDetailPage.reserveError.DEFAULT.title');
      expect(text).toContain('The operation could not be completed');
    });

    it('sends a visitor to log in and come back to the offer', async () => {
      session = null;
      await renderAvailable();

      await clickReserve();

      expect(reservations.reserve).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/offers/1052' } });
    });

    it('does not offer the reservation to a business owner', async () => {
      session = sessionOf('BUSINESS_OWNER');
      await renderAvailable();

      expect(reserveButton()).toBeNull();
    });

    it('keeps the button disabled for an offer that is not available', async () => {
      offers.findById.and.resolveTo({ ...OFFER, available: false });
      await render();

      expect(reserveButton()!.disabled).toBeTrue();
    });
  });
});
