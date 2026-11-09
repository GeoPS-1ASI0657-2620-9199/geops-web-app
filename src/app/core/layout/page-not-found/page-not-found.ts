import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../iam/application/session.store';
import { HOME_BY_ROLE } from '../../../iam/domain/model/home-by-role';
import { GeoEmptyState } from '../../../shared/ui/geo-empty-state/geo-empty-state';

/** Page for an address that does not exist: it takes the visitor back to the start of their role. */
@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, TranslateModule, GeoEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <geo-empty-state
        icon="search_off"
        [title]="'notFoundPage.title' | translate"
        [description]="'notFoundPage.description' | translate">
        <a mat-flat-button [routerLink]="home()">{{ 'notFoundPage.back' | translate }}</a>
      </geo-empty-state>
    </main>
  `,
  styles: [
    `
      .page { display: flex; justify-content: center; padding: 96px var(--space-lg); }
      geo-empty-state { width: 100%; max-width: 560px; }
    `,
  ],
})
export class PageNotFound {
  private readonly sessions = inject(SessionStore);
  protected readonly home = computed(() => {
    const role = this.sessions.role();
    return role ? HOME_BY_ROLE[role] : '/inicio';
  });
}
