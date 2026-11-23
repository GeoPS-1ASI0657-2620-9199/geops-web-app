import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { NotificationInboxRepository } from '../domain/ports/notification-inbox.repository';
import { HttpNotificationInboxRepository } from './http-notification-inbox.repository';

describe('HttpNotificationInboxRepository', () => {
  let repository: NotificationInboxRepository;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: '/api/v1' },
      { provide: NotificationInboxRepository, useClass: HttpNotificationInboxRepository },
    ] });
    repository = TestBed.inject(NotificationInboxRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lists the latest notices with the size', async () => {
    const result = repository.latest(20);
    const request = http.expectOne(r => r.url === '/api/v1/notifications');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('size')).toBe('20');
    request.flush([{ id: 14, type: 'NEARBY_OFFER', title: 't', message: 'm', offerId: 30073, createdAt: '2026-11-23T14:03:17Z', read: false }]);
    expect((await result)[0].offerId).toBe(30073);
  });
  it('reads the unread count', async () => {
    const result = repository.unreadCount();
    http.expectOne('/api/v1/notifications/unread-count').flush({ unread: 3 });
    expect(await result).toBe(3);
  });
  it('marks all as read with a POST', async () => {
    const result = repository.markAllRead();
    const request = http.expectOne('/api/v1/notifications/read');
    expect(request.request.method).toBe('POST');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await result;
  });
  it('maps failures to an ApiError', async () => {
    const result = repository.unreadCount();
    http.expectOne('/api/v1/notifications/unread-count').flush({ message: 'x' }, { status: 500, statusText: 'Server Error' });
    await expectAsync(result).toBeRejected();
  });
});
