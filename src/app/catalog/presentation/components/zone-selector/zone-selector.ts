import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { GeoPoint } from '../../../../shared/domain/geo-point';
import { GeoLocationPicker } from '../../../../shared/ui/geo-location-picker/geo-location-picker';
import {
  CampaignZone,
  DEFAULT_ZONE_RADIUS_METERS,
  MAX_ZONE_RADIUS_METERS,
  MIN_ZONE_RADIUS_METERS,
} from '../../../domain/model/campaign';
import { LimaDistrict } from '../../../domain/model/lima-district';
import { DistrictSelector } from '../district-selector/district-selector';

const RADIUS_STEP_METERS = 100;

/**
 * Who sees the campaign (US06, GEO-123; Figma screens 7 and 37): a radius drawn around the store
 * on the map, or a Lima district with its center. Emits null while the zone is incomplete.
 */
@Component({
  selector: 'app-zone-selector',
  standalone: true,
  imports: [DecimalPipe, MatButtonToggleModule, MatSliderModule, GeoLocationPicker, DistrictSelector],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="zone">
      <mat-button-toggle-group
        [value]="type()"
        (change)="setType($event.value)"
        aria-label="Tipo de zona"
        hideSingleSelectionIndicator>
        <mat-button-toggle value="RADIUS">Por radio</mat-button-toggle>
        <mat-button-toggle value="DISTRICT">Por distrito</mat-button-toggle>
      </mat-button-toggle-group>

      @if (type() === 'RADIUS') {
        <div class="radius">
          <span class="geo-body-strong">Hasta dónde quieres llegar</span>
          <span class="value geo-tabular">{{ radius() | number: '1.0-0' }} m</span>
        </div>
        <mat-slider [min]="min" [max]="max" [step]="step" class="slider">
          <input matSliderThumb [value]="radius()" (valueChange)="setRadius($event)" aria-label="Radio en metros" />
        </mat-slider>
        <geo-location-picker class="map" [point]="center()" [radiusMeters]="radius()" [readOnly]="true" />
        @if (!center()) {
          <p class="geo-meta">Marca primero la ubicación del local para dibujar la zona.</p>
        }
      } @else {
        <app-district-selector [selected]="district()?.name ?? null" (districtSelected)="setDistrict($event)" />
        <p class="geo-meta">Solo la ven quienes buscan desde ese distrito.</p>
      }
    </div>
  `,
  styles: [
    `
      .zone { display: flex; flex-direction: column; gap: var(--space-md); }
      .radius { display: flex; justify-content: space-between; }
      .value { font: 600 13px/1.45 var(--font-brand); color: var(--brand-deep); }
      .slider { width: 100%; margin: 0; }
      .map { height: 240px; }
      .geo-meta { margin: 0; }
    `,
  ],
})
export class ZoneSelector {
  protected readonly min = MIN_ZONE_RADIUS_METERS;
  protected readonly max = MAX_ZONE_RADIUS_METERS;
  protected readonly step = RADIUS_STEP_METERS;

  /** Store location: the center of a radius zone. */
  readonly center = input<GeoPoint | null>(null);
  readonly zoneChange = output<CampaignZone | null>();

  protected readonly type = signal<'RADIUS' | 'DISTRICT'>('RADIUS');
  protected readonly radius = signal(DEFAULT_ZONE_RADIUS_METERS);
  protected readonly district = signal<LimaDistrict | null>(null);
  protected readonly zone = computed<CampaignZone | null>(() => {
    if (this.type() === 'DISTRICT') {
      const district = this.district();
      return district ? { type: 'DISTRICT', district: district.name, center: district.center } : null;
    }
    const center = this.center();
    return center ? { type: 'RADIUS', center, radiusMeters: this.radius() } : null;
  });

  constructor() {
    // A radius zone follows the store point, so the zone is emitted whenever any input changes.
    effect(() => this.zoneChange.emit(this.zone()));
  }

  setType(type: 'RADIUS' | 'DISTRICT'): void {
    this.type.set(type);
  }

  setRadius(meters: number): void {
    this.radius.set(meters);
  }

  setDistrict(district: LimaDistrict): void {
    this.district.set(district);
  }
}
