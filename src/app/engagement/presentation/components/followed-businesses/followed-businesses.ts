import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ListFollowedBusinessesUseCase, UnfollowBusinessUseCase } from '../../../application/follows.use-cases';
import { FollowedBusiness } from '../../../domain/model/followed-business';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';

/** "Comercios que sigo" tab of "Mis Favoritos" (US13, Figma screen 29). */
@Component({
  selector: 'app-followed-businesses',
  imports: [RouterLink, MatButtonModule, TranslateModule, GeoAlert, GeoEmptyState],
  template: `<section [attr.aria-busy]="loading()">
    @if (error(); as message) {
      <geo-alert kind="error" [title]="message | translate">
        <button mat-stroked-button type="button" (click)="load()">{{ 'followsPage.retry' | translate }}</button>
      </geo-alert>
    }
    @if (loading()) {
      <div class="skeletons" role="status" [attr.aria-label]="'followsPage.loading' | translate">
        @for (s of [1, 2, 3]; track s) { <div class="skeleton"></div> }
      </div>
    } @else if (!error() && businesses().length === 0) {
      <geo-empty-state icon="storefront" [title]="'followsPage.empty' | translate" [description]="'followsPage.emptyHint' | translate">
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
              @if (business.activeOffersCount > 0) {
                <p class="meta count">{{ (business.activeOffersCount === 1 ? 'followsPage.countOne' : 'followsPage.count') | translate: { count: business.activeOffersCount } }}</p>
              } @else {
                <p class="meta count none">{{ 'followsPage.noOffers' | translate }}</p>
              }
            </div>
            @if (business.activeOffersCount > 0) {
              <a mat-stroked-button class="view" [routerLink]="['/offers', business.activeOffers[0].offerId]">{{ 'followsPage.viewOffers' | translate }}</a>
            }
            <button class="action" type="button" [disabled]="removing() !== null" (click)="remove(business.businessId)">
              {{ 'followsPage.unfollow' | translate }}<span class="sr-only"> {{ business.businessName }}</span>
            </button>
          </li>
        }
      </ul>
    }
  </section>`,
  styleUrl: '../business-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowedBusinesses implements OnInit {
  private readonly list = inject(ListFollowedBusinessesUseCase);
  private readonly unfollow = inject(UnfollowBusinessUseCase);
  readonly businesses = signal<FollowedBusiness[]>([]);
  readonly loading = signal(true);
  readonly removing = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  initial(name: string): string { return name.trim().charAt(0).toUpperCase(); }

  ngOnInit() { void this.load(); }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try { this.businesses.set(await this.list.execute()); }
    catch (error) { this.error.set(error instanceof ApiError ? error.message : 'followsPage.error'); }
    finally { this.loading.set(false); }
  }

  async remove(businessId: number) {
    if (this.removing() !== null) return;
    this.removing.set(businessId);
    this.error.set(null);
    try {
      await this.unfollow.execute(businessId);
      this.businesses.update(list => list.filter(b => b.businessId !== businessId));
    } catch (error) { this.error.set(error instanceof ApiError ? error.message : 'followsPage.error'); }
    finally { this.removing.set(null); }
  }
}
