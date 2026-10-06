import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  route: string;
}

/**
 * White tab bar under the top bar (Figma "Navegación"). It only receives the routes that exist
 * in the current sprint, so no tab leads to a missing page.
 */
@Component({
  selector: 'geo-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav" aria-label="Navegación principal">
      @for (item of items(); track item.route) {
        <a
          class="tab"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page">
          {{ item.label }}
        </a>
      }
    </nav>
  `,
  styles: [
    `
      .nav {
        display: flex;
        justify-content: center;
        gap: var(--space-2xl);
        height: 48px;
        background: var(--neutral-bg);
        border-bottom: 1px solid var(--neutral-line);
      }
      .tab {
        display: flex;
        align-items: center;
        min-height: 44px;
        font: 500 13px/1 var(--font-brand);
        color: var(--text-primary);
        text-decoration: none;
        border-bottom: 2px solid transparent;
      }
      .tab.active { font-weight: 600; color: var(--brand-deep); border-bottom-color: var(--brand-deep); }
    `,
  ],
})
export class GeoNav {
  readonly items = input.required<NavItem[]>();
}
