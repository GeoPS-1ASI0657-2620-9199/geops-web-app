import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { NotificationRepository } from '../../../domain/ports/notification.repository';
import { UnsubscribePage } from './unsubscribe.page';
describe('UnsubscribePage', () => {
  it('requires confirmation before posting the signed token without a session', async () => {
    const repository = jasmine.createSpyObj('NotificationRepository', ['unsubscribe']); repository.unsubscribe.and.resolveTo({ notificationType: 'NEARBY_OFFER', unsubscribedAt: '2026-10-29T08:00:00Z' });
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService(), { provide: NotificationRepository, useValue: repository }, { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'signed' }) } } }] });
    const fixture = TestBed.createComponent(UnsubscribePage); fixture.detectChanges(); expect(repository.unsubscribe).not.toHaveBeenCalled();
    await fixture.componentInstance.confirm(); fixture.detectChanges();
    expect(repository.unsubscribe).toHaveBeenCalledWith('signed'); expect(fixture.nativeElement.textContent).toContain('unsubscribePage.done');
  });
});
