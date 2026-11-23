import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { InboxNotification } from '../../../domain/model/inbox-notification';
import { NotificationInboxRepository } from '../../../domain/ports/notification-inbox.repository';
import { PUSH_RECEIVED_EVENT } from '../../../infrastructure/push-received-event';
import { GeoNotificationBell } from './notification-bell';
import { relativeTime } from './relative-time';

const notice = (over: Partial<InboxNotification>): InboxNotification => ({
  id: 1, type: 'NEARBY_OFFER', title: 'Oferta cerca de ti', message: 'Ceviche a 546 m', offerId: 30073,
  createdAt: new Date().toISOString(), read: false, ...over,
});

describe('GeoNotificationBell', () => {
  let repository: jasmine.SpyObj<NotificationInboxRepository>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('NotificationInboxRepository', ['latest', 'unreadCount', 'markAllRead']);
    repository.unreadCount.and.resolveTo(3);
    repository.latest.and.resolveTo([]);
    repository.markAllRead.and.resolveTo();
    TestBed.configureTestingModule({ providers: [
      provideRouter([]), provideTranslateService(),
      { provide: NotificationInboxRepository, useValue: repository },
    ] });
  });

  async function create(role = 'CONSUMER'): Promise<ComponentFixture<GeoNotificationBell>> {
    const fixture = TestBed.createComponent(GeoNotificationBell);
    fixture.componentRef.setInput('role', role);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    return fixture;
  }
  async function open(fixture: ComponentFixture<GeoNotificationBell>): Promise<void> {
    (fixture.nativeElement.querySelector('button.bell') as HTMLButtonElement).click();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges();
  }
  const panel = () => document.querySelector('.geo-notices-menu') as HTMLElement | null;

  it('shows the unread count in the badge and the aria-label', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.badge')?.textContent?.trim()).toBe('3');
    expect(element.querySelector('button.bell')?.getAttribute('aria-label')).toBeTruthy();
  });

  it('marks the bell itself while there are unread notices, not only with the badge', async () => {
    const unread = await create();
    expect(unread.nativeElement.querySelector('button.bell').classList).toContain('has-unread');
    expect(unread.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('notifications_active');

    repository.unreadCount.and.resolveTo(0);
    const none = await create();
    expect(none.nativeElement.querySelector('button.bell').classList).not.toContain('has-unread');
    expect(none.nativeElement.querySelector('mat-icon').textContent.trim()).toBe('notifications');
  });

  it('hides the badge at 0 and shows 9+ over 9', async () => {
    repository.unreadCount.and.resolveTo(0);
    const none = await create();
    expect(none.nativeElement.querySelector('.badge')).toBeNull();
    repository.unreadCount.and.resolveTo(12);
    const many = await create();
    expect(many.nativeElement.querySelector('.badge')?.textContent?.trim()).toBe('9+');
  });

  it('asks the count again when a foreground push arrives', async () => {
    const fixture = await create();
    repository.unreadCount.and.resolveTo(4);
    window.dispatchEvent(new Event(PUSH_RECEIVED_EVENT));
    await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.badge')?.textContent?.trim()).toBe('4');
  });

  it('on open loads the notices, marks them read and sets the badge to 0', async () => {
    repository.latest.and.resolveTo([notice({ id: 1 }), notice({ id: 2, read: true })]);
    const fixture = await create();
    await open(fixture);
    expect(repository.latest).toHaveBeenCalledWith(20);
    expect(repository.markAllRead).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.badge')).toBeNull();
    expect(panel()?.querySelectorAll('li').length).toBe(2);
    expect(panel()?.querySelectorAll('.dot').length).toBe(1);
    expect(panel()?.textContent).toContain('Oferta cerca de ti');
  });

  it('links an offer notice to its offer', async () => {
    repository.latest.and.resolveTo([notice({})]);
    await open(await create());
    expect(panel()?.querySelector('a.notice')?.getAttribute('href')).toBe('/offers/30073');
  });

  it('links report notices to reservations for the consumer and to reports for the business', async () => {
    repository.latest.and.resolveTo([notice({ type: 'REPORT_RESOLVED', offerId: null })]);
    const consumer = await create('CONSUMER');
    await open(consumer);
    expect(panel()?.querySelector('a.notice')?.getAttribute('href')).toBe('/reservations');
    expect(panel()?.querySelector('a.settings')?.getAttribute('href')).toBe('/preferences');
    consumer.destroy();

    const business = await create('BUSINESS_OWNER');
    await open(business);
    expect(panel()?.querySelector('a.notice')?.getAttribute('href')).toBe('/reports');
    expect(panel()?.querySelector('a.settings')).toBeNull();
  });

  it('shows the empty state', async () => {
    await open(await create());
    expect(panel()?.textContent).toContain('header.noNotices');
  });

  it('shows an error with retry, and does not mark as read until it loads', async () => {
    repository.latest.and.rejectWith(new Error('offline'));
    const fixture = await create();
    await open(fixture);
    expect(panel()?.querySelector('[role=alert]')).not.toBeNull();
    expect(repository.markAllRead).not.toHaveBeenCalled();
    repository.latest.and.resolveTo([notice({})]);
    (panel()?.querySelector('button.retry') as HTMLButtonElement).click();
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(panel()?.querySelectorAll('li').length).toBe(1);
    expect(repository.markAllRead).toHaveBeenCalledTimes(1);
  });
});

describe('relativeTime', () => {
  const now = Date.parse('2026-11-23T15:00:00Z');
  const at = (minutes: number) => new Date(now - minutes * 60000).toISOString();
  it('maps ages to keys', () => {
    expect(relativeTime(at(0), now)).toEqual({ key: 'notificationBell.time.now', count: 0 });
    expect(relativeTime(at(5), now)).toEqual({ key: 'notificationBell.time.minutes', count: 5 });
    expect(relativeTime(at(180), now)).toEqual({ key: 'notificationBell.time.hours', count: 3 });
    expect(relativeTime(at(60 * 30), now)).toEqual({ key: 'notificationBell.time.yesterday', count: 1 });
    expect(relativeTime(at(60 * 24 * 4), now)).toEqual({ key: 'notificationBell.time.days', count: 4 });
  });
});
