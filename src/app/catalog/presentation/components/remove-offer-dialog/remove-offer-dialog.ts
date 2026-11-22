import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { MAX_REASON_LENGTH, MIN_REASON_LENGTH, isValidReason } from '../../../domain/model/moderation';

/** The offer the administrator is about to remove. */
export interface RemoveOfferDialogData {
  readonly title: string;
  readonly businessName: string | null;
}

/**
 * Asks for the reason before removing an offer (US24). Closes with the reason to go ahead, or with
 * nothing when the administrator cancels.
 */
@Component({
  selector: 'app-remove-offer-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ 'moderationPage.removeDialog.title' | translate: { title: data.title } }}</h2>
    <form (submit)="confirm($event)">
      <mat-dialog-content>
        <p class="lead">
          {{ 'moderationPage.removeDialog.description' | translate: { business: data.businessName ?? '—' } }}
        </p>
        <mat-form-field appearance="outline" class="reason">
          <mat-label>{{ 'moderationPage.removeDialog.reason' | translate }}</mat-label>
          <textarea
            matInput
            data-testid="reason"
            rows="3"
            [formControl]="reason"
            [attr.maxlength]="max"
            cdkFocusInitial></textarea>
          <mat-hint align="end">{{ reason.value.trim().length }} / {{ max }}</mat-hint>
          @if (reason.touched && reason.invalid) {
            <mat-error>{{ 'moderationPage.removeDialog.reasonError' | translate: { min: min, max: max } }}</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="null">{{ 'moderationPage.removeDialog.cancel' | translate }}</button>
        <button mat-flat-button type="submit" class="danger" data-testid="confirm-remove">
          {{ 'moderationPage.removeDialog.confirm' | translate }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .lead { margin: 0 0 12px; font: 400 13px/1.45 var(--font-brand); color: var(--text-dim); }
      .reason { width: 100%; min-width: min(420px, 70vw); }
      .danger { --mat-button-filled-container-color: var(--feedback-red-ink); --mat-button-filled-label-text-color: var(--neutral-bg); }
      button { min-height: 40px; }
    `,
  ],
})
export class RemoveOfferDialog {
  protected readonly data = inject<RemoveOfferDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<RemoveOfferDialog, string | null>>(MatDialogRef);
  protected readonly min = MIN_REASON_LENGTH;
  protected readonly max = MAX_REASON_LENGTH;
  protected readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, (control) => (isValidReason(control.value ?? '') ? null : { reason: true })],
  });

  confirm(event?: Event): void {
    event?.preventDefault();
    this.reason.markAsTouched();
    if (this.reason.invalid) {
      return;
    }
    this.dialogRef.close(this.reason.value.trim());
  }
}
