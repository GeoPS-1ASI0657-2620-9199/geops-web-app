import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { RequestableCampaignStatus } from '../../../domain/model/campaign';

/** What the owner is about to do with which campaign. */
export interface CampaignStatusDialogData {
  readonly name: string;
  readonly status: RequestableCampaignStatus;
}

/** Asks before pausing or reactivating a campaign (US10); closes with true to go ahead. */
@Component({
  selector: 'app-campaign-status-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ 'campaignsPage.statusDialog.' + data.status + '.title' | translate: { name: data.name } }}</h2>
    <mat-dialog-content>
      <p>{{ 'campaignsPage.statusDialog.' + data.status + '.description' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">{{ 'campaignsPage.statusDialog.cancel' | translate }}</button>
      <button mat-flat-button type="button" data-testid="confirm-status" [mat-dialog-close]="true" cdkFocusInitial>
        {{ 'campaignsPage.statusDialog.' + data.status + '.confirm' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CampaignStatusDialog {
  protected readonly data = inject<CampaignStatusDialogData>(MAT_DIALOG_DATA);
}
