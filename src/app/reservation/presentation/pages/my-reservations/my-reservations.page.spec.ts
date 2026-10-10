import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { Reservation } from '../../../domain/model/reservation';
import { ReservationRepository } from '../../../domain/ports/reservation.repository';
import { MyReservationsPage } from './my-reservations.page';

const ACTIVE: Reservation = {
  reservationId: 15,
  code: 'K7P3XM9Q',
  consumerId: 2001,
  offerId: 1052,
  businessId: 301,
  offerTitle: 'Menú ejecutivo a mitad de precio',
  status: 'ACTIVE',
  reservedAt: '2026-10-08T13:05:00Z',
  expiresAt: '2026-10-15T04:59:59Z',
  redeemedAt: null,
};
const REDEEMED: Reservation = {
  ...ACTIVE,
  reservationId: 16,
  code: 'R4T8WN2D',
  offerId: 1053,
  offerTitle: 'Desayuno 2x1',
  status: 'REDEEMED',
  redeemedAt: '2026-10-09T14:20:00Z',
};

describe('MyReservationsPage', () => {
  let fixture: ComponentFixture<MyReservationsPage>;
  let reservations: jasmine.SpyObj<ReservationRepository>;

  const render = async () => {
    await TestBed.configureTestingModule({
      imports: [MyReservationsPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ReservationRepository, useValue: reservations },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MyReservationsPage);
    return settle();
  };
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const chip = (label: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.chip')).find(
      (button) => button.textContent?.includes(label),
    )!;

  beforeEach(() => {
    reservations = jasmine.createSpyObj<ReservationRepository>('ReservationRepository', [
      'reserve',
      'findById',
      'findMine',
    ]);
  });

  it('opens on the active coupons, each with its code and status (Figma 4)', async () => {
    reservations.findMine.and.resolveTo([ACTIVE, REDEEMED]);

    const page = await render();

    expect(reservations.findMine).toHaveBeenCalledWith('ACTIVE');
    expect(page.querySelectorAll('.card').length).toBe(2);
    expect(page.textContent).toContain('K7P3XM9Q');
    expect(page.textContent).toContain('Desayuno 2x1');
    expect(page.querySelectorAll('.code.void').length).toBe(1);
  });

  it('offers Activos, Canjeados and Vencidos first, then the reported ones and all', async () => {
    reservations.findMine.and.resolveTo([ACTIVE]);

    const page = await render();

    const labels = Array.from(page.querySelectorAll('.chip')).map((button) => button.textContent?.trim());
    expect(labels).toEqual([
      'reservationsPage.filters.ACTIVE',
      'reservationsPage.filters.REDEEMED',
      'reservationsPage.filters.EXPIRED',
      'reservationsPage.filters.REPORTED',
      'reservationsPage.filters.ALL',
    ]);
  });

  it('asks again with the chosen status', async () => {
    reservations.findMine.and.resolveTo([ACTIVE]);
    await render();

    chip('filters.EXPIRED').click();
    await settle();

    expect(reservations.findMine).toHaveBeenCalledWith('EXPIRED');
    expect(chip('filters.EXPIRED').getAttribute('aria-pressed')).toBe('true');
  });

  it('invites to look for offers when there is no reservation yet', async () => {
    reservations.findMine.and.resolveTo([]);

    expect((await render()).textContent).toContain('reservationsPage.empty.title');
  });

  it('suggests clearing the filter when a status has no reservations', async () => {
    reservations.findMine.and.resolveTo([ACTIVE]);
    await render();
    reservations.findMine.and.resolveTo([]);

    chip('filters.REPORTED').click();
    const page = await settle();

    expect(page.textContent).toContain('reservationsPage.emptyFiltered.title');
  });

  it('shows the error with a retry that loads the list again', async () => {
    reservations.findMine.and.rejectWith(new ApiError(NETWORK_ERROR, 'No se pudo conectar con el servidor.'));
    const page = await render();

    expect(page.textContent).toContain('reservationsPage.error.retry');
    reservations.findMine.and.resolveTo([ACTIVE]);
    await fixture.componentInstance.load();
    fixture.detectChanges();

    expect(page.querySelectorAll('.card').length).toBe(1);
  });
});
