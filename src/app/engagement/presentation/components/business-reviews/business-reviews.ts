import { ChangeDetectionStrategy, Component, OnChanges, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ListBusinessReviewsUseCase, ReplyToReviewUseCase } from '../../../application/reviews.use-cases';
import { Review } from '../../../domain/model/review';
import { ApiError } from '../../../../shared/domain/api-error';

@Component({
  selector: 'app-business-reviews',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, TranslateModule],
  template: `
    <section [attr.aria-busy]="loading()"><h2>{{ 'reviewsPage.title' | translate }}</h2>
      @if (loading()) { <p role="status">{{ 'reviewsPage.loading' | translate }}</p> }
      @if (error(); as message) { <div role="alert"><p>{{ message | translate }}</p><button mat-stroked-button (click)="load()">{{ 'reviewsPage.retry' | translate }}</button></div> }
      @if (!loading() && !error() && reviews().length === 0) { <p>{{ 'reviewsPage.empty' | translate }}</p> }
      @for (review of reviews(); track review.reviewId) {
        <article><div class="rating" [attr.aria-label]="'reviewsPage.stars' | translate:{count: review.rating}"><mat-icon aria-hidden="true">star</mat-icon>{{ review.rating }} / 5
          @if (review.verifiedRedemption) { <span>{{ 'reviewsPage.verified' | translate }}</span> }</div>
          <p class="text">{{ review.text }}</p>
          @if (review.reply) { <div class="reply"><strong>{{ 'reviewsPage.businessReply' | translate }}</strong><p class="text">{{ review.reply.text }}</p></div> }
          @else if (canReply()) {
            <form (ngSubmit)="reply(review.reviewId)">
              <mat-form-field><mat-label>{{ 'reviewsPage.replyLabel' | translate }}</mat-label><textarea matInput [name]="'reply-' + review.reviewId" [(ngModel)]="drafts[review.reviewId]" maxlength="2000" rows="3" required></textarea></mat-form-field>
              <button mat-stroked-button type="submit" [disabled]="busy() !== null || !drafts[review.reviewId]?.trim()">{{ 'reviewsPage.reply' | translate }}</button>
            </form>
          }
        </article>
      }
    </section>`,
  styles: [`section { margin-top: var(--space-2xl); } h2 { font: 600 20px/1.4 var(--font-brand); } article { border-bottom: 1px solid var(--neutral-line); padding-block: var(--space-xl); } p { line-height: 1.6; } .text { white-space: pre-wrap; overflow-wrap: anywhere; } .rating { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-sm); } .rating span { color: var(--feedback-verified-ink); font-size: 13px; } .reply { background: var(--brand-mist); padding: var(--space-lg); border-radius: var(--radius-input); } form { display: grid; max-width: 640px; gap: var(--space-md); } button { justify-self: start; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessReviews implements OnChanges {
  readonly businessId = input.required<number>();
  readonly canReply = input(false);
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
    try { const reviews = await this.list.execute(id); if (id === this.businessId()) this.reviews.set(reviews); }
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
