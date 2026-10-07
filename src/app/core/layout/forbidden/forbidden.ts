import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../iam/application/session.store';
import { HOME_BY_ROLE } from '../../../iam/domain/model/home-by-role';
import { GeoEmptyState } from '../../../shared/ui/geo-empty-state/geo-empty-state';

/** Page for a session that asks for a section of another role (Figma screen 41). */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, MatButtonModule, TranslateModule, GeoEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <geo-empty-state
        icon="lock"
        [title]="'forbiddenPage.title' | translate"
        [description]="'forbiddenPage.description' | translate">
        <a mat-flat-button [routerLink]="home()">{{ 'forbiddenPage.back' | translate }}</a>
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
export class Forbidden {
  private readonly sessions = inject(SessionStore);
  protected readonly home = computed(() => {
    const role = this.sessions.role();
    return role ? HOME_BY_ROLE[role] : '/login';
  });
}
