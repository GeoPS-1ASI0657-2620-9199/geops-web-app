import { TestBed } from '@angular/core/testing';
import { ModerationOffer } from '../domain/model/moderation';
import { ModerationRepository } from '../domain/ports/moderation.repository';
import { RemoveOfferUseCase } from './remove-offer.use-case';

const OFFER: ModerationOffer = {
  offerId: 1052,
  title: '2x1 en almuerzos ejecutivos',
  category: 'Gastronomía',
  source: 'AFFILIATED',
  businessId: 84,
  businessName: 'Restaurante Don Pepe',
  status: 'PUBLISHED',
  validTo: '2026-11-30',
  openReports: 0,
  verifiedSeal: false,
};

describe('RemoveOfferUseCase', () => {
  let moderation: jasmine.SpyObj<ModerationRepository>;

  beforeEach(() => {
    moderation = jasmine.createSpyObj<ModerationRepository>('ModerationRepository', ['remove']);
    TestBed.configureTestingModule({ providers: [{ provide: ModerationRepository, useValue: moderation }] });
  });

  it('removes the offer with the reason and returns it as REMOVED (US24)', async () => {
    moderation.remove.and.resolveTo({
      moderationId: 31,
      offerId: 1052,
      adminId: 1,
      reason: 'Precio engañoso en el anuncio',
      removedAt: '2026-11-22T15:04:05Z',
    });

    const removed = await TestBed.inject(RemoveOfferUseCase).execute(OFFER, '  Precio engañoso en el anuncio ');

    expect(moderation.remove).toHaveBeenCalledOnceWith(1052, 'Precio engañoso en el anuncio');
    expect(removed.status).toBe('REMOVED');
    expect(removed.title).toBe(OFFER.title);
  });

  it('never calls Catalog with a reason shorter than 10 characters', async () => {
    await expectAsync(TestBed.inject(RemoveOfferUseCase).execute(OFFER, '  spam   ')).toBeRejectedWithError(RangeError);
    expect(moderation.remove).not.toHaveBeenCalled();
  });
});
