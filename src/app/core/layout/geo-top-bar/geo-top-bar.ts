import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

export type ShellRole = 'CONSUMER' | 'BUSINESS_OWNER' | 'ADMIN';

const HOME_BY_ROLE: Record<ShellRole, string> = {
  CONSUMER: '/offers',
  BUSINESS_OWNER: '/campaigns',
  ADMIN: '/offers',
};

/** Purple top bar of the Figma "Barra superior" component: logo and the user pill with its menu. */
@Component({
  selector: 'geo-top-bar',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <a class="logo" [routerLink]="home()">GeoPs</a>
      <span class="spacer"></span>
      @if (userName()) {
        <button class="pill" type="button" [matMenuTriggerFor]="menu" aria-label="Menú de la cuenta">
          <span class="avatar" aria-hidden="true">{{ initial() }}</span>
          {{ userName() }}
          <mat-icon aria-hidden="true">expand_more</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item type="button" (click)="logOut.emit()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar sesión</span>
          </button>
        </mat-menu>
      } @else if (showLogin()) {
        <a class="pill login" routerLink="/login">Iniciar sesión</a>
      }
    </header>
  `,
  styles: [
    `
      .bar {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        height: 64px;
        padding: 0 var(--space-2xl);
        background: var(--brand-base);
      }
      .logo { font: 400 28px/1 var(--font-logo); color: var(--neutral-bg); text-decoration: none; }
      .spacer { flex: 1; }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: var(--space-sm);
        min-height: 44px;
        padding: 4px 12px 4px 4px;
        border: 0;
        border-radius: var(--radius-chip);
        background: var(--neutral-bg);
        color: var(--text-primary);
        font: 500 13px/1 var(--font-brand);
        cursor: pointer;
        text-decoration: none;
      }
      .pill.login { padding: 4px 16px; font-weight: 600; color: var(--brand-deep); }
      .avatar {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--brand-action);
        color: var(--neutral-bg);
        font-weight: 600;
      }
      mat-icon { width: 18px; height: 18px; font-size: 18px; }
    `,
  ],
})
export class GeoTopBar {
  readonly role = input<ShellRole>('CONSUMER');
  readonly userName = input<string | null>(null);
  /** Shows the login link to visitors without a session; off on the login and register pages. */
  readonly showLogin = input(false);
  readonly logOut = output<void>();
  protected readonly home = computed(() => HOME_BY_ROLE[this.role()]);
  protected readonly initial = computed(() => (this.userName() ?? '?').trim().charAt(0).toUpperCase());
}
