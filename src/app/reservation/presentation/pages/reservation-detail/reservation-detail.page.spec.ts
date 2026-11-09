import { ReviewRepository } from '../../../../engagement/domain/ports/review.repository';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { Reservation } from '../../../domain/model/reservation';
import { ReportRepository } from '../../../domain/ports/report.repository';
import { ReservationRepository } from '../../../domain/ports/reservation.repository';
import { ReservationDetailPage } from './reservation-detail.page';
import { OfferRepository } from '../../../../catalog/domain/ports/offer.repository';

const RESERVATION: Reservation = {
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

describe('ReservationDetailPage', () => {
  let fixture: ComponentFixture<ReservationDetailPage>;
  let reservations: jasmine.SpyObj<ReservationRepository>;
  let offers: jasmine.SpyObj<OfferRepository>;
  let reports: jasmine.SpyObj<ReportRepository>;

  const render = async (id = '15', query: Record<string, string> = {}) => {
    offers = jasmine.createSpyObj<OfferRepository>('OfferRepository', ['findNearby', 'findById']);
    offers.findById.and.rejectWith(new ApiError(NETWORK_ERROR, 'sin conexión'));
    await TestBed.configureTestingModule({
      imports: [ReservationDetailPage],
      providers: [
        provideRouter([]),
        { provide: ReviewRepository, useValue: { findByBusiness: () => Promise.resolve([]), create: () => Promise.resolve({}), reply: () => Promise.resolve() } },
        provideTranslateService(),
        { provide: ReservationRepository, useValue: reservations },
        { provide: OfferRepository, useValue: offers },
        { provide: ReportRepository, useValue: reports },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }), queryParamMap: convertToParamMap(query) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReservationDetailPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    reports = jasmine.createSpyObj<ReportRepository>('ReportRepository', ['open', 'list', 'get', 'answer', 'resolveInFavorOfConsumer']);
    reservations = jasmine.createSpyObj<ReservationRepository>('ReservationRepository', [
      'reserve',
      'findById',
      'findMine',
    ]);
  });

  it('shows the code, the offer and the end of validity in Lima', async () => {
    reservations.findById.and.resolveTo(RESERVATION);

    const page = await render();

    expect(reservations.findById).toHaveBeenCalledWith(15);
    expect(page.querySelector('.code')?.textContent?.trim()).toBe('K7P3XM9Q');
    expect(page.textContent).toContain('Menú ejecutivo a mitad de precio');
    expect(page.textContent).toContain('11:59');
    expect(page.textContent).toContain('reservationPage.howTo.step3.title');
  });

  it('confirms a new reservation when it comes from the offer', async () => {
    reservations.findById.and.resolveTo(RESERVATION);

    const page = await render('15', { placed: 'new' });

    expect(page.textContent).toContain('reservationPage.created.title');
  });

  it('says the reservation already existed when the service answered 200', async () => {
    reservations.findById.and.resolveTo(RESERVATION);

    const page = await render('15', { placed: 'existing' });

    expect(page.textContent).toContain('reservationPage.existing.title');
    expect(page.textContent).not.toContain('reservationPage.created.title');
  });

  it('strikes the code of an expired reservation', async () => {
    reservations.findById.and.resolveTo({ ...RESERVATION, status: 'EXPIRED' });

    const page = await render();

    expect(page.querySelector('.code.void')).not.toBeNull();
    expect(page.textContent).toContain('reservationPage.banner.EXPIRED.title');
  });

  it('treats a reservation of another account as not found', async () => {
    reservations.findById.and.rejectWith(new ApiError('FORBIDDEN', 'Reservation 15 belongs to another account'));

    expect((await render()).textContent).toContain('reservationPage.notFound.title');
  });

  it('offers a retry when the service cannot be reached', async () => {
    reservations.findById.and.rejectWith(new ApiError(NETWORK_ERROR, 'No se pudo conectar con el servidor.'));

    const page = await render();

    expect(page.textContent).toContain('reservationPage.error.retry');
    reservations.findById.and.resolveTo(RESERVATION);
    await fixture.componentInstance.load();
    fixture.detectChanges();
    expect(page.querySelector('.code')?.textContent?.trim()).toBe('K7P3XM9Q');
  });

  it('offers to report an active reservation and hides the button once it was reported', async () => {
    reservations.findById.and.resolveTo(RESERVATION);
    const page = await render();
    expect(page.querySelector('[data-testid="report-button"]')).toBeNull();
  });

  it('shows the response deadline in Lima time when the reservation was reported', async () => {
    reservations.findById.and.resolveTo({
      ...RESERVATION,
      status: 'REPORTED',
      report: { reportId: 7, status: 'OPEN', responseDeadline: '2026-10-30T19:10:00Z' },
    });
    reports.get.and.rejectWith(new ApiError(NETWORK_ERROR, 'sin conexión'));

    const page = await render();

    expect(reports.get).toHaveBeenCalledWith(7);
    expect(page.querySelector('[data-testid="report-deadline"]')).not.toBeNull();
    expect(page.querySelector('[data-testid="report-button"]')).toBeNull();
  });

  it('shows what the business answered', async () => {
    reservations.findById.and.resolveTo({
      ...RESERVATION,
      status: 'REPORTED',
      report: { reportId: 7, status: 'IN_REVIEW', responseDeadline: '2026-10-30T19:10:00Z' },
    });
    reports.get.and.resolveTo({
      reportId: 7,
      reservationId: 15,
      reservationCode: 'K7P3XM9Q',
      offerTitle: 'Menú ejecutivo a mitad de precio',
      reason: 'No me aplicaron el 2x1.',
      status: 'IN_REVIEW',
      openedAt: '2026-10-28T19:10:00Z',
      responseDeadline: '2026-10-30T19:10:00Z',
      response: { text: 'El 2x1 aplicaba de lunes a jueves.', respondedAt: '2026-10-29T12:00:00Z' },
      resolution: null,
      resolvedAt: null,
    });

    const page = await render();

    expect(page.querySelector('[data-testid="report-answer"]')?.textContent).toContain('El 2x1 aplicaba de lunes a jueves.');
    expect(page.querySelector('[data-testid="report-review"]')).not.toBeNull();
  });
});
