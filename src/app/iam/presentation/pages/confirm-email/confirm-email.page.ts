import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoTopBar } from '../../../../core/layout/geo-top-bar/geo-top-bar';
import {
  ConfirmEmailUseCase,
  INVALID_CONFIRMATION_LINK,
  MISSING_CONFIRMATION_TOKEN,
} from '../../../application/confirm-email.use-case';
import { SessionStore } from '../../../application/session.store';
import { HOME_BY_ROLE } from '../../../domain/model/home-by-role';

export type ConfirmEmailState = 'confirming' | 'confirmed' | 'invalid' | 'missing' | 'failed';

/** Landing of the link of the confirmation e-mail (US28): confirms it as soon as it opens. */
@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule, TranslateModule, GeoAlert, GeoEmptyState, GeoTopBar],
  templateUrl: './confirm-email.page.html',
  styleUrl: './confirm-email.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmailPage implements OnInit {
  private readonly confirmEmail = inject(ConfirmEmailUseCase);
  private readonly sessions = inject(SessionStore);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');

  protected readonly state = signal<ConfirmEmailState>('confirming');
  /** Message of the server when it could not be reached or answered something unexpected. */
  protected readonly failure = signal<string | null>(null);
  /** Home of the role in session; null sends the visitor to log in. */
  protected readonly home = computed(() => {
    const session = this.sessions.activeSession();
    return session ? HOME_BY_ROLE[session.role] : null;
  });

  ngOnInit(): void {
    void this.confirm();
  }

  async confirm(): Promise<void> {
    this.state.set('confirming');
    this.failure.set(null);
    try {
      await this.confirmEmail.execute(this.token);
      this.state.set('confirmed');
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      if (apiError?.code === MISSING_CONFIRMATION_TOKEN) {
        this.state.set('missing');
      } else if (apiError?.code === INVALID_CONFIRMATION_LINK) {
        this.state.set('invalid');
      } else {
        this.failure.set(apiError?.message ?? null);
        this.state.set('failed');
      }
    }
  }
}
