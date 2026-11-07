import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { UnsubscribeEmailUseCase } from '../../../application/preferences.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';
@Component({
  selector: 'app-unsubscribe', imports: [RouterLink, MatButtonModule, TranslateModule],
  template: `<main><h1>{{ 'unsubscribePage.title' | translate }}</h1>
    @if (done()) { <p role="status">{{ (type() === 'FOLLOWED_BUSINESS_OFFER' ? 'unsubscribePage.doneFollowed' : 'unsubscribePage.done') | translate }}</p><a mat-stroked-button routerLink="/inicio">{{ 'nav.home' | translate }}</a> }
    @else { <p>{{ 'unsubscribePage.confirmHint' | translate }}</p><button mat-flat-button [disabled]="busy() || !token" (click)="confirm()">{{ (busy() ? 'unsubscribePage.busy' : 'unsubscribePage.confirm') | translate }}</button> }
    @if (error(); as message) { <p role="alert">{{ message | translate }}</p> }
  </main>`,
  styles: [`main { max-width: 680px; margin-inline: auto; padding: var(--space-3xl) var(--space-xl); } h1 { font: 600 24px/1.3 var(--font-brand); } p { color: var(--text-dim); line-height: 1.6; } button[mat-flat-button]:not(:disabled) { background-color: var(--brand-deep); color: var(--neutral-bg); }`],
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
