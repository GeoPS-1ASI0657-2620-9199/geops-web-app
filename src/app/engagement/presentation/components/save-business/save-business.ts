import { ChangeDetectionStrategy, Component, OnChanges, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import {
  ListSavedBusinessesUseCase,
  RemoveSavedBusinessUseCase,
  SaveBusinessUseCase,
} from '../../../application/saved-businesses.use-cases';
import { ApiError } from '../../../../shared/domain/api-error';

/**
 * Bookmark of the business on the offer detail (US12). It asks Engagement whether the business is
 * already saved, so any offer of that business shows the same state, and a second tap removes it.
 */
@Component({
  selector: 'app-save-business',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
  // A bookmark next to the business name: secondary to "Seguir", and apart from "Guardar" of the offer.
  template: `<button mat-icon-button class="bookmark" type="button" [class.on]="saved()" [disabled]="busy()" (click)="toggle()"
      [attr.aria-pressed]="saved()" [attr.aria-label]="'savedBusinesses.save' | translate"
      [matTooltip]="(saved() ? 'savedBusinesses.savedTapToRemove' : 'savedBusinesses.save') | translate">
      <mat-icon aria-hidden="true">{{ saved() ? 'bookmark_added' : 'bookmark_add' }}</mat-icon>
    </button>@if (error(); as message) { <p role="alert">{{ message | translate }}</p> }`,
  styles: [`.bookmark { color: var(--brand-deep); border: 1px solid var(--neutral-line); }
    .bookmark.on mat-icon { font-variation-settings: 'FILL' 1; color: var(--brand-action); }
    p { margin: 4px 0 0; font: 400 11.5px/1.3 var(--font-brand); color: var(--status-expired); }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveBusiness implements OnChanges {
  readonly businessId = input.required<number>();
  private readonly list = inject(ListSavedBusinessesUseCase);
  private readonly saveBusiness = inject(SaveBusinessUseCase);
  private readonly removeBusiness = inject(RemoveSavedBusinessUseCase);
  readonly busy = signal(true);
  readonly saved = signal(false);
  readonly error = signal<string | null>(null);

  /** Another offer of another business reuses this button: forget the old state before asking. */
  ngOnChanges(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const id = this.businessId();
    this.saved.set(false);
    this.busy.set(true);
    this.error.set(null);
    try {
      const items = await this.list.execute();
      if (id === this.businessId()) this.saved.set(items.some((business) => business.businessId === id));
    } catch (error) {
      if (id === this.businessId()) this.error.set(error instanceof ApiError ? error.message : 'savedBusinesses.error');
    } finally {
      if (id === this.businessId()) this.busy.set(false);
    }
  }

  async toggle(): Promise<void> {
    if (this.busy()) return;
    const id = this.businessId();
    this.busy.set(true);
    this.error.set(null);
    try {
      if (this.saved()) await this.removeBusiness.execute(id);
      else await this.saveBusiness.execute(id);
      if (id === this.businessId()) this.saved.update((value) => !value);
    } catch (error) {
      if (id === this.businessId()) this.error.set(error instanceof ApiError ? error.message : 'savedBusinesses.error');
    } finally {
      if (id === this.businessId()) this.busy.set(false);
    }
  }
}
