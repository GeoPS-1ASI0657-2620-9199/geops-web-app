import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SavedOfferRepository } from '../../../../engagement/domain/ports/saved-offer.repository';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { ReservationRepository } from '../../../../reservation/domain/ports/reservation.repository';
import { DistrictDirectory } from '../../../domain/ports/district.directory';
import { LocationProvider } from '../../../domain/ports/location.provider';
import { OfferRepository } from '../../../domain/ports/offer.repository';
import { GeoOffersMap } from '../../../../shared/ui/geo-offers-map/geo-offers-map';
import { nearbyOffer, pageOf } from '../../../testing/nearby-offer.testing';
import { CategoriesPage } from '../categories/categories.page';
import { HomePage } from './home.page';
import { radiusPreferenceTestingProviders } from '../../../testing/radius-preference.testing';

const CONSUMER: Session = {
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 7,
  role: 'CONSUMER',
  email: 'lucia.fernandez@correo.pe',
  consumerId: 7,
};
const CATEGORIES = ['Gastronomía', 'Cafetería', 'Mascotas'];
const OFFERS = [1, 2, 3, 4, 5, 6, 7].map((id) =>
  nearbyOffer({ offerId: id, businessName: `Comercio ${id}`, distanceMeters: id * 100, walkMinutes: id, category: id % 2 ? 'Gastronomía' : 'Cafetería' }),
);

async function setUp<T>(component: Type<T>, session: Session | null): Promise<ComponentFixture<T>> {
  const offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById', 'categories']);
  offers.findNearby.and.callFake((_origin, _radius, _page, category) =>
    Promise.resolve(pageOf(OFFERS.filter((offer) => !category || offer.category === category))),
  );
  offers.categories.and.resolveTo(CATEGORIES);
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      ...radiusPreferenceTestingProviders(),
      provideRouter([]),
      provideTranslateService(),
      { provide: OfferRepository, useValue: offers },
      { provide: ReservationRepository, useValue: {} },
      { provide: SavedOfferRepository, useValue: {} },
      { provide: SessionStorage, useValue: { read: () => session, write: () => undefined, clear: () => undefined } },
      {
        provide: LocationProvider,
        useValue: { locate: () => Promise.resolve({ status: 'GRANTED', point: { latitude: -12.12, longitude: -77.03 }, accuracyMeters: 12 }) },
      },
      { provide: DistrictDirectory, useValue: { all: () => [] } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('HomePage', () => {
  it('greets the consumer and shows the three nearest offers and six cards (Figma 1)', async () => {
    const fixture = await setUp(HomePage, CONSUMER);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('home.greeting');
    expect(host.querySelectorAll('.near-item').length).toBe(3);
    // Each line is an offer with its business, so one business with two offers is not repeated blindly.
    expect(host.querySelector('.near-item .near-name')?.textContent).toContain(OFFERS[0].title);
    expect(host.querySelector('.near-item .near-meta')?.textContent).toContain('Comercio 1');
    expect(host.querySelectorAll('geo-offer-card').length).toBe(6);
    expect(host.querySelector('geo-offers-map')).not.toBeNull();
  });

  it('invites a visitor to log in and leaves the category filter to Ofertas and Categorías', async () => {
    const fixture = await setUp(HomePage, null);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('home.logInToReserve');
    expect(host.querySelectorAll('button.chip').length).toBe(0);
    expect(TestBed.inject(OfferRepository).findNearby).toHaveBeenCalledWith(jasmine.anything(), 10, 0, null, null);
  });

  it('shows the same offers as a list when the map does not load (US09, QAS12)', async () => {
    const fixture = await setUp(HomePage, CONSUMER);
    const host = fixture.nativeElement as HTMLElement;

    fixture.debugElement.query(By.directive(GeoOffersMap)).componentInstance.failed.emit();
    fixture.detectChanges();

    expect(host.querySelector('geo-offers-map')).toBeNull();
    expect(host.querySelector('[data-testid="map-fallback"]')?.textContent).toContain('search.mapFailed.title');
    expect(host.querySelector('[data-testid="map-fallback"] [role="status"]')).not.toBeNull();
    expect(host.querySelectorAll('.near-item').length).toBe(7);
  });
});

describe('CategoriesPage', () => {
  it('shows one tile per category with its offers in the radius, the ones with offers first (US08)', async () => {
    const fixture = await setUp(CategoriesPage, CONSUMER);
    const host = fixture.nativeElement as HTMLElement;
    const names = [...host.querySelectorAll('.tile .name')].map((n) => n.textContent?.trim());
    const counts = [...host.querySelectorAll('.tile .count')].map((n) => n.textContent?.trim());

    expect(names).toEqual(['categoriesPage.all', 'Gastronomía', 'Cafetería', 'Mascotas']);
    expect(counts).toEqual(['categoriesPage.offersCount', 'categoriesPage.offersCount', 'categoriesPage.offersCount', 'categoriesPage.none']);
    expect(host.querySelector('.tile.empty .name')?.textContent).toContain('Mascotas');
    expect(host.querySelector('geo-offer-card')).toBeNull();
  });

  it('opens Ofertas already filtered by the chosen category', async () => {
    const fixture = await setUp(CategoriesPage, CONSUMER);
    const host = fixture.nativeElement as HTMLElement;
    const tile = [...host.querySelectorAll<HTMLAnchorElement>('a.tile')].find((a) => a.textContent?.includes('Cafetería'))!;

    expect(tile.getAttribute('href')).toBe('/offers?categoria=Cafeter%C3%ADa');
  });
});
