import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { SaveBusinessUseCase } from '../../../application/saved-businesses.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';
@Component({
  selector: 'app-save-business',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
  // A bookmark next to the business name: secondary to "Seguir", and apart from "Guardar" of the offer.
  template: `<button mat-icon-button class="bookmark" type="button" [class.on]="saved()" [disabled]="busy() || saved()" (click)="save()"
      [attr.aria-label]="(saved() ? 'savedBusinesses.saved' : 'savedBusinesses.save') | translate"
      [matTooltip]="(saved() ? 'savedBusinesses.saved' : 'savedBusinesses.save') | translate">
      <mat-icon aria-hidden="true">{{ saved() ? 'bookmark_added' : 'bookmark_add' }}</mat-icon>
    </button>@if (error(); as message) { <p role="alert">{{ message | translate }}</p> }`,
  styles: [`.bookmark { color: var(--brand-deep); border: 1px solid var(--neutral-line); }
    .bookmark.on mat-icon { font-variation-settings: 'FILL' 1; color: var(--brand-action); }
    p { margin: 4px 0 0; font: 400 11.5px/1.3 var(--font-brand); color: var(--status-expired); }`],
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
