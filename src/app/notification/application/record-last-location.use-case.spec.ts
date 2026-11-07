import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../../iam/application/session.store';
import { NotificationRepository } from '../domain/ports/notification.repository';
import { RecordLastLocationUseCase } from './record-last-location.use-case';
describe('RecordLastLocationUseCase', () => {
  it('throttles successful updates per consumer and retries failed updates', async () => {
    const repository = jasmine.createSpyObj('NotificationRepository', ['recordLocation']); repository.recordLocation.and.resolveTo();
    const sessions = { activeSession: () => ({ role: 'CONSUMER', userId: 2001 }) };
    TestBed.configureTestingModule({ providers: [{ provide: NotificationRepository, useValue: repository }, { provide: SessionStore, useValue: sessions }] });
    const useCase = TestBed.inject(RecordLastLocationUseCase); const location = { latitude: -12.1, longitude: -77, accuracyMeters: 20, capturedAt: '2026-10-27T15:00:00Z' };
    const now = spyOn(Date, 'now').and.returnValue(1000000);
    await useCase.execute(location); await useCase.execute(location); expect(repository.recordLocation).toHaveBeenCalledTimes(1);
    now.and.returnValue(1300000); repository.recordLocation.and.rejectWith(new Error('offline')); await useCase.execute(location);
    repository.recordLocation.and.resolveTo(); await useCase.execute(location); expect(repository.recordLocation).toHaveBeenCalledTimes(3);
  });
  it('does not submit a visitor location', async () => {
    const repository = jasmine.createSpyObj('NotificationRepository', ['recordLocation']);
    TestBed.configureTestingModule({ providers: [{ provide: NotificationRepository, useValue: repository }, { provide: SessionStore, useValue: { activeSession: () => null } }] });
    await TestBed.inject(RecordLastLocationUseCase).execute({ latitude: -12.1, longitude: -77, accuracyMeters: 20, capturedAt: '' }); expect(repository.recordLocation).not.toHaveBeenCalled();
  });
});
