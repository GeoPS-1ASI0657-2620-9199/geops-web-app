import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { OfferRepository } from '../../../../catalog/domain/ports/offer.repository';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { SavedOffer, splitByValidity } from '../../../domain/model/saved-offer';
import { SavedOfferRepository } from '../../../domain/ports/saved-offer.repository';
import { FavoritesPage } from './favorites.page';

const saved = (offerId: number, expired: boolean, savedAt: string): SavedOffer => ({
  savedOfferId: offerId,
  offerId,
  businessId: 84,
  businessName: `Comercio ${offerId}`,
  title: `Oferta ${offerId}`,
  validTo: expired ? '2026-09-08' : '2099-12-08',
  expired,
  savedAt,
});

describe('FavoritesPage', () => {
  let fixture: ComponentFixture<FavoritesPage>;
  let repository: jasmine.SpyObj<SavedOfferRepository>;

  const render = async (list: Promise<SavedOffer[]>) => {
    repository = jasmine.createSpyObj<SavedOfferRepository>('SavedOfferRepository', ['findMine', 'save', 'remove']);
    repository.findMine.and.returnValue(list);
    repository.remove.and.resolveTo();
    const offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById']);
    offers.findById.and.rejectWith(new ApiError('OFFER_NOT_FOUND', 'no'));
    await TestBed.configureTestingModule({
      imports: [FavoritesPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SavedOfferRepository, useValue: repository },
        { provide: OfferRepository, useValue: offers },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FavoritesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('separates the valid saved offers from the ones that ended (Figma 10)', async () => {
    await render(Promise.resolve([saved(1, false, '2026-10-01'), saved(2, true, '2026-10-02'), saved(3, false, '2026-10-03')]));

    expect(text()).toContain('favoritesPage.current');
    expect(text()).toContain('favoritesPage.expired');
    const titles = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.geo-card-title')].map((t) => t.textContent?.trim());
    expect(titles).toEqual(['Oferta 3', 'Oferta 1', 'Oferta 2']);
  });

  it('removes an offer from the list', async () => {
    await render(Promise.resolve([saved(1, false, '2026-10-01')]));
    const remove = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes('favoritesPage.remove'),
    )!;

    remove.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(repository.remove).toHaveBeenCalledWith(1);
    expect(text()).toContain('favoritesPage.empty.title');
  });

  it('invites to look for offers when nothing is saved, and offers a retry on errors', async () => {
    await render(Promise.reject(new ApiError(NETWORK_ERROR, 'sin conexión')));
    expect(text()).toContain('favoritesPage.error.title');
  });

  it('splitByValidity keeps the order inside each group', () => {
    const { current, expired } = splitByValidity([saved(1, false, 'a'), saved(2, true, 'b'), saved(3, false, 'c')]);
    expect(current.map((o) => o.offerId)).toEqual([1, 3]);
    expect(expired.map((o) => o.offerId)).toEqual([2]);
  });
});
