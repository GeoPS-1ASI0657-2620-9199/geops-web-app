import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { WebPushUseCase } from '../../../application/web-push.use-case';
import { PushNeedsInstallError, PushDeniedError, PushNotSupportedError, PushUnavailableError } from '../../../domain/model/push-errors';
import { ApiError } from '../../../../shared/domain/api-error';
@Component({
  selector: 'app-push-controls', imports: [MatButtonModule, TranslateModule],
  // Lives inside the "Avisos en el navegador" row: the browser permission is the second step of
  // that same switch, so the button only shows once the switch is on and this browser is not registered.
  template: `@if (active() || requested() || error() || needsInstall()) { <section>
    @if (active()) { <p role="status">{{ 'pushPage.active' | translate }}</p><button mat-stroked-button type="button" [disabled]="busy()" (click)="disable()">{{ 'pushPage.disable' | translate }}</button> }
    @else if (requested()) { <button mat-stroked-button type="button" [disabled]="busy()" (click)="enable()">{{ (busy() ? 'pushPage.busy' : 'pushPage.enable') | translate }}</button> }
    @if (error(); as message) { <p role="alert">{{ message | translate }}</p> }
    @if (needsInstall()) { <button mat-stroked-button type="button" (click)="emailRequested.emit()">{{ 'pushPage.useEmail' | translate }}</button> }
  </section> }`,
  styles: [`:host { display: block; } section { display: grid; gap: var(--space-sm); } p { color: var(--text-dim); font: 400 12px/1.4 var(--font-brand); margin: 0; } button { justify-self: start; white-space: normal; height: auto; min-height: 40px; padding-block: var(--space-sm); text-align: start; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PushControls {
  private readonly push = inject(WebPushUseCase);
  /** The "Avisos en el navegador" switch is on: this browser still has to grant the permission. */
  readonly requested = input(false);
  readonly enabled = output<void>();
  readonly emailRequested = output<void>();
  readonly active = signal(this.push.isActive());
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly needsInstall = signal(false);
  async enable() {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(null); this.needsInstall.set(false);
    try { await this.push.enable(); this.active.set(true); this.enabled.emit(); }
    catch (error) {
      this.needsInstall.set(error instanceof PushNeedsInstallError);
      this.error.set(error instanceof ApiError ? error.message : error instanceof PushNeedsInstallError || error instanceof PushDeniedError || error instanceof PushNotSupportedError || error instanceof PushUnavailableError ? error.message : 'pushPage.error');
    } finally { this.busy.set(false); }
  }
  async disable() {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(null);
    try { await this.push.disable(); this.active.set(false); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'pushPage.error'); }
    finally { this.busy.set(false); }
  }
}
