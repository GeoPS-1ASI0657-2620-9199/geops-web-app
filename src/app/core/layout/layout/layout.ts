import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, UrlTree } from '@angular/router';
import { filter, map } from 'rxjs';
import { LogOutUseCase } from '../../../iam/application/log-out.use-case';
import { SessionStore } from '../../../iam/application/session.store';
import { UserRole } from '../../../iam/domain/model/user-role';
import { GeoNav, NavItem } from '../geo-nav/geo-nav';
import { GeoTopBar } from '../geo-top-bar/geo-top-bar';

const BUYER_TABS: NavItem[] = [
  { label: 'nav.home', route: '/inicio' },
  { label: 'nav.offers', route: '/offers', matchChildren: true },
  { label: 'nav.categories', route: '/categories' },
  { label: 'nav.favorites', route: '/favorites' },
  { label: 'nav.coupons', route: '/reservations', matchChildren: true },
];

/** Tabs of each role, as the Figma names them (screens 1 and 34). */
export const NAV_BY_ROLE: Record<UserRole | 'VISITOR', NavItem[]> = {
  VISITOR: BUYER_TABS,
  CONSUMER: BUYER_TABS,
  BUSINESS_OWNER: [
    { label: 'nav.summary', route: '/business' },
    { label: 'nav.validate', route: '/validate' },
    { label: 'nav.campaigns', route: '/campaigns' },
    { label: 'nav.create', route: '/campaigns/new' },
    { label: 'nav.reports', route: '/reports' },
    { label: 'nav.comments', route: '/comments' },
  ],
  ADMIN: [{ label: 'nav.moderation', route: '/admin/moderation' }, ...BUYER_TABS],
};

/** Shell of the app: top bar and tabs by role (Figma "Barra superior" and "NavegaciÃ³n"). */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, GeoNav, GeoTopBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <geo-top-bar
      [role]="role() ?? 'CONSUMER'"
      [userName]="sessions.displayName()"
      [showLogin]="true"
      [showSearch]="role() !== 'BUSINESS_OWNER'"
      [query]="query()"
      (searched)="search($event)"
      (logOut)="logOut()" />
    <geo-nav [items]="navItems()" />
    <main class="content"><router-outlet /></main>
  `,
  styles: [
    `
      :host { display: block; min-height: 100vh; background: var(--neutral-surface-2); }
      .content { min-height: calc(100vh - 112px); }
    `,
  ],
})
export class Layout {
  protected readonly sessions = inject(SessionStore);
  private readonly logOutUseCase = inject(LogOutUseCase);
  private readonly router = inject(Router);

  protected readonly role = computed(() => this.sessions.role());
  protected readonly navItems = computed(() => NAV_BY_ROLE[this.role() ?? 'VISITOR']);
  /** ?q= while Ofertas is open, so the box of the top bar always says what is being searched. */
  protected readonly query = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.queryOf(this.router.parseUrl(this.router.url))),
    ),
    { initialValue: this.queryOf(this.router.parseUrl(this.router.url)) },
  );

  /**
   * Searches on Ofertas; an empty text clears the search. On Ofertas the other parameters (the
   * category) stay in the address, so the results keep their filter.
   */
  search(term: string): void {
    const q = term || null;
    if (this.isOffersList(this.router.parseUrl(this.router.url))) {
      void this.router.navigate(['/offers'], { queryParams: { q }, queryParamsHandling: 'merge' });
      return;
    }
    void this.router.navigate(['/offers'], { queryParams: q ? { q } : {} });
  }

  logOut(): void {
    this.logOutUseCase.execute();
    void this.router.navigate(['/login']);
  }

  private queryOf(url: UrlTree): string {
    return this.isOffersList(url) ? (url.queryParamMap.get('q') ?? '') : '';
  }

  private isOffersList(url: UrlTree): boolean {
    const segments = url.root.children['primary']?.segments ?? [];
    return segments.length === 1 && segments[0].path === 'offers';
  }
}
