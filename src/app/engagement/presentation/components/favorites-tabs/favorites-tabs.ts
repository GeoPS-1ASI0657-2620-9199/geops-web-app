import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

export type FavoritesTab = 'offers' | 'businesses' | 'follows';

/** The chips under "Mis Favoritos" (Figma screens 10 and 29): saved offers, saved businesses and followed businesses. */
@Component({
  selector: 'app-favorites-tabs',
  imports: [RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tabs" [attr.aria-label]="'savedBusinesses.tabs' | translate">
      <a class="chip" routerLink="/favorites" [class.selected]="active() === 'offers'" [attr.aria-current]="active() === 'offers' ? 'page' : null">{{ 'favoritesTabs.offers' | translate }}</a>
      <a class="chip" routerLink="/favorites" [queryParams]="{ tab: 'businesses' }" [class.selected]="active() === 'businesses'" [attr.aria-current]="active() === 'businesses' ? 'page' : null">{{ 'favoritesTabs.businesses' | translate }}</a>
      <a class="chip" routerLink="/follows" [class.selected]="active() === 'follows'" [attr.aria-current]="active() === 'follows' ? 'page' : null">{{ 'favoritesTabs.follows' | translate }}</a>
    </nav>
  `,
  styles: [
    `
      .tabs { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
      .chip { display: inline-flex; align-items: center; height: 28px; padding: 0 var(--space-md); border: 1px solid var(--neutral-line); border-radius: var(--radius-chip); background: var(--neutral-bg); color: var(--text-dim); font: 500 12px/1 var(--font-brand); text-decoration: none; }
      .chip:hover { border-color: var(--brand-action); }
      .chip.selected { background: var(--brand-action); border-color: var(--brand-action); color: var(--neutral-bg); }
      .chip:focus-visible { outline: 2px solid var(--brand-deep); outline-offset: 2px; }
    `,
  ],
})
export class FavoritesTabs {
  readonly active = input.required<FavoritesTab>();
}
