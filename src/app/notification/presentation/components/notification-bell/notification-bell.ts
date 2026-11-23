import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, NgZone, computed, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { CountUnreadNotificationsUseCase, ListMyNotificationsUseCase, MarkNotificationsReadUseCase } from '../../../application/notification-inbox.use-cases';
import { InboxNotification } from '../../../domain/model/inbox-notification';
import { PUSH_RECEIVED_EVENT } from '../../../infrastructure/push-received-event';
import { RelativeTime, relativeTime } from './relative-time';

export const UNREAD_POLL_MS = 60_000;

interface NoticeView extends InboxNotification { link: string | null; ago: RelativeTime }

/** Bell of the top bar: unread badge, latest notices on open, and the shortcut to the preferences. */
@Component({
  selector: 'geo-notification-bell',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, MatIconModule, MatMenuModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="bell" type="button" [matMenuTriggerFor]="menu" #trigger="matMenuTrigger" (menuOpened)="open()"
      [attr.aria-label]="'notificationBell.ariaLabel' | translate: { count: unread() }">
      <mat-icon aria-hidden="true">notifications</mat-icon>
      @if (unread() > 0) { <span class="badge" aria-hidden="true">{{ badge() }}</span> }
    </button>
    <mat-menu #menu="matMenu" class="geo-notices-menu">
      <div class="panel" (click)="$event.stopPropagation()">
        @if (loading()) {
          <div class="skeleton" role="status" aria-busy="true" [attr.aria-label]="'notificationBell.loading' | translate">
            <span></span><span></span><span></span>
          </div>
        } @else if (failed()) {
          <div class="state" role="alert">
            <p>{{ 'notificationBell.error' | translate }}</p>
            <button type="button" class="retry" (click)="load()">{{ 'notificationBell.retry' | translate }}</button>
          </div>
        } @else if (views().length === 0) {
          <p class="state">{{ 'header.noNotices' | translate }}</p>
        } @else {
          <ul class="list">
            @for (item of views(); track item.id) {
              <li>
                @if (item.link) {
                  <a class="notice" [routerLink]="item.link" (click)="closeMenu()">
                    <ng-container [ngTemplateOutlet]="body" [ngTemplateOutletContext]="{ $implicit: item }" />
                  </a>
                } @else {
                  <div class="notice"><ng-container [ngTemplateOutlet]="body" [ngTemplateOutletContext]="{ $implicit: item }" /></div>
                }
              </li>
            }
          </ul>
        }
        @if (role() === 'CONSUMER') {
          <a class="settings" routerLink="/preferences" (click)="closeMenu()">{{ 'notificationBell.settings' | translate }}</a>
        }
      </div>
    </mat-menu>
    <ng-template #body let-item>
      @if (!item.read) { <span class="dot" role="img" [attr.aria-label]="'notificationBell.unreadDot' | translate"></span> }
      <span class="text">
        <span class="title">{{ item.title }}</span>
        <span class="message">{{ item.message }}</span>
        <span class="when">{{ item.ago.key | translate: { count: item.ago.count } }}</span>
      </span>
    </ng-template>
  `,
  styles: [
    `
      :host { display: inline-flex; }
      .bell {
        position: relative; display: inline-flex; align-items: center; justify-content: center;
        width: 40px; height: 32px; padding: 0; border: 0; border-radius: var(--radius-chip);
        background: var(--neutral-bg); color: var(--text-primary); cursor: pointer;
      }
      .bell mat-icon { width: 16px; height: 16px; font-size: 16px; }
      @media (pointer: coarse), (max-width: 640px) { .bell { height: 40px; } }
      .badge {
        position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px;
        box-sizing: border-box; border-radius: 9px; background: var(--brand-action);
        color: #fff; font: 700 11px/18px var(--font-brand); text-align: center;
      }
      .panel { width: 340px; max-width: 100%; font: 400 12.5px/1.45 var(--font-brand); }
      .list { margin: 0; padding: 0; list-style: none; max-height: 360px; overflow-y: auto; }
      .notice {
        display: flex; gap: 10px; align-items: flex-start; padding: 10px var(--space-lg);
        color: var(--text-primary); text-decoration: none; border-bottom: 1px solid var(--neutral-surface-2);
      }
      a.notice:hover, a.notice:focus-visible { background: var(--neutral-surface-2); outline: none; }
      a.notice:focus-visible { box-shadow: inset 0 0 0 2px var(--brand-base); }
      .dot { flex: none; width: 8px; height: 8px; margin-top: 5px; border-radius: 50%; background: var(--brand-action); }
      .text { display: flex; flex-direction: column; gap: 2px; min-width: 0; overflow-wrap: anywhere; }
      .title { font-weight: 600; }
      .message, .when { color: var(--text-dim); }
      .when { font-size: 11.5px; }
      .state { margin: 0; padding: var(--space-sm) var(--space-lg); color: var(--text-dim); }
      .state p { margin: 0 0 var(--space-xs); }
      .retry, .settings {
        border: 0; background: none; color: var(--brand-deep); font: 600 12.5px/1 var(--font-brand);
        cursor: pointer; text-decoration: underline;
      }
      .retry { padding: 6px 0; }
      .settings { display: block; padding: 12px var(--space-lg); }
      .skeleton { display: grid; gap: 10px; padding: 12px var(--space-lg); }
      .skeleton span { height: 44px; border-radius: 6px; background: var(--neutral-surface-2); animation: pulse 1.2s ease-in-out infinite; }
      @keyframes pulse { 50% { opacity: 0.5; } }
      @media (prefers-reduced-motion: reduce) { .skeleton span { animation: none; } }
    `,
  ],
})
export class GeoNotificationBell {
  readonly role = input<string>('CONSUMER');

  private readonly list = inject(ListMyNotificationsUseCase);
  private readonly count = inject(CountUnreadNotificationsUseCase);
  private readonly markRead = inject(MarkNotificationsReadUseCase);
  private readonly router = inject(Router);
  private readonly trigger = viewChild(MatMenuTrigger);

  protected readonly unread = signal(0);
  protected readonly items = signal<InboxNotification[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly badge = computed(() => (this.unread() > 9 ? '9+' : String(this.unread())));
  protected readonly views = computed<NoticeView[]>(() =>
    this.items().map(item => ({ ...item, link: this.target(item), ago: relativeTime(item.createdAt) })));

  constructor() {
    const destroyRef = inject(DestroyRef);
    void this.refresh();
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(destroyRef))
      .subscribe(() => void this.refresh());
    // Outside the zone so the endless timer never keeps the app from becoming stable.
    const timer = inject(NgZone).runOutsideAngular(() =>
      setInterval(() => { if (document.visibilityState === 'visible') void this.refresh(); }, UNREAD_POLL_MS));
    const onPush = () => void this.refresh();
    window.addEventListener(PUSH_RECEIVED_EVENT, onPush);
    destroyRef.onDestroy(() => { clearInterval(timer); window.removeEventListener(PUSH_RECEIVED_EVENT, onPush); });
  }

  /** Reads the badge number; a failure keeps the previous one, since the badge is only a hint. */
  async refresh(): Promise<void> {
    try { this.unread.set(await this.count.execute()); } catch { /* keep the previous number */ }
  }

  protected open(): void { void this.load(); }

  /** Loads the latest notices and, once they are on screen, marks them as read. */
  async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      this.items.set(await this.list.execute());
    } catch {
      this.failed.set(true);
      return;
    } finally {
      this.loading.set(false);
    }
    try { await this.markRead.execute(); this.unread.set(0); } catch { /* the badge stays until the next poll */ }
  }

  /** Clicks on a link inside the panel do not reach the menu (they are stopped), so it is closed here. */
  protected closeMenu(): void { this.trigger()?.closeMenu(); }

  private target(item: InboxNotification): string | null {
    if (item.offerId !== null && item.offerId !== undefined) return `/offers/${item.offerId}`;
    if (item.type.includes('REPORT')) return this.role() === 'BUSINESS_OWNER' ? '/reports' : '/reservations';
    return null;
  }
}
