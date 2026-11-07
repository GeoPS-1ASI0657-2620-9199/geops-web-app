import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { WebPushUseCase } from '../../../application/web-push.use-case';
import { PushNeedsInstallError } from '../../../domain/model/push-errors';
import { PushControls } from './push-controls';
describe('PushControls', () => {
  it('explains installation on iPhone and offers email without claiming push is active', async () => {
    const push = jasmine.createSpyObj('WebPushUseCase', ['isActive', 'enable', 'disable']); push.isActive.and.returnValue(false); push.enable.and.rejectWith(new PushNeedsInstallError());
    TestBed.configureTestingModule({ providers: [provideTranslateService(), { provide: WebPushUseCase, useValue: push }] });
    const fixture = TestBed.createComponent(PushControls);
    await fixture.componentInstance.enable(); fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBeFalse(); expect(fixture.nativeElement.textContent).toContain('pushPage.needsInstall');
    expect(fixture.nativeElement.textContent).toContain('pushPage.useEmail');
    const requested = jasmine.createSpy('emailRequested'); fixture.componentInstance.emailRequested.subscribe(requested);
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    buttons.find(button => button.textContent?.includes('pushPage.useEmail'))!.click(); expect(requested).toHaveBeenCalled();
  });
});
