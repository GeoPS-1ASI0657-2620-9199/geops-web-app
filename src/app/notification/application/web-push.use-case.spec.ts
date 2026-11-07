import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../../iam/application/session.store';
import { PushProvider, PushSubscriptionStorage, PushSubscriptionsRepository } from '../domain/ports/push.provider';
import { WebPushUseCase } from './web-push.use-case';
describe('WebPushUseCase', () => {
  it('registers the granted token and removes only this browser subscription', async () => {
    const provider = jasmine.createSpyObj('PushProvider', ['enable', 'disable']); provider.enable.and.resolveTo('browser-token'); provider.disable.and.resolveTo();
    const repository = jasmine.createSpyObj('PushSubscriptionsRepository', ['register', 'remove']); repository.register.and.resolveTo({ subscriptionId: 12, createdAt: '' }); repository.remove.and.resolveTo();
    let id: number | null = null;
    TestBed.configureTestingModule({ providers: [{ provide: SessionStore, useValue: { activeSession: () => ({ role: 'CONSUMER', userId: 2001 }) } }, { provide: PushProvider, useValue: provider }, { provide: PushSubscriptionsRepository, useValue: repository }, { provide: PushSubscriptionStorage, useValue: { read: () => id, write: (_: number, value: number) => id = value, clear: () => id = null } }] });
    const useCase = TestBed.inject(WebPushUseCase);
    await useCase.enable(); expect(repository.register).toHaveBeenCalledWith('browser-token'); expect(useCase.isActive()).toBeTrue();
    await useCase.disable(); expect(repository.remove).toHaveBeenCalledWith(12); expect(provider.disable).toHaveBeenCalled(); expect(useCase.isActive()).toBeFalse();
  });
});
