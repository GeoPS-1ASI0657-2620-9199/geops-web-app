import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SavedOfferRepository } from '../../../../engagement/domain/ports/saved-offer.repository';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { ReservationRepository } from '../../../../reservation/domain/ports/reservation.repository';
import { DistrictDirectory } from '../../../domain/ports/district.directory';
import { LocationProvider } from '../../../domain/ports/location.provider';
import { OfferRepository } from '../../../domain/ports/offer.repository';
import { nearbyOffer, pageOf } from '../../../testing/nearby-offer.testing';
import { CategoriesPage } from '../categories/categories.page';
import { HomePage } from './home.page';

const CONSUMER: Session = {
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 7,
  role: 'CONSUMER',
  email: 'lucia.fernandez@correo.pe',
  consumerId: 7,
};
const OFFERS = [1, 2, 3, 4, 5, 6, 7].map((id) =>
  nearbyOffer({ offerId: id, businessName: `Comercio ${id}`, distanceMeters: id * 100, walkMinutes: id, category: id % 2 ? 'Gastronomía' : 'Cafetería' }),
);

async function setUp<T>(component: Type<T>, session: Session | null): Promise<ComponentFixture<T>> {
  const offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById']);
  offers.findNearby.and.resolveTo(pageOf(OFFERS));
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
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
  it('greets the consumer and shows the three nearest businesses and six cards (Figma 1)', async () => {
    const fixture = await setUp(HomePage, CONSUMER);
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('home.greeting');
    expect(host.querySelectorAll('.near-item').length).toBe(3);
    expect(host.querySelector('.near-item')?.textContent).toContain('Comercio 1');
    expect(host.querySelectorAll('geo-offer-card').length).toBe(6);
    expect(host.querySelector('geo-offers-map')).not.toBeNull();
  });

  it('invites a visitor to log in and filters by category', async () => {
    const fixture = await setUp(HomePage, null);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('home.logInToReserve');

    [...host.querySelectorAll<HTMLButtonElement>('button.chip')].find((b) => b.textContent?.trim() === 'Cafetería')!.click();
    fixture.detectChanges();

    expect(host.querySelectorAll('geo-offer-card').length).toBe(3);
  });
});

describe('CategoriesPage', () => {
  it('counts the offers at 5 minutes and in the radius, and lists six ordered by distance (Figma 6)', async () => {
    const fixture = await setUp(CategoriesPage, CONSUMER);
    const host = fixture.nativeElement as HTMLElement;
    const figures = [...host.querySelectorAll('.figure')].map((f) => f.textContent?.trim());

    expect(figures).toEqual(['5', '7', '2']);
    expect(host.querySelectorAll('.item').length).toBe(6);
    expect(host.querySelector('.item-name')?.textContent).toContain('Comercio 1');
    expect(host.textContent).toContain('categoriesPage.seeAll');
  });
});
