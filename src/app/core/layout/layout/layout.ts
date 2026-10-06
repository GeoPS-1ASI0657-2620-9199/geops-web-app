import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LogOutUseCase } from '../../../iam/application/log-out.use-case';
import { SessionStore } from '../../../iam/application/session.store';
import { UserRole } from '../../../iam/domain/model/user-role';
import { GeoNav, NavItem } from '../geo-nav/geo-nav';
import { GeoTopBar } from '../geo-top-bar/geo-top-bar';

/** Tabs of each role, limited to the routes that exist in the sprint. */
const NAV_BY_ROLE: Record<UserRole | 'VISITOR', NavItem[]> = {
  VISITOR: [{ label: 'Ofertas cercanas', route: '/offers' }],
  CONSUMER: [
    { label: 'Ofertas cercanas', route: '/offers' },
    { label: 'Mis reservas', route: '/reservations' },
  ],
  BUSINESS_OWNER: [
    { label: 'Mis campañas', route: '/campaigns' },
    { label: 'Publicar campaña', route: '/campaigns/new' },
  ],
  ADMIN: [{ label: 'Ofertas cercanas', route: '/offers' }],
};

/** Shell of the signed-in area: top bar and tabs by role (Figma "Barra superior" and "Navegación"). */
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

  logOut(): void {
    this.logOutUseCase.execute();
    void this.router.navigate(['/login']);
  }
}
