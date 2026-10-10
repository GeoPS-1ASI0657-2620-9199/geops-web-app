import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { SavedOfferRepository } from '../../../../engagement/domain/ports/saved-offer.repository';
import { ReservationRepository } from '../../../../reservation/domain/ports/reservation.repository';
import { nearbyOffer, pageOf } from '../../../testing/nearby-offer.testing';
import { DistrictDirectory } from '../../../domain/ports/district.directory';
import { LocationProvider } from '../../../domain/ports/location.provider';
import { OfferRepository } from '../../../domain/ports/offer.repository';
import { NearbyOffersPage } from './nearby-offers.page';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';

const CEVICHE = nearbyOffer({ offerId: 1, title: 'Ceviche clásico', businessName: 'Cevichería Mar', category: 'Gastronomía' });
const CORTE = nearbyOffer({ offerId: 2, title: 'Corte clásico', businessName: 'Barbería Velarde', category: 'Salud y belleza', imageUrl: null });

describe('NearbyOffersPage', () => {
  let fixture: ComponentFixture<NearbyOffersPage>;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const render = async (q: string | null = null) => {
    const offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById']);
    offers.findNearby.and.resolveTo(pageOf([CEVICHE, CORTE]));
    query = new BehaviorSubject(convertToParamMap(q ? { q } : {}));
    await TestBed.configureTestingModule({
      imports: [NearbyOffersPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ActivatedRoute, useValue: { queryParamMap: query } },
        { provide: OfferRepository, useValue: offers },
        { provide: ReservationRepository, useValue: {} },
        { provide: SavedOfferRepository, useValue: {} },
        {
          provide: LocationProvider,
          useValue: { locate: () => Promise.resolve({ status: 'GRANTED', point: { latitude: -12.12, longitude: -77.03 }, accuracyMeters: 12 }) },
        },
        { provide: DistrictDirectory, useValue: { all: () => [] } },
        { provide: SessionStorage, useValue: { read: () => null, write: () => undefined, clear: () => undefined } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NearbyOffersPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const cards = () => (fixture.nativeElement as HTMLElement).querySelectorAll('geo-offer-card');

  it('shows every offer of the radius as a Figma card with its photo, distance and actions', async () => {
    await render();

    expect(cards().length).toBe(2);
    expect(text()).toContain('Cevichería Mar');
    expect(text()).toContain('350 m · 5 min');
    expect((fixture.nativeElement as HTMLElement).querySelector('img.photo')?.getAttribute('src')).toContain('unsplash');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-offer-card-actions').length).toBe(2);
  });

  it('filters by the text typed in the top bar search, ignoring accents and case', async () => {
    await render('BARBERIA');

    expect(cards().length).toBe(1);
    expect(text()).toContain('Barbería Velarde');
    expect(text()).not.toContain('Cevichería Mar');
  });

  it('filters by the category chip', async () => {
    await render();
    const chip = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button.chip')].find(
      (b) => b.textContent?.trim() === 'Salud y belleza',
    )!;

    chip.click();
    fixture.detectChanges();

    expect(cards().length).toBe(1);
    expect(text()).toContain('Corte clásico');
  });
});
