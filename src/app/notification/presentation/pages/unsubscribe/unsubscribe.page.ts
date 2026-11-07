import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UnsubscribeEmailUseCase } from '../../../application/preferences.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';
@Component({
  selector: 'app-unsubscribe', imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <main>
      <section class="card">
        <span class="icon" [class.ok]="done()" aria-hidden="true"><mat-icon>{{ done() ? 'check_circle' : 'mail' }}</mat-icon></span>
        <h1>{{ (done() ? 'unsubscribePage.doneTitle' : 'unsubscribePage.title') | translate }}</h1>
        @if (done()) {
          <p role="status">{{ (type() === 'FOLLOWED_BUSINESS_OFFER' ? 'unsubscribePage.doneFollowed' : 'unsubscribePage.done') | translate }}</p>
          <div class="actions">
            <a mat-stroked-button routerLink="/preferences">{{ 'unsubscribePage.reactivate' | translate }}</a>
            <a mat-flat-button routerLink="/inicio">{{ 'unsubscribePage.goHome' | translate }}</a>
          </div>
        } @else {
          <p>{{ 'unsubscribePage.confirmHint' | translate }}</p>
          <div class="actions"><button mat-flat-button type="button" [disabled]="busy() || !token" (click)="confirm()">{{ (busy() ? 'unsubscribePage.busy' : 'unsubscribePage.confirm') | translate }}</button></div>
        }
        @if (error(); as message) { <p role="alert" class="error">{{ message | translate }}</p> }
      </section>
    </main>`,
  styles: [`
    main { display: flex; justify-content: center; padding: var(--space-3xl) var(--space-xl); min-height: 60vh; }
    .card { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); width: 100%; max-width: 560px; padding: var(--space-2xl) var(--space-xl); background: var(--neutral-bg); border: 1px solid var(--neutral-line); border-radius: var(--radius-panel); text-align: center; align-self: flex-start; }
    .icon { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; background: var(--brand-mist); color: var(--brand-deep); }
    .icon.ok { background: var(--feedback-verified-bg); color: var(--feedback-verified-ink); }
    .icon mat-icon { width: 28px; height: 28px; font-size: 28px; }
    h1 { margin: 0; font: 600 18px/1.4 var(--font-brand); color: var(--text-primary); }
    p { margin: 0; max-width: 46ch; font: 400 13px/1.5 var(--font-brand); color: var(--text-dim); }
    .error { color: var(--status-expired); }
    .actions { display: flex; gap: var(--space-md); flex-wrap: wrap; justify-content: center; }
    .actions a[mat-stroked-button] { color: var(--brand-deep); }
    .actions button[mat-flat-button]:not(:disabled), .actions a[mat-flat-button] { background-color: var(--brand-action); color: var(--neutral-bg); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsubscribePage {
  private readonly unsubscribe = inject(UnsubscribeEmailUseCase);
  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
  readonly error = signal<string | null>(this.token ? null : 'unsubscribePage.missing');
  readonly busy = signal(false);
  readonly done = signal(false);
  readonly type = signal<string | null>(null);
  async confirm() {
    if (!this.token || this.busy()) return;
    this.busy.set(true); this.error.set(null);
    try { const result = await this.unsubscribe.execute(this.token); this.type.set(result.notificationType); this.done.set(true); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'unsubscribePage.error'); }
    finally { this.busy.set(false); }
  }
}
