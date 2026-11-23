import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ListSavedBusinessesUseCase, RemoveSavedBusinessUseCase } from '../../../application/saved-businesses.use-cases';
import { SavedBusiness } from '../../../domain/model/saved-business';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';

/** "Comercios guardados" tab of "Mis Favoritos" (US12), drawn with the same rows as the followed businesses (Figma 29). */
@Component({
  selector: 'app-saved-businesses',
  imports: [DatePipe, RouterLink, MatButtonModule, TranslateModule, GeoAlert, GeoEmptyState],
  template: `<section [attr.aria-busy]="loading()">
    @if (error(); as message) {
      <geo-alert kind="error" [title]="message | translate">
        <button mat-stroked-button type="button" (click)="load()">{{ 'savedBusinesses.retry' | translate }}</button>
      </geo-alert>
    }
    @if (loading()) {
      <div class="skeletons" role="status" [attr.aria-label]="'savedBusinesses.loading' | translate">
        @for (s of [1, 2, 3]; track s) { <div class="skeleton"></div> }
      </div>
    } @else if (!error() && businesses().length === 0) {
      <geo-empty-state icon="bookmark" [title]="'savedBusinesses.empty' | translate" [description]="'savedBusinesses.emptyHint' | translate">
        <a mat-flat-button routerLink="/offers">{{ 'favoritesPage.empty.action' | translate }}</a>
      </geo-empty-state>
    }
    @if (businesses().length > 0) {
      <ul class="list">
        @for (business of businesses(); track business.businessId) {
          <li class="row">
            <span class="avatar" aria-hidden="true">{{ initial(business.businessName) }}</span>
            <div class="name">
              <h2>{{ business.businessName }}</h2>
              @if (business.savedAt) { <p class="meta">{{ 'savedBusinesses.savedOn' | translate: { date: (business.savedAt | date: 'dd/MM/yyyy') } }}</p> }
            </div>
            <button class="action" type="button" [disabled]="busy() !== null" (click)="remove(business.businessId)">
              {{ 'savedBusinesses.remove' | translate }}<span class="sr-only"> {{ business.businessName }}</span>
            </button>
          </li>
        }
      </ul>
    }
  </section>`,
  styleUrl: '../business-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedBusinesses implements OnInit {
  private readonly list = inject(ListSavedBusinessesUseCase);
  private readonly removeBusiness = inject(RemoveSavedBusinessUseCase);
  readonly businesses = signal<SavedBusiness[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  initial(name: string): string { return name.trim().charAt(0).toUpperCase(); }
  ngOnInit() { void this.load(); }
  async load() {
    this.loading.set(true); this.error.set(null);
    try { this.businesses.set(await this.list.execute()); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'savedBusinesses.error'); }
    finally { this.loading.set(false); }
  }
  async remove(businessId: number) {
    if (this.busy() !== null) return;
    this.busy.set(businessId); this.error.set(null);
    try { await this.removeBusiness.execute(businessId); this.businesses.update(items => items.filter(b => b.businessId !== businessId)); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'savedBusinesses.error'); }
    finally { this.busy.set(null); }
  }
}
