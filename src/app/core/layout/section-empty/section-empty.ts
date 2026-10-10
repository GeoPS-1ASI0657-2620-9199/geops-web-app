import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { GeoEmptyState } from '../../../shared/ui/geo-empty-state/geo-empty-state';

/** Route data of a tab that has nothing to list yet. */
export interface SectionEmptyData {
  /** i18n prefix with title, emptyTitle, emptyDescription and action. */
  readonly i18n: string;
  readonly icon: string;
  readonly actionRoute: string;
}

/**
 * Tab of the Figma navigation whose list is still empty for the business, such as "Reportes" (screen
 * 36) or "Comentarios" (screen 13): the title of the screen and its empty state.
 */
@Component({
  selector: 'app-section-empty',
  standalone: true,
  imports: [RouterLink, MatButtonModule, TranslateModule, GeoEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <h1 class="title">{{ data.i18n + '.title' | translate }}</h1>
      <geo-empty-state
        [icon]="data.icon"
        [title]="data.i18n + '.emptyTitle' | translate"
        [description]="data.i18n + '.emptyDescription' | translate">
        <a mat-stroked-button [routerLink]="data.actionRoute">{{ data.i18n + '.action' | translate }}</a>
      </geo-empty-state>
    </section>
  `,
  styles: [
    `
      .page { display: flex; flex-direction: column; gap: 18px; padding: 24px 26px 40px; }
      .title { margin: 0; font: 600 22px/1.25 var(--font-brand); }
    `,
  ],
})
export class SectionEmpty {
  protected readonly data = inject(ActivatedRoute).snapshot.data as SectionEmptyData;
}
