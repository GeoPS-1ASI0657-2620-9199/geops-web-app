import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideTranslateService } from '@ngx-translate/core';
import { SavedOfferRepository } from '../../../../engagement/domain/ports/saved-offer.repository';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { ReservationRepository } from '../../../../reservation/domain/ports/reservation.repository';
import { ApiError } from '../../../../shared/domain/api-error';
import { OfferCardActions } from './offer-card-actions';

const CONSUMER: Session = { accessToken: 't', expiresAt: Date.now() + 60_000, userId: 7, role: 'CONSUMER', email: 'lucia@correo.pe' };

describe('OfferCardActions', () => {
  let fixture: ComponentFixture<OfferCardActions>;
  let reservations: jasmine.SpyObj<ReservationRepository>;
  let saved: jasmine.SpyObj<SavedOfferRepository>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: Router;

  const render = async (session: Session | null) => {
    reservations = jasmine.createSpyObj<ReservationRepository>('ReservationRepository', ['reserve', 'findById', 'findByCode', 'findMine']);
    saved = jasmine.createSpyObj<SavedOfferRepository>('SavedOfferRepository', ['findMine', 'save', 'remove']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    await TestBed.configureTestingModule({
      imports: [OfferCardActions],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ReservationRepository, useValue: reservations },
        { provide: SavedOfferRepository, useValue: saved },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: SessionStorage, useValue: { read: () => session, write: () => undefined, clear: () => undefined } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(OfferCardActions);
    fixture.componentRef.setInput('offerId', 1052);
    fixture.detectChanges();
  };
  const click = (index: number) => (fixture.nativeElement as HTMLElement).querySelectorAll('button')[index].dispatchEvent(new Event('click'));

  it('reserves from the card and opens the new reservation (US40)', async () => {
    await render(CONSUMER);
    reservations.reserve.and.resolveTo({ reservationId: 15, code: 'K7P3XM9Q', expiresAt: '2099-01-01T00:00:00Z', isNew: true });

    click(0);
    await fixture.whenStable();

    expect(reservations.reserve).toHaveBeenCalledWith(1052);
    expect(router.navigate).toHaveBeenCalledWith(['/reservations', 15], { queryParams: { placed: 'new' } });
  });

  it('saves the offer and tells the consumer, or explains why it could not (US12)', async () => {
    await render(CONSUMER);
    saved.save.and.resolveTo();
    click(1);
    await fixture.whenStable();
    expect(saved.save).toHaveBeenCalledWith(1052);
    expect(snackBar.open).toHaveBeenCalledWith('offerActions.saved', undefined, jasmine.any(Object));

    saved.save.and.rejectWith(new ApiError('OFFER_NOT_FOUND', 'no'));
    click(1);
    await fixture.whenStable();
    expect(snackBar.open).toHaveBeenCalledWith('offerActions.errors.OFFER_NOT_FOUND', undefined, jasmine.any(Object));
  });

  it('sends a visitor to log in first', async () => {
    await render(null);

    click(0);
    await fixture.whenStable();

    expect(reservations.reserve).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], jasmine.objectContaining({ queryParams: jasmine.any(Object) }));
  });

  it('shows no actions to a business owner', async () => {
    await render({ ...CONSUMER, role: 'BUSINESS_OWNER' });
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('button').length).toBe(0);
  });
});
