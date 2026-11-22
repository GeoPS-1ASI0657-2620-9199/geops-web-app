import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { IsActiveMatchOptions, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
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
      @media (max-width: 720px) {
        /* Tabs scroll sideways; the fade on the right edge tells there are more. */
        .nav { justify-content: flex-start; gap: 22px; scrollbar-width: none;
               mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent);
               -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent); }
        .nav::-webkit-scrollbar { display: none; }
        .tab:last-child { padding-right: 32px; }
      }
    `,
  ],
})
export class GeoNav {
  readonly items = input.required<NavItem[]>();
  protected readonly exact = EXACT;
  protected readonly subset = SUBSET;

  constructor() {
    // On a narrow screen the active tab may sit past the edge (e.g. "Mis Cupones"): bring it into view.
    const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const reveal = () => setTimeout(() => host.querySelector('.tab.active')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }));
    afterNextRender(reveal);
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef))).subscribe(reveal);
  }
}
