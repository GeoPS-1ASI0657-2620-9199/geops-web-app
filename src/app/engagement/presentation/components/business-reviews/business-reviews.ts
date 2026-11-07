import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnChanges, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ListBusinessReviewsUseCase, ReplyToReviewUseCase } from '../../../application/reviews.use-cases';
import { Review } from '../../../domain/model/review';
import { ApiError } from '../../../../shared/domain/api-error';

@Component({
  selector: 'app-business-reviews',
  imports: [DatePipe, FormsModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <section [attr.aria-busy]="loading()">
      <h2 class="sr-only">{{ 'reviewsPage.title' | translate }}</h2>
      @if (loading()) { <p role="status" class="note">{{ 'reviewsPage.loading' | translate }}</p> }
      @if (error(); as message) { <div role="alert" class="note"><p>{{ message | translate }}</p><button mat-stroked-button type="button" (click)="load()">{{ 'reviewsPage.retry' | translate }}</button></div> }
      @if (!loading() && !error() && reviews().length === 0) { <p class="note">{{ 'reviewsPage.empty' | translate }}</p> }
      @for (review of reviews(); track review.reviewId) {
        <article class="review" [class.pending]="canReply() && !review.reply">
          <header class="who">
            <span class="avatar" aria-hidden="true"><mat-icon>person</mat-icon></span>
            <div class="who-text">
              <p class="line">
                <span class="stars" role="img" [attr.aria-label]="'reviewsPage.stars' | translate:{count: review.rating}">
                  @for (n of [1, 2, 3, 4, 5]; track n) { <mat-icon [class.off]="n > review.rating" aria-hidden="true">star</mat-icon> }
                </span>
                @if (review.verifiedRedemption) { <span class="verified"><mat-icon aria-hidden="true">check</mat-icon>{{ 'reviewsPage.verified' | translate }}</span> }
              </p>
              <p class="when">{{ review.createdAt | date: 'd MMM y' }}</p>
            </div>
          </header>
          <p class="text">{{ review.text }}</p>
          @if (review.reply) {
            <div class="reply"><p class="reply-label">{{ 'reviewsPage.businessReply' | translate }}</p><p class="text">{{ review.reply.text }}</p></div>
          } @else if (canReply()) {
            <form class="reply-form" (ngSubmit)="reply(review.reviewId)">
              <textarea [name]="'reply-' + review.reviewId" [(ngModel)]="drafts[review.reviewId]" maxlength="2000" rows="2" required
                        [attr.aria-label]="'reviewsPage.replyLabel' | translate" [placeholder]="'reviewsPage.replyLabel' | translate"></textarea>
              <button mat-flat-button type="submit" [disabled]="busy() !== null || !drafts[review.reviewId]?.trim()">{{ 'reviewsPage.reply' | translate }}</button>
            </form>
          }
        </article>
      }
    </section>`,
  styles: [`
    section { display: flex; flex-direction: column; gap: var(--space-md); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .note { margin: 0; color: var(--text-dim); font: 400 13px/1.5 var(--font-brand); }
    .review { padding: var(--space-lg); background: var(--neutral-bg); border: 1px solid var(--neutral-line); border-radius: var(--radius-panel); }
    .review.pending { border-color: var(--feedback-amber-border); }
    .who { display: flex; align-items: center; gap: var(--space-md); }
    .avatar { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--brand-soft); color: var(--brand-deep); }
    .avatar mat-icon { width: 20px; height: 20px; font-size: 20px; }
    .who-text p { margin: 0; }
    .line { display: flex; align-items: center; gap: var(--space-sm); }
    .stars { display: inline-flex; }
    .stars mat-icon { width: 15px; height: 15px; font-size: 15px; color: var(--status-rating); font-variation-settings: 'FILL' 1; }
    .stars mat-icon.off { color: var(--neutral-line); }
    .verified { display: inline-flex; align-items: center; gap: 2px; padding: 2px 6px; border-radius: 4px; background: var(--feedback-verified-bg); color: var(--feedback-verified-ink); font: 600 9px/1.2 var(--font-brand); text-transform: uppercase; }
    .verified mat-icon { width: 11px; height: 11px; font-size: 11px; }
    .when { font: 400 11px/1.4 var(--font-brand); color: var(--text-faint); }
    .text { margin: var(--space-md) 0 0; font: 400 14px/1.5 var(--font-brand); color: var(--text-primary); white-space: pre-line; overflow-wrap: anywhere; }
    .reply { margin-top: var(--space-md); padding: var(--space-md) var(--space-lg); border-radius: var(--radius-card); background: var(--neutral-surface-2); }
    .reply-label { margin: 0; font: 500 12px/1.4 var(--font-brand); color: var(--brand-action); }
    .reply .text { margin-top: 2px; }
    .reply-form { display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-md); align-items: flex-start; }
    .reply-form textarea { width: 100%; padding: 8px 12px; border: 1px solid var(--neutral-line); border-radius: var(--radius-input); font: 400 13px/1.4 var(--font-brand); resize: vertical; }
    .reply-form button:not(:disabled) { background-color: var(--brand-action); color: var(--neutral-bg); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessReviews implements OnChanges {
  readonly businessId = input.required<number>();
  readonly canReply = input(false);
  /** The page that shows the summary of the ratings needs the same list. */
  readonly loaded = output<Review[]>();
  private readonly list = inject(ListBusinessReviewsUseCase);
  private readonly respond = inject(ReplyToReviewUseCase);
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly drafts: Record<number, string> = {};
  ngOnChanges() { void this.load(); }
  async load() {
    const id = this.businessId();
    this.loading.set(true); this.error.set(null);
    try { const reviews = await this.list.execute(id); if (id === this.businessId()) { this.reviews.set(reviews); this.loaded.emit(reviews); } }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'reviewsPage.error'); }
    finally { this.loading.set(false); }
  }
  async reply(reviewId: number) {
    const text = this.drafts[reviewId]?.trim();
    if (!this.canReply() || this.busy() !== null || !text || text.length > 2000) return;
    this.busy.set(reviewId); this.error.set(null);
    try { await this.respond.execute(reviewId, text); delete this.drafts[reviewId]; await this.load(); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'reviewsPage.error'); }
    finally { this.busy.set(null); }
  }
}
