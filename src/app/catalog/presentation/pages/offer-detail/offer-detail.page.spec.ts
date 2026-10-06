import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { OfferDetail } from '../../../domain/model/offer-detail';
import { OfferRepository } from '../../../domain/ports/offer.repository';
import { OfferDetailPage } from './offer-detail.page';

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

describe('OfferDetailPage', () => {
  let fixture: ComponentFixture<OfferDetailPage>;
  let offers: jasmine.SpyObj<OfferRepository>;

  const render = async (id = '1052') => {
    await TestBed.configureTestingModule({
      imports: [OfferDetailPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: OfferRepository, useValue: offers },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OfferDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  };

  beforeEach(() => {
    offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById']);
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
});
