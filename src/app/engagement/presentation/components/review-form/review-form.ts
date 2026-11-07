import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CreateReviewUseCase } from '../../../application/reviews.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';

@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    @if (sent()) {
      <div class="done" role="status"><mat-icon aria-hidden="true">check_circle</mat-icon><p>{{ 'reviewsPage.published' | translate }}</p></div>
    } @else {
      <form class="card" [formGroup]="form" (ngSubmit)="submit()">
        <h2 class="title">{{ 'reviewsPage.write' | translate }}</h2>
        <p class="meta"><span class="verified"><mat-icon aria-hidden="true">check</mat-icon>{{ 'reviewsPage.verified' | translate }}</span>{{ 'reviewsPage.verifiedHint' | translate }}</p>
        <p class="label" id="rating-label">{{ 'reviewsPage.rating' | translate }}</p>
        <div class="stars" role="radiogroup" aria-labelledby="rating-label">
          @for (stars of ratings; track stars) {
            <button type="button" role="radio" class="star" [class.on]="stars <= form.controls.rating.value"
                    [attr.aria-checked]="stars === form.controls.rating.value" [attr.aria-label]="'reviewsPage.stars' | translate:{count: stars}"
                    (click)="form.controls.rating.setValue(stars)"><mat-icon aria-hidden="true">star</mat-icon></button>
          }
        </div>
        <label class="label" for="review-text">{{ 'reviewsPage.experience' | translate }}</label>
        <textarea id="review-text" formControlName="text" rows="4" maxlength="2000"></textarea>
        <p class="hint">{{ 'reviewsPage.publishedWith' | translate }} {{ form.controls.text.value.length }} / 2000</p>
        @if (error(); as message) { <p role="alert" class="error">{{ message | translate }}</p> }
        <div class="actions"><button mat-flat-button type="submit" [disabled]="busy() || form.invalid">{{ (busy() ? 'reviewsPage.publishing' : 'reviewsPage.publish') | translate }}</button></div>
      </form>
    }`,
  styles: [`
    .card { display: flex; flex-direction: column; gap: var(--space-sm); max-width: 640px; width: 100%; margin-block: var(--space-xl); padding: var(--space-xl); background: var(--neutral-bg); border: 1px solid var(--neutral-line); border-radius: var(--radius-panel); }
    .title { margin: 0; font: 600 22px/1.3 var(--font-brand); color: var(--text-primary); }
    .meta { display: flex; align-items: center; gap: var(--space-sm); margin: 0 0 var(--space-md); font: 400 12px/1.4 var(--font-brand); color: var(--text-dim); }
    .verified { display: inline-flex; align-items: center; gap: 2px; padding: 2px 6px; border-radius: 4px; background: var(--feedback-verified-bg); color: var(--feedback-verified-ink); font: 600 9px/1.2 var(--font-brand); text-transform: uppercase; }
    .verified mat-icon { width: 11px; height: 11px; font-size: 11px; }
    .label { margin: var(--space-sm) 0 0; font: 500 14px/1.4 var(--font-brand); color: var(--text-primary); }
    .stars { display: flex; gap: var(--space-xs); }
    .star { padding: 0; border: 0; background: none; cursor: pointer; color: var(--neutral-line); }
    .star.on { color: var(--status-rating); }
    .star mat-icon { width: 32px; height: 32px; font-size: 32px; font-variation-settings: 'FILL' 1; }
    .star:focus-visible { outline: 2px solid var(--brand-deep); outline-offset: 2px; border-radius: 4px; }
    textarea { padding: 10px 12px; border: 1.5px solid var(--brand-action); border-radius: var(--radius-input); font: 400 14px/1.5 var(--font-brand); resize: vertical; }
    .hint { margin: 0; font: 400 11px/1.4 var(--font-brand); color: var(--text-faint); }
    .error { margin: 0; font: 400 12px/1.4 var(--font-brand); color: var(--status-expired); }
    .actions { display: flex; justify-content: flex-end; }
    .actions button:not(:disabled) { background-color: var(--brand-action); color: var(--neutral-bg); }
    .done { display: flex; align-items: center; gap: var(--space-sm); color: var(--feedback-verified-ink); }
    .done p { margin: 0; font: 500 13px/1.4 var(--font-brand); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewForm {
  readonly businessId = input.required<number>();
  private readonly create = inject(CreateReviewUseCase);
  readonly ratings = [1, 2, 3, 4, 5];
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = new FormGroup({ rating: new FormControl(5, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(5)] }), text: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(2000), Validators.pattern(/\S/)] }) });
  async submit() {
    if (this.busy() || this.form.invalid) return;
    this.busy.set(true); this.error.set(null);
    try { await this.create.execute({ businessId: this.businessId(), ...this.form.getRawValue() }); this.sent.set(true); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'reviewsPage.error'); }
    finally { this.busy.set(false); }
  }
}
