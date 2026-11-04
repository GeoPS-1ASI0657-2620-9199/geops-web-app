import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { NonComplianceReport } from '../../../domain/model/noncompliance-report';
import { ReportRepository } from '../../../domain/ports/report.repository';
import { ReportForm } from './report-form';

const REASON = 'No me aplicaron el 2x1 y me cobraron los dos.';
const REPORT: NonComplianceReport = {
  reportId: 7,
  reservationId: 15,
  reservationCode: 'K7P3XM9Q',
  offerTitle: 'Menú ejecutivo a mitad de precio',
  reason: REASON,
  status: 'OPEN',
  openedAt: '2026-10-28T19:10:00Z',
  responseDeadline: '2026-10-30T19:10:00Z',
  response: null,
  resolution: null,
  resolvedAt: null,
};

describe('ReportForm', () => {
  let fixture: ComponentFixture<ReportForm>;
  let reports: jasmine.SpyObj<ReportRepository>;

  const type = async (text: string) => {
    const area = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    area.value = text;
    area.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const send = () => fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

  beforeEach(async () => {
    reports = jasmine.createSpyObj<ReportRepository>('ReportRepository', [
      'open',
      'list',
      'get',
      'answer',
      'resolveInFavorOfConsumer',
    ]);
    await TestBed.configureTestingModule({
      imports: [ReportForm],
      providers: [provideTranslateService(), { provide: ReportRepository, useValue: reports }],
    }).compileComponents();
    fixture = TestBed.createComponent(ReportForm);
    fixture.componentRef.setInput('reservationId', 15);
    fixture.detectChanges();
  });

  it('keeps the button disabled while the reason is shorter than ten characters', async () => {
    await type('corto');

    expect(send().disabled).toBeTrue();
  });

  it('sends the reason and tells the page which report was opened', async () => {
    reports.open.and.resolveTo(REPORT);
    const reported: NonComplianceReport[] = [];
    fixture.componentInstance.reported.subscribe((report) => reported.push(report));
    await type(REASON);

    expect(send().disabled).toBeFalse();
    send().click();
    await fixture.whenStable();

    expect(reports.open).toHaveBeenCalledWith(15, REASON);
    expect(reported).toEqual([REPORT]);
  });

  it('shows the error of the API and lets the consumer try again', async () => {
    reports.open.and.rejectWith(new ApiError('REPORT_ALREADY_EXISTS', 'Ya reportaste esta reserva'));
    await type(REASON);

    send().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ya reportaste esta reserva');
    expect(send().disabled).toBeFalse();
  });
});
