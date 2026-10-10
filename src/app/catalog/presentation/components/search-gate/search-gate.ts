import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { OfferSearchStore } from '../../../application/offer-search.store';
import { DistrictPicker } from '../district-picker/district-picker';

/**
 * States every buyer tab shares before it can show offers (Figma 3, 23, 24 and 25): locating, picking
 * a district, no offers in the radius and no connection. Once there are offers, or while they load,
 * it shows its content.
 */
@Component({
  selector: 'app-search-gate',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, TranslateModule, GeoAlert, GeoEmptyState, DistrictPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (search.state()) {
      @case ('idle') {}
      @case ('locating') {
        <geo-empty-state
          icon="my_location"
          [title]="'nearbyPage.locating.title' | translate"
          [description]="'nearbyPage.locating.description' | translate" />
      }
      @case ('pick-district') {
        @if (search.pickReason() === 'IMPRECISE') {
          <geo-alert
            kind="warning"
            [title]="'nearbyPage.imprecise.title' | translate: { meters: (search.imprecision() | number: '1.0-0') }"
            [description]="'nearbyPage.imprecise.description' | translate" />
        }
        <app-district-picker
          [title]="pickTitle() | translate"
          [description]="pickDescription() ? (pickDescription()! | translate) : null"
          [selected]="search.origin()?.districtName ?? null"
          [canRetryGps]="search.pickReason() !== 'INSECURE_CONTEXT'"
          (districtSelected)="search.chooseDistrict($event)"
          (retryGps)="search.useDeviceLocation()" />
      }
      @case ('empty') {
        <geo-empty-state
          icon="search_off"
          [title]="'nearbyPage.empty.title' | translate: { minutes: search.radius() }"
          [description]="'nearbyPage.empty.description' | translate">
          @if (search.nextRadius(); as next) {
            <button mat-flat-button type="button" (click)="search.widenRadius()">
              {{ 'nearbyPage.empty.widen' | translate: { minutes: next } }}
            </button>
          }
          <button mat-stroked-button type="button" (click)="search.changeDistrict()">
            {{ 'search.changeDistrict' | translate }}
          </button>
        </geo-empty-state>
      }
      @case ('error') {
        <geo-empty-state
          icon="cloud_off"
          [title]="'nearbyPage.error.title' | translate"
          [description]="search.errorMessage() ?? ('nearbyPage.error.description' | translate)">
          <button mat-flat-button type="button" (click)="search.retry()">{{ 'nearbyPage.error.retry' | translate }}</button>
        </geo-empty-state>
      }
      @default {
        <ng-content />
      }
    }
  `,
  styles: [`:host { display: flex; flex-direction: column; gap: 18px; }`],
})
export class SearchGate {
  protected readonly search = inject(OfferSearchStore);

  protected readonly pickTitle = computed(() => {
    const reason = this.search.pickReason();
    return reason && reason !== 'IMPRECISE' ? 'nearbyPage.pick.noLocationTitle' : 'nearbyPage.pick.title';
  });
  protected readonly pickDescription = computed(() => {
    const reason = this.search.pickReason();
    return reason && reason !== 'IMPRECISE' ? `nearbyPage.pick.reason.${reason}` : null;
  });
}
