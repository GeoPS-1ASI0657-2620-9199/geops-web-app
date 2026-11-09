import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { Review } from '../../../domain/model/review';
import { BusinessReviews } from '../../components/business-reviews/business-reviews';

/** "Comentarios de tus clientes": the reviews with a verified redemption, the ones that wait for an answer and the summary (Figma screen 13). */
@Component({
  selector: 'app-business-comments',
  imports: [BusinessReviews, DecimalPipe, GeoAlert, MatIconModule, TranslateModule],
  template: `
    <section class="page">
      <header class="head">
        <h1 class="title">{{ 'reviewsPage.panelTitle' | translate }}</h1>
        <p class="subtitle">{{ 'reviewsPage.summaryLine' | translate: { total: total(), average: (average() | number: '1.1-1') } }}</p>
      </header>
      @if (sessions.activeSession()?.businessId; as businessId) {
        <div class="layout">
          <div class="main">
            @if (pending() > 0) {
              <geo-alert kind="warning" [title]="(pending() === 1 ? 'reviewsPage.pendingOne' : 'reviewsPage.pending') | translate: { count: pending() }" [description]="'reviewsPage.pendingHint' | translate" />
            }
            <app-business-reviews [businessId]="businessId" [canReply]="true" (loaded)="reviews.set($event)" />
          </div>
          <aside class="side">
            <h2>{{ 'reviewsPage.yourRating' | translate }}</h2>
            <div class="score">
              <p class="big">{{ average() | number: '1.1-1' }}</p>
              <span class="stars" aria-hidden="true">@for (n of [1, 2, 3, 4, 5]; track n) { <mat-icon [class.off]="n > average()">star</mat-icon> }</span>
              <p class="caption">{{ 'reviewsPage.verifiedCount' | translate: { total: total() } }}</p>
            </div>
            <ul class="bars" [attr.aria-label]="'reviewsPage.yourRating' | translate">
              @for (row of distribution(); track row.stars) {
                <li><span class="label">{{ row.stars }} <mat-icon aria-hidden="true">star</mat-icon></span><span class="track"><span class="fill" [style.width.%]="row.percent"></span></span><span class="count">{{ row.count }}</span></li>
              }
            </ul>
          </aside>
        </div>
      } @else {
        <geo-alert kind="error" [title]="'reviewsPage.missingBusiness' | translate" />
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .page { max-width: 1344px; margin-inline: auto; padding: var(--space-xl) var(--space-xl) var(--space-3xl); }
    .head { margin-bottom: var(--space-lg); }
    .title { margin: 0; font: 600 24px/1.3 var(--font-brand); color: var(--text-primary); }
    .subtitle { margin: 2px 0 0; font: 400 13px/1.4 var(--font-brand); color: var(--text-faint); }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 485px); gap: var(--space-2xl); align-items: start; }
    .main { display: flex; flex-direction: column; gap: var(--space-md); }
    .side h2 { margin: 0 0 var(--space-md); font: 600 15px/1.3 var(--font-brand); color: var(--text-primary); }
    .score { display: flex; flex-direction: column; align-items: center; gap: var(--space-xs); padding: var(--space-xl); border: 1px solid var(--neutral-line); border-radius: var(--radius-panel); background: var(--neutral-bg); }
    .big { margin: 0; font: 600 44px/1.1 var(--font-brand); color: var(--text-primary); }
    .stars mat-icon { width: 18px; height: 18px; font-size: 18px; color: var(--status-rating); font-variation-settings: 'FILL' 1; }
    .stars mat-icon.off { color: var(--neutral-line); }
    .caption { margin: 0; font: 400 11px/1.4 var(--font-brand); color: var(--text-faint); }
    .bars { list-style: none; margin: var(--space-lg) 0 0; padding: 0; display: grid; gap: var(--space-sm); }
    .bars li { display: grid; grid-template-columns: 36px 1fr 28px; align-items: center; gap: var(--space-sm); font: 400 11px/1 var(--font-brand); color: var(--text-dim); }
    .label { display: inline-flex; align-items: center; gap: 2px; }
    .label mat-icon { width: 11px; height: 11px; font-size: 11px; color: var(--status-rating); font-variation-settings: 'FILL' 1; }
    .track { height: 6px; border-radius: 3px; background: var(--neutral-line-soft); overflow: hidden; }
    .fill { display: block; height: 100%; background: var(--status-rating); }
    .count { text-align: right; }
    @media (max-width: 1000px) { .layout { grid-template-columns: minmax(0, 1fr); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessCommentsPage {
  readonly sessions = inject(SessionStore);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly total = computed(() => this.reviews().length);
  protected readonly average = computed(() => (this.total() ? this.reviews().reduce((sum, r) => sum + r.rating, 0) / this.total() : 0));
  protected readonly pending = computed(() => this.reviews().filter((r) => !r.reply).length);
  protected readonly distribution = computed(() =>
    [5, 4, 3, 2, 1].map((stars) => {
      const count = this.reviews().filter((r) => r.rating === stars).length;
      return { stars, count, percent: this.total() ? (count / this.total()) * 100 : 0 };
    }),
  );
}
