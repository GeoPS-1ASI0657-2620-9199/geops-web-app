import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { CreateReviewUseCase } from '../../../application/reviews.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';

@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, TranslateModule],
  template: `
    @if (sent()) { <p role="status">{{ 'reviewsPage.published' | translate }}</p> }
    @else {
      <form [formGroup]="form" (ngSubmit)="submit()">
        <h2>{{ 'reviewsPage.write' | translate }}</h2>
        <p>{{ 'reviewsPage.verifiedHint' | translate }}</p>
        <mat-form-field><mat-label>{{ 'reviewsPage.rating' | translate }}</mat-label>
          <mat-select formControlName="rating">@for (stars of ratings; track stars) { <mat-option [value]="stars">{{ 'reviewsPage.stars' | translate:{count: stars} }}</mat-option> }</mat-select>
        </mat-form-field>
        <mat-form-field><mat-label>{{ 'reviewsPage.experience' | translate }}</mat-label><textarea matInput formControlName="text" rows="4" maxlength="2000"></textarea><mat-hint>{{ form.controls.text.value.length }}/2000</mat-hint></mat-form-field>
        @if (error(); as message) { <p role="alert">{{ message | translate }}</p> }
        <button mat-flat-button type="submit" [disabled]="busy() || form.invalid">{{ (busy() ? 'reviewsPage.publishing' : 'reviewsPage.publish') | translate }}</button>
      </form>
    }`,
  styles: [`form { display: grid; gap: var(--space-lg); max-width: 640px; width: 100%; margin-block: var(--space-xl); } h2, p { margin: 0; } p { color: var(--text-dim); line-height: 1.6; } button { justify-self: start; } button[mat-flat-button]:not(:disabled) { background-color: var(--brand-deep); color: var(--neutral-bg); }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewForm {
  readonly businessId = input.required<number>();
  private readonly create = inject(CreateReviewUseCase);
  readonly ratings = [5, 4, 3, 2, 1];
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
