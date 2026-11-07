import { WebPushUseCase } from '../../../application/web-push.use-case';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { NotificationRepository } from '../../../domain/ports/notification.repository';
import { PreferencesPage } from './preferences.page';
describe('PreferencesPage', () => {
  let repository: jasmine.SpyObj<NotificationRepository>;
  beforeEach(() => { repository = jasmine.createSpyObj('NotificationRepository', ['preferences', 'update']); repository.preferences.and.resolveTo({ pushEnabled: false, emailEnabled: true, dailyLimit: 2 }); TestBed.configureTestingModule({ providers: [{ provide: WebPushUseCase, useValue: { isActive: () => false, enable: () => Promise.resolve(), disable: () => Promise.resolve() } }, provideTranslateService(), { provide: NotificationRepository, useValue: repository }] }); });
  it('reads and saves the selected channels and limit', async () => {
    const fixture = TestBed.createComponent(PreferencesPage); fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ pushEnabled: false, emailEnabled: true, dailyLimit: 2 });
    fixture.componentInstance.form.controls.dailyLimit.setValue(4);
    repository.update.and.resolveTo({ pushEnabled: false, emailEnabled: true, dailyLimit: 4 });
    await fixture.componentInstance.save(); fixture.detectChanges();
    expect(repository.update).toHaveBeenCalledWith({ pushEnabled: false, emailEnabled: true, dailyLimit: 4 });
    expect(fixture.nativeElement.textContent).toContain('notificationPage.saved');
  });
  it('rejects a limit outside 1 to 10 and keeps edits after an error', async () => {
    const fixture = TestBed.createComponent(PreferencesPage); fixture.detectChanges(); await fixture.whenStable();
    fixture.componentInstance.form.controls.dailyLimit.setValue(11); await fixture.componentInstance.save(); expect(repository.update).not.toHaveBeenCalled();
    fixture.componentInstance.form.controls.dailyLimit.setValue(5); repository.update.and.rejectWith(new Error('offline')); await fixture.componentInstance.save();
    expect(fixture.componentInstance.form.controls.dailyLimit.value).toBe(5); expect(fixture.componentInstance.error()).not.toBeNull();
  });
});
