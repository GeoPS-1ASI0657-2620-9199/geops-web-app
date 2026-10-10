import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

export interface NavItem {
  /** i18n key of the tab label. */
  label: string;
  route: string;
  /** True when the tab also stays active on the routes under it, e.g. /offers/1052. */
  matchChildren?: boolean;
}

const EXACT: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};
const SUBSET: IsActiveMatchOptions = { ...EXACT, paths: 'subset' };

/** White tab bar under the top bar (Figma "Navegación"): Poppins 14, the active tab in deep purple. */
@Component({
  selector: 'geo-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav" [attr.aria-label]="'nav.label' | translate">
      @for (item of items(); track item.route) {
        <a
          class="tab"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="item.matchChildren ? subset : exact"
          ariaCurrentWhenActive="page">
          {{ item.label | translate }}
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .nav {
        display: flex;
        justify-content: center;
        gap: 44px;
        height: 48px;
        padding: 0 16px;
        overflow-x: auto;
        background: var(--neutral-bg);
        border-bottom: 1px solid var(--neutral-line);
      }
      .tab {
        display: flex;
        align-items: center;
        flex: none;
        font: 500 14px/1.3 var(--font-brand);
        color: var(--text-primary);
        text-decoration: none;
        white-space: nowrap;
      }
      .tab:hover { color: var(--brand-deep); }
      .tab.active { font-weight: 600; color: var(--brand-deep); }
      @media (max-width: 720px) { .nav { justify-content: flex-start; gap: 24px; } }
    `,
  ],
})
export class GeoNav {
  readonly items = input.required<NavItem[]>();
  protected readonly exact = EXACT;
  protected readonly subset = SUBSET;
}
