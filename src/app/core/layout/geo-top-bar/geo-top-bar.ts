import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';

import { HOME_BY_ROLE } from '../../../iam/domain/model/home-by-role';

export type ShellRole = 'CONSUMER' | 'BUSINESS_OWNER' | 'ADMIN';


/**
 * Purple top bar of the Figma "Barra superior" component: logo, the translucent search box (buyer
 * side only), and the white pills for help, notices and the account.
 */
@Component({
  selector: 'geo-top-bar',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatMenuModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <a class="logo" [routerLink]="home()">GeoPs</a>
      @if (showSearch() && !minimal()) {
        <form class="search" role="search" (submit)="submit($event)">
          <mat-icon aria-hidden="true">search</mat-icon>
          <input
            type="search"
            name="q"
            [value]="term()"
            (input)="term.set($any($event.target).value)"
            [placeholder]="'header.search.placeholder' | translate"
            [attr.aria-label]="'header.search.placeholder' | translate" />
        </form>
      }
      <span class="spacer"></span>
      @if (!minimal()) {
      <button class="pill" type="button" [matMenuTriggerFor]="help">{{ 'header.help' | translate }}</button>
      <mat-menu #help="matMenu" class="geo-help-menu">
        <div class="help" (click)="$event.stopPropagation()">
          <p class="help-title">{{ 'header.helpMenu.title' | translate }}</p>
          <ol>
            <li>{{ 'header.helpMenu.step1' | translate }}</li>
            <li>{{ 'header.helpMenu.step2' | translate }}</li>
            <li>{{ 'header.helpMenu.step3' | translate }}</li>
          </ol>
        </div>
      </mat-menu>
      <button class="pill icon" type="button" [matMenuTriggerFor]="notices" [attr.aria-label]="'header.notifications' | translate">
        <mat-icon aria-hidden="true">notifications</mat-icon>
      </button>
      <mat-menu #notices="matMenu">
        <p class="notices">{{ 'header.noNotices' | translate }}</p>
      </mat-menu>
      @if (userName()) {
        <button class="pill user" type="button" [matMenuTriggerFor]="menu" [attr.aria-label]="'header.accountMenu' | translate">
          <span class="avatar" aria-hidden="true">{{ initial() }}</span>
          {{ userName() }}
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item type="button" (click)="logOut.emit()">
            <mat-icon>logout</mat-icon>
            <span>{{ 'header.profile.menu.logout' | translate }}</span>
          </button>
        </mat-menu>
      } @else if (showLogin()) {
        <a class="pill login" routerLink="/login">{{ 'header.logIn' | translate }}</a>
      }
      }
    </header>
  `,
  styles: [
    `
      .bar {
        display: flex;
        align-items: center;
        gap: var(--space-lg);
        height: 64px;
        padding: 0 26px;
        background: var(--brand-base);
      }
      .logo { font: 700 23px/1 var(--font-brand); color: var(--neutral-bg); text-decoration: none; }
      .search {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 400px;
        max-width: 40vw;
        height: 32px;
        margin-left: var(--space-sm);
        padding: 0 16px;
        border-radius: var(--radius-chip);
        background: rgba(255, 255, 255, 0.17);
        color: #efe0fa;
      }
      .search mat-icon { width: 17px; height: 17px; font-size: 17px; }
      .search input {
        flex: 1;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: var(--neutral-bg);
        font: 400 12.5px/1 var(--font-brand);
      }
      .search input::placeholder { color: #efe0fa; }
      .search:focus-within { outline: 2px solid var(--neutral-bg); outline-offset: 2px; }
      .spacer { flex: 1; }
      .pill {
        display: inline-flex;
        align-items: center;
        gap: var(--space-sm);
        height: 32px;
        padding: 0 16px;
        border: 0;
        border-radius: var(--radius-chip);
        background: var(--neutral-bg);
        color: var(--text-primary);
        font: 500 12.5px/1 var(--font-brand);
        cursor: pointer;
        text-decoration: none;
      }
      .pill.icon { width: 40px; padding: 0; justify-content: center; }
      .pill.icon mat-icon { width: 16px; height: 16px; font-size: 16px; }
      .pill.user { height: 36px; padding: 0 16px 0 6px; }
      .pill.login { font-weight: 600; color: var(--brand-deep); }
      .avatar {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--brand-action);
        color: var(--neutral-bg);
        font: 600 11px/1 var(--font-brand);
      }
      .help { max-width: 300px; padding: var(--space-sm) var(--space-lg); font: 400 12.5px/1.45 var(--font-brand); }
      .help-title { margin: 0 0 var(--space-xs); font-weight: 600; color: var(--brand-deep); }
      .help ol { margin: 0; padding-left: 18px; color: var(--text-dim); }
      .notices { margin: 0; padding: var(--space-sm) var(--space-lg); font: 400 12.5px/1.45 var(--font-brand); color: var(--text-dim); }
      @media (max-width: 720px) {
        .bar { gap: var(--space-sm); padding: 0 16px; }
        .search { display: none; }
        .pill { padding: 0 12px; }
      }
    `,
  ],
})
export class GeoTopBar {
  readonly role = input<ShellRole>('CONSUMER');
  readonly userName = input<string | null>(null);
  /** Shows the login link to visitors without a session. */
  readonly showLogin = input(false);
  /** The search box belongs to the buyer side (Figma screens 1 to 6); the business bar has none. */
  readonly showSearch = input(true);
  /** Logo only, as on the login and sign up screens (Figma 14 to 22). */
  readonly minimal = input(false);
  readonly logOut = output<void>();
  readonly searched = output<string>();

  protected readonly term = signal('');
  protected readonly home = computed(() => HOME_BY_ROLE[this.role()]);
  protected readonly initial = computed(() => (this.userName() ?? '?').trim().charAt(0).toUpperCase());

  protected submit(event: Event): void {
    event.preventDefault();
    this.searched.emit(this.term().trim());
  }
}
