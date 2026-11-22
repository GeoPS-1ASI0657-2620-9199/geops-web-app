import { WebPushUseCase } from '../../../application/web-push.use-case';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { NotificationRepository } from '../../../domain/ports/notification.repository';
import { PreferencesPage } from './preferences.page';
import { PUSH_ENVIRONMENT, PushEnvironment } from '../../../infrastructure/browser-push-environment';
describe('PreferencesPage', () => {
  let repository: jasmine.SpyObj<NotificationRepository>;
  let browser: { needsInstall: boolean; permission: ReturnType<PushEnvironment['permission']> };
  beforeEach(() => { browser = { needsInstall: false, permission: 'default' }; repository = jasmine.createSpyObj('NotificationRepository', ['preferences', 'update']); repository.preferences.and.resolveTo({ pushEnabled: false, emailEnabled: true, dailyLimit: 2 }); TestBed.configureTestingModule({ providers: [{ provide: WebPushUseCase, useValue: { isActive: () => false, enable: () => Promise.resolve(), disable: () => Promise.resolve() } }, provideTranslateService(), { provide: NotificationRepository, useValue: repository }, { provide: PUSH_ENVIRONMENT, useValue: { needsInstall: () => browser.needsInstall, permission: () => browser.permission } satisfies PushEnvironment }] }); });
  const renderLoaded = async () => { const fixture = TestBed.createComponent(PreferencesPage); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); return fixture; };
  it('hides the iPhone install notice on a browser that does not need it', async () => {
    const host = (await renderLoaded()).nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="iphone-notice"]')).toBeNull();
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });
  it('shows the iPhone install notice on iOS Safari without announcing it as an alert', async () => {
    browser.needsInstall = true;
    const host = (await renderLoaded()).nativeElement as HTMLElement;
    const notice = host.querySelector('[data-testid="iphone-notice"]');
    expect(notice?.textContent).toContain('notificationPage.iphoneTitle');
    expect(notice?.querySelector('[role="alert"]')).toBeNull();
  });
  it('says the browser permission is missing while the switch is on and the browser has not granted it', async () => {
    repository.preferences.and.resolveTo({ pushEnabled: true, emailEnabled: true, dailyLimit: 2 });
    const host = (await renderLoaded()).nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="permission-missing"]')?.textContent).toContain('notificationPage.permissionMissing');
  });
  it('does not say the permission is missing once the browser granted it', async () => {
    repository.preferences.and.resolveTo({ pushEnabled: true, emailEnabled: true, dailyLimit: 2 });
    browser.permission = 'granted';
    const host = (await renderLoaded()).nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="permission-missing"]')).toBeNull();
  });
  it('keeps the save button under the form, not in the side column', async () => {
    const host = (await renderLoaded()).nativeElement as HTMLElement;
    const save = host.querySelector('button[type="submit"]');
    expect(save?.closest('.main')).not.toBeNull();
    expect(save?.closest('.side')).toBeNull();
  });
  it('reads and saves the selected channels and limit', async () => {
    const fixture = TestBed.createComponent(PreferencesPage); fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ pushEnabled: false, emailEnabled: true, dailyLimit: 2 });
    fixture.componentInstance.form.controls.dailyLimit.setValue(4);
    repository.update.and.resolveTo({ pushEnabled: false, emailEnabled: true, dailyLimit: 4 });
    await fixture.componentInstance.save(); fixture.detectChanges();
    expect(repository.update).toHaveBeenCalledWith({ pushEnabled: false, emailEnabled: true, dailyLimit: 4 });
    expect(fixture.nativeElement.textContent).toContain('notificationPage.saved');
  });
  it('asks for the browser permission inside the push row only once its switch is on', async () => {
    const fixture = TestBed.createComponent(PreferencesPage); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).not.toContain('pushPage.enable');
    host.querySelector<HTMLButtonElement>('mat-slide-toggle button')!.click(); fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.pushEnabled.value).toBeTrue();
    const button = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('pushPage.enable'));
    expect(button?.closest('.row')?.textContent).toContain('notificationPage.push');
  });
  it('rejects a limit outside 1 to 10 and keeps edits after an error', async () => {
    const fixture = TestBed.createComponent(PreferencesPage); fixture.detectChanges(); await fixture.whenStable();
    fixture.componentInstance.form.controls.dailyLimit.setValue(11); await fixture.componentInstance.save(); expect(repository.update).not.toHaveBeenCalled();
    fixture.componentInstance.form.controls.dailyLimit.setValue(5); repository.update.and.rejectWith(new Error('offline')); await fixture.componentInstance.save();
    expect(fixture.componentInstance.form.controls.dailyLimit.value).toBe(5); expect(fixture.componentInstance.error()).not.toBeNull();
  });
});
