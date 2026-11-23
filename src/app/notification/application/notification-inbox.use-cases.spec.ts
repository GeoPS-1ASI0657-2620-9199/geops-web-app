import { TestBed } from '@angular/core/testing';
import { NotificationInboxRepository } from '../domain/ports/notification-inbox.repository';
import { CountUnreadNotificationsUseCase, ListMyNotificationsUseCase, MarkNotificationsReadUseCase } from './notification-inbox.use-cases';

describe('notification inbox use cases', () => {
  let repository: jasmine.SpyObj<NotificationInboxRepository>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('NotificationInboxRepository', ['latest', 'unreadCount', 'markAllRead']);
    TestBed.configureTestingModule({ providers: [{ provide: NotificationInboxRepository, useValue: repository }] });
  });

  it('asks for the latest 20 notices', async () => {
    repository.latest.and.resolveTo([]);
    await TestBed.inject(ListMyNotificationsUseCase).execute();
    expect(repository.latest).toHaveBeenCalledWith(20);
  });
  it('returns the unread count', async () => {
    repository.unreadCount.and.resolveTo(3);
    expect(await TestBed.inject(CountUnreadNotificationsUseCase).execute()).toBe(3);
  });
  it('marks every notice as read', async () => {
    repository.markAllRead.and.resolveTo();
    await TestBed.inject(MarkNotificationsReadUseCase).execute();
    expect(repository.markAllRead).toHaveBeenCalled();
  });
});
