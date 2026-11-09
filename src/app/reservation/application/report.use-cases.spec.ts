import { TestBed } from '@angular/core/testing';
import { NonComplianceReport } from '../domain/model/noncompliance-report';
import { ReportRepository } from '../domain/ports/report.repository';
import { AnswerReportUseCase } from './answer-report.use-case';
import { ListReportsUseCase } from './list-reports.use-case';
import { OpenReportUseCase } from './open-report.use-case';
import { ResolveReportUseCase } from './resolve-report.use-case';

const REPORT: NonComplianceReport = {
  reportId: 7,
  reservationId: 15,
  reservationCode: 'K7P3XM9Q',
  offerTitle: 'Menú ejecutivo a mitad de precio',
  reason: 'No me aplicaron el 2x1.',
  status: 'OPEN',
  openedAt: '2026-10-28T19:10:00Z',
  responseDeadline: '2026-10-30T19:10:00Z',
  response: null,
  resolution: null,
  resolvedAt: null,
};

describe('Report use cases', () => {
  let reports: jasmine.SpyObj<ReportRepository>;

  beforeEach(() => {
    reports = jasmine.createSpyObj<ReportRepository>('ReportRepository', [
      'open',
      'list',
      'get',
      'answer',
      'resolveInFavorOfConsumer',
    ]);
    TestBed.configureTestingModule({ providers: [{ provide: ReportRepository, useValue: reports }] });
  });

  describe('OpenReportUseCase', () => {
    it('sends the trimmed reason', async () => {
      reports.open.and.resolveTo(REPORT);

      await TestBed.inject(OpenReportUseCase).execute(15, '  No me aplicaron el 2x1.  ');

      expect(reports.open).toHaveBeenCalledWith(15, 'No me aplicaron el 2x1.');
    });

    it('rejects a reason shorter than ten characters without calling the API', async () => {
      await expectAsync(TestBed.inject(OpenReportUseCase).execute(15, 'corto')).toBeRejected();

      expect(reports.open).not.toHaveBeenCalled();
    });

    it('rejects a reason over five hundred characters', async () => {
      await expectAsync(TestBed.inject(OpenReportUseCase).execute(15, 'a'.repeat(501))).toBeRejected();

      expect(reports.open).not.toHaveBeenCalled();
    });
  });

  describe('AnswerReportUseCase', () => {
    it('sends the answer of the business', async () => {
      reports.answer.and.resolveTo({ ...REPORT, status: 'IN_REVIEW' });

      await TestBed.inject(AnswerReportUseCase).execute(7, 'El 2x1 aplicaba de lunes a jueves.');

      expect(reports.answer).toHaveBeenCalledWith(7, 'El 2x1 aplicaba de lunes a jueves.');
    });

    it('rejects an answer shorter than ten characters', async () => {
      await expectAsync(TestBed.inject(AnswerReportUseCase).execute(7, 'no')).toBeRejected();

      expect(reports.answer).not.toHaveBeenCalled();
    });
  });

  describe('ListReportsUseCase', () => {
    it('lists the reports of the business', async () => {
      reports.list.and.resolveTo([REPORT]);

      expect(await TestBed.inject(ListReportsUseCase).execute(null)).toEqual([REPORT]);
    });
  });

  describe('ResolveReportUseCase', () => {
    it('resolves in favor of the consumer', async () => {
      reports.resolveInFavorOfConsumer.and.resolveTo({ ...REPORT, status: 'CLOSED', resolution: 'CONSUMER_FAVOR' });

      const closed = await TestBed.inject(ResolveReportUseCase).execute(7);

      expect(closed.resolution).toBe('CONSUMER_FAVOR');
    });
  });
});
