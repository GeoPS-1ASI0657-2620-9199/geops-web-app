import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { SaveBusinessUseCase } from '../../../application/saved-businesses.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';
@Component({
  selector: 'app-save-business',
  imports: [MatButtonModule, TranslateModule],
  template: `<button mat-stroked-button [disabled]="busy() || saved()" (click)="save()">{{ (saved() ? 'savedBusinesses.saved' : 'savedBusinesses.save') | translate }}</button>@if (error(); as message) { <p role="alert">{{ message | translate }}</p> }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveBusiness {
  readonly businessId = input.required<number>();
  private readonly saveBusiness = inject(SaveBusinessUseCase);
  readonly busy = signal(false);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);
  async save() {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(null);
    try { await this.saveBusiness.execute(this.businessId()); this.saved.set(true); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'savedBusinesses.error'); }
    finally { this.busy.set(false); }
  }
}
