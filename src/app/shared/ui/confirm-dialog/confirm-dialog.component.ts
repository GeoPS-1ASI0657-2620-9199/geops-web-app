import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateService } from '@ngx-translate/core';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

/**
 * ConfirmDialogComponent
 *
 * Reusable confirmation dialog for destructive actions.
 * Displays a title, message, and confirm/cancel buttons.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="confirm-dialog" [class.is-danger]="data.isDanger">
      <div class="dialog-icon" [class.is-danger]="data.isDanger">
        <mat-icon>{{ data.isDanger ? 'warning_amber' : 'help_outline' }}</mat-icon>
      </div>

      <div class="dialog-header">
        <h2>{{ data.title }}</h2>
      </div>

      <mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button color="primary" (click)="onCancel()">
          {{ cancelLabel }}
        </button>
        <button
          mat-raised-button
          [color]="data.isDanger ? 'warn' : 'primary'"
          (click)="onConfirm()">
          {{ confirmLabel }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 320px;
      max-width: 520px;
      padding: 24px;
      border-radius: 16px;
      background: linear-gradient(180deg, #ffffff 0%, #fdf7ff 100%);
      box-shadow: 0 24px 48px rgba(74, 0, 114, 0.18);
      border: 1px solid rgba(167, 81, 212, 0.15);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .confirm-dialog.is-danger {
      border-color: rgba(244, 67, 54, 0.25);
    }

    .dialog-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(167, 81, 212, 0.12);
      color: #a751d4;
    }

    .dialog-icon.is-danger {
      background: rgba(244, 67, 54, 0.15);
      color: #d32f2f;
    }

    .dialog-icon mat-icon {
      font-size: 30px;
      width: 30px;
      height: 30px;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1c1c1c;
    }

    .dialog-content {
      padding: 0;
    }

    .dialog-content p {
      margin: 0;
      font-size: 15px;
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.78);
    }

    .dialog-actions {
      padding-top: 8px;
      gap: 12px;
    }

    .dialog-actions button {
      min-width: 120px;
      border-radius: 24px;
      text-transform: none;
      font-weight: 600;
    }

    .dialog-actions button[mat-stroked-button] {
      border-color: rgba(167, 81, 212, 0.5);
    }

    @media (max-width: 480px) {
      .confirm-dialog {
        min-width: 0;
        padding: 20px;
      }

      .dialog-actions {
        flex-direction: column;
      }

      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  public readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly translate = inject(TranslateService);

  get cancelLabel(): string {
    return this.data.cancelText ?? this.translate.instant('common.cancel');
  }

  get confirmLabel(): string {
    return this.data.confirmText ?? this.translate.instant('common.confirm');
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
