import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { GeoPoint } from '../../domain/geo-point';

/** A business on the map: green when verified, amber when it comes from a public source. */
export interface MapPin {
  readonly id: number;
  readonly point: GeoPoint;
  readonly icon: string;
  readonly label: string;
  readonly kind: 'verified' | 'reference';
}

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_ZOOM = 15;
const MAX_ZOOM = 19;
/** Outer rings of the Figma map, as fractions of the search radius. */
const RING_FRACTIONS = [1, 0.66, 0.33];

/**
 * Map of the Figma "Mapa" component: OpenStreetMap tiles, the user's position as a blue dot with a
 * white border, dashed green rings with a soft halo for the walking radius, and 34 px pins with the
 * category icon. Clicking a pin emits its id.
 */
@Component({
  selector: 'geo-offers-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame">
      <div #mapHost class="map" role="region" [attr.aria-label]="ariaLabel()"></div>
      @if (precisionLabel(); as label) {
        <span class="precision">{{ label }}</span>
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      :host { display: block; height: 300px; }
      .frame { position: relative; width: 100%; height: 100%; border-radius: var(--radius-card); overflow: hidden; }
      .map { width: 100%; height: 100%; }
      .precision {
        position: absolute;
        left: 14px;
        bottom: 14px;
        z-index: 500;
        padding: 6px 12px;
        border-radius: var(--radius-input);
        background: var(--neutral-bg);
        box-shadow: 0 1px 4px rgba(26, 20, 32, 0.12);
        font: 400 11px/1.3 var(--font-brand);
        color: var(--text-primary);
      }
      :host ::ng-deep .geo-pin {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 3px solid #fff;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(26, 20, 32, 0.25);
        color: #fff;
        font-family: 'Material Symbols Rounded';
        font-size: 18px;
        line-height: 1;
      }
      :host ::ng-deep .geo-pin.verified { background: var(--status-verified); }
      :host ::ng-deep .geo-pin.reference { background: var(--status-reference); }
      :host ::ng-deep .geo-user {
        width: 16px;
        height: 16px;
        border: 3px solid #fff;
        border-radius: 50%;
        background: var(--status-user);
        box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.35);
      }
    `,
  ],
})
export class GeoOffersMap implements AfterViewInit, OnDestroy {
  /** Where the consumer stands; the map centers there. */
  readonly center = input<GeoPoint | null>(null);
  readonly radiusMeters = input<number | null>(null);
  readonly pins = input<readonly MapPin[]>([]);
  /** Precision label shown at the bottom left, e.g. "Precisión ±12 m". */
  readonly precisionLabel = input<string | null>(null);
  readonly ariaLabel = input('Mapa de ofertas cercanas');
  /** Draws the user's dot; off when the map shows a business location only. */
  readonly showUser = input(true);
  readonly pinSelected = output<number>();

  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>('mapHost');
  private map?: L.Map;
  private overlays?: L.LayerGroup;
  private resizeObserver?: ResizeObserver;

  constructor() {
    effect(() => {
      this.center();
      this.radiusMeters();
      this.pins();
      this.draw();
    });
  }

  ngAfterViewInit(): void {
    const start = this.center() ?? { latitude: -12.0464, longitude: -77.0428 };
    this.map = L.map(this.mapHost().nativeElement, {
      center: [start.latitude, start.longitude],
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false,
      zoomControl: false,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer(OSM_TILES, { maxZoom: MAX_ZOOM, attribution: OSM_ATTRIBUTION }).addTo(this.map);
    this.overlays = L.layerGroup().addTo(this.map);
    this.draw();
    // Leaflet measures its container once; when the layout gives it its real size, redraw and refit.
    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize();
      this.fit(this.center(), this.radiusMeters());
    });
    this.resizeObserver.observe(this.mapHost().nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private draw(): void {
    if (!this.map || !this.overlays) {
      return;
    }
    this.overlays.clearLayers();
    const center = this.center();
    const radius = this.radiusMeters();
    const green = this.token('--status-verified', '#0E9F6E');
    if (center) {
      const latlng = L.latLng(center.latitude, center.longitude);
      if (radius) {
        RING_FRACTIONS.forEach((fraction, index) =>
          L.circle(latlng, {
            radius: radius * fraction,
            color: green,
            weight: 1.5,
            opacity: 0.9 - index * 0.25,
            dashArray: '6 5',
            fillColor: green,
            fillOpacity: index === RING_FRACTIONS.length - 1 ? 0.08 : 0,
            interactive: false,
          }).addTo(this.overlays!),
        );
      }
      if (this.showUser()) {
        L.marker(latlng, {
          icon: L.divIcon({ className: '', html: '<div class="geo-user"></div>', iconSize: [16, 16] }),
          keyboard: false,
          interactive: false,
        }).addTo(this.overlays);
      }
    }
    for (const pin of this.pins()) {
      const marker = L.marker([pin.point.latitude, pin.point.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div class="geo-pin ${pin.kind}" aria-hidden="true">${pin.icon}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        title: pin.label,
        alt: pin.label,
      });
      marker.on('click', () => this.pinSelected.emit(pin.id));
      marker.addTo(this.overlays);
    }
    this.fit(center, radius);
  }

  /** Shows the whole radius, or every pin when there is no consumer position. */
  private fit(center: GeoPoint | null, radius: number | null): void {
    const size = this.map?.getSize();
    if (!this.map || !size || size.x === 0 || size.y === 0) {
      return;
    }
    if (center && radius) {
      const bounds = L.latLng(center.latitude, center.longitude).toBounds(radius * 2.3);
      this.map.fitBounds(bounds, { animate: false });
    } else if (center) {
      this.map.setView([center.latitude, center.longitude], DEFAULT_ZOOM, { animate: false });
    } else if (this.pins().length) {
      const bounds = L.latLngBounds(this.pins().map((p) => [p.point.latitude, p.point.longitude]));
      this.map.fitBounds(bounds.pad(0.3), { animate: false, maxZoom: 16 });
    }
  }

  private token(name: string, fallback: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }
}
