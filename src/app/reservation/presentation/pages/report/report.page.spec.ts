import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { Reservation } from '../../../domain/model/reservation';
import { ReportRepository } from '../../../domain/ports/report.repository';
import { ReservationRepository } from '../../../domain/ports/reservation.repository';
import { ReportPage } from './report.page';

const RESERVATION: Reservation = {
  reservationId: 15,
  code: 'K7P3XM9Q',
  consumerId: 4,
  offerId: 1052,
  businessId: 8,
  offerTitle: '2x1 en almuerzos ejecutivos',
  status: 'ACTIVE',
  reservedAt: '2026-10-14T15:00:00Z',
  expiresAt: '2026-10-15T04:59:59Z',
  redeemedAt: null,
};

describe('ReportPage (US42, Figma screen 5)', () => {
  let fixture: ComponentFixture<ReportPage>;
  let reservations: jasmine.SpyObj<ReservationRepository>;
  let reports: jasmine.SpyObj<ReportRepository>;
  let navigate: jasmine.Spy;

  const render = async (reservation: Reservation = RESERVATION) => {
    reservations.findById.and.resolveTo(reservation);
    await TestBed.configureTestingModule({
      imports: [ReportPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ReservationRepository, useValue: reservations },
        { provide: ReportRepository, useValue: reports },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '15' }) } } },
      ],
    }).compileComponents();
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ReportPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const sendButton = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button.send')!;
  const radios = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="radio"]'));
  const type = async (value: string) => {
    const area = (fixture.nativeElement as HTMLElement).querySelector<HTMLTextAreaElement>('textarea')!;
    area.value = value;
    area.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    reservations = jasmine.createSpyObj<ReservationRepository>('ReservationRepository', ['reserve', 'findById', 'findMine']);
    reports = jasmine.createSpyObj<ReportRepository>('ReportRepository', ['open', 'list', 'get', 'answer', 'resolveInFavorOfConsumer']);
  });

  it('shows the four reasons and the summary of the reservation', async () => {
    const page = await render();

    expect(radios().length).toBe(4);
    expect(page.textContent).toContain('2x1 en almuerzos ejecutivos');
    expect(page.textContent).toContain('K7P3XM9Q');
    expect(sendButton().disabled).toBeFalse();
  });

  it('sends the chosen reason with what the consumer adds and returns to the reservation', async () => {
    reports.open.and.resolveTo({} as never);
    await render();
    await type('Llegué a las 3:40 p. m.');

    sendButton().click();
    await fixture.whenStable();

    expect(reports.open).toHaveBeenCalledOnceWith(15, 'reportPage.reasons.expired.title. Llegué a las 3:40 p. m.');
    expect(navigate).toHaveBeenCalledWith(['/reservations', 15]);
  });

  it('asks for the detail when the reason is "other" and accepts it once it is long enough', async () => {
    await render();
    radios()[3].click();
    radios()[3].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(sendButton().disabled).toBeTrue();

    await type('El local no atendió');
    expect(sendButton().disabled).toBeFalse();
  });

  it('shows the message of the service when the report is rejected', async () => {
    reports.open.and.rejectWith(new ApiError('REPORT_ALREADY_EXISTS', 'Esta reserva ya tiene un reporte.'));
    const page = await render();

    sendButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(page.textContent).toContain('Esta reserva ya tiene un reporte.');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not offer the report when the reservation is not active', async () => {
    const page = await render({ ...RESERVATION, status: 'REDEEMED', redeemedAt: '2026-10-14T16:00:00Z' });

    expect(radios().length).toBe(0);
    expect(page.textContent).toContain('reportPage.unavailable.title');
  });
});
