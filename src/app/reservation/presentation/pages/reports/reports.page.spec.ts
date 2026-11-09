import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { NonComplianceReport } from '../../../domain/model/noncompliance-report';
import { ReportRepository } from '../../../domain/ports/report.repository';
import { ReportsPage, timeToAnswer } from './reports.page';

const ANSWER = 'El 2x1 aplicaba de lunes a jueves.';
const OPEN: NonComplianceReport = {
  reportId: 7,
  reservationId: 15,
  reservationCode: 'K7P3XM9Q',
  offerTitle: 'Menú ejecutivo a mitad de precio',
  reason: 'No me aplicaron el 2x1.',
  status: 'OPEN',
  openedAt: '2026-10-28T19:10:00Z',
  responseDeadline: '2099-01-01T00:00:00Z',
  response: null,
  resolution: null,
  resolvedAt: null,
};
const CLOSED: NonComplianceReport = {
  ...OPEN,
  reportId: 8,
  status: 'CLOSED',
  resolution: 'CONSUMER_FAVOR',
  resolvedAt: '2026-10-29T12:00:00Z',
};

describe('timeToAnswer', () => {
  const now = Date.parse('2026-10-29T12:00:00Z');

  it('counts hours while more than an hour is left', () => {
    expect(timeToAnswer('2026-10-30T19:10:00Z', now)).toBe('31 h');
  });

  it('counts minutes in the last hour', () => {
    expect(timeToAnswer('2026-10-29T12:45:00Z', now)).toBe('45 min');
  });

  it('is null once the deadline passed', () => {
    expect(timeToAnswer('2026-10-29T11:00:00Z', now)).toBeNull();
  });
});

describe('ReportsPage', () => {
  let fixture: ComponentFixture<ReportsPage>;
  let reports: jasmine.SpyObj<ReportRepository>;

  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const render = async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPage],
      providers: [provideTranslateService(), { provide: ReportRepository, useValue: reports }],
    }).compileComponents();
    fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    await settle();
    return fixture.nativeElement as HTMLElement;
  };
  const write = async (page: HTMLElement, text: string) => {
    const area = page.querySelector('textarea') as HTMLTextAreaElement;
    area.value = text;
    area.dispatchEvent(new Event('input'));
    await settle();
  };
  const click = (page: HTMLElement, testId: string) =>
    (page.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement).click();

  beforeEach(() => {
    reports = jasmine.createSpyObj<ReportRepository>('ReportRepository', [
      'open',
      'list',
      'get',
      'answer',
      'resolveInFavorOfConsumer',
    ]);
  });

  it('lists the open reports with the time left and counts every tab', async () => {
    reports.list.and.resolveTo([OPEN, CLOSED]);

    const page = await render();

    expect(page.querySelector('[data-testid="report-7"]')).not.toBeNull();
    expect(page.querySelector('[data-testid="report-8"]')).toBeNull();
    expect(page.querySelector('[data-testid="time-left"]')).not.toBeNull();
    expect(page.querySelector('[data-testid="tab-CLOSED"]')?.textContent).toContain('(1)');
  });

  it('shows the closed reports in their tab', async () => {
    reports.list.and.resolveTo([OPEN, CLOSED]);
    const page = await render();

    click(page, 'tab-CLOSED');
    fixture.detectChanges();

    expect(page.querySelector('[data-testid="report-8"]')).not.toBeNull();
    expect(page.querySelector('[data-testid="closed-note"]')).not.toBeNull();
  });

  it('does not enable the answer until it has ten characters', async () => {
    reports.list.and.resolveTo([OPEN]);
    const page = await render();
    const button = page.querySelector('[data-testid="answer"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();

    await write(page, ANSWER);

    expect(button.disabled).toBeFalse();
  });

  it('sends the answer and moves the report to review', async () => {
    reports.list.and.resolveTo([OPEN]);
    reports.answer.and.resolveTo({
      ...OPEN,
      status: 'IN_REVIEW',
      response: { text: ANSWER, respondedAt: '2026-10-29T12:00:00Z' },
    });
    const page = await render();
    await write(page, ANSWER);

    click(page, 'answer');
    await settle();

    expect(reports.answer).toHaveBeenCalledWith(7, ANSWER);
    expect(page.querySelector('[data-testid="report-7"]')).toBeNull();
    expect(page.querySelector('[data-testid="tab-IN_REVIEW"]')?.textContent).toContain('(1)');
  });

  it('asks for confirmation before resolving in favor of the customer', async () => {
    reports.list.and.resolveTo([OPEN]);
    reports.resolveInFavorOfConsumer.and.resolveTo({ ...OPEN, status: 'CLOSED', resolution: 'CONSUMER_FAVOR' });
    const page = await render();

    click(page, 'resolve');
    fixture.detectChanges();
    expect(reports.resolveInFavorOfConsumer).not.toHaveBeenCalled();

    click(page, 'confirm-resolve');
    await settle();

    expect(reports.resolveInFavorOfConsumer).toHaveBeenCalledWith(7);
    expect(page.querySelector('[data-testid="tab-CLOSED"]')?.textContent).toContain('(1)');
  });

  it('shows the error of the API when the answer fails', async () => {
    reports.list.and.resolveTo([OPEN]);
    reports.answer.and.rejectWith(new ApiError('REPORT_RESPONSE_DEADLINE_PASSED', 'El plazo venció'));
    const page = await render();
    await write(page, 'Llegamos tarde a responder.');

    click(page, 'answer');
    await settle();

    expect(page.textContent).toContain('El plazo venció');
  });

  it('shows the error when the list cannot be loaded', async () => {
    reports.list.and.rejectWith(new ApiError(NETWORK_ERROR, 'sin conexión'));

    const page = await render();

    expect(page.textContent).toContain('sin conexión');
  });
});
