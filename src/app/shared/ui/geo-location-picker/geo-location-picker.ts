import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';

/** Point chosen on the map, in decimal degrees. */
export interface PickedPoint {
  latitude: number;
  longitude: number;
}

const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAX_ZOOM = 19;
const DEFAULT_ZOOM = 15;
/** Center of Lima, the starting view when no point is given. */
const LIMA_CENTER: PickedPoint = { latitude: -12.0464, longitude: -77.0428 };
/** Used only if the design tokens are not loaded. */
const RADIUS_FALLBACK_COLOR = '#0E9F6E';

/**
 * Explicit marker icon copied to /leaflet by angular.json. Leaflet's default icon prefixes the
 * path it guesses from its CSS, which the bundler moves to /media, so the image never loads.
 * Absolute URLs also keep working on nested routes such as /offers/1052.
 */
const MARKER_ICON = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

/**
 * Map with OpenStreetMap tiles where the user places a single point by clicking or dragging
 * the marker. Optionally draws a radius around the point. With readOnly it only shows the point.
 */
@Component({
  selector: 'geo-location-picker',
  standalone: true,
  template: `<div #mapHost class="geo-location-picker" role="application"
                  aria-label="Mapa para elegir la ubicación"></div>`,
  styles: [
    `:host { display: block; height: 280px; }
     .geo-location-picker { width: 100%; height: 100%;
       border-radius: var(--radius-card, 10px); overflow: hidden; }`,
  ],
})
export class GeoLocationPicker implements AfterViewInit, OnDestroy {
  /** Point to show at start; when empty the map opens on Lima without a marker. */
  readonly point = input<PickedPoint | null>(null);
  /** Radius in meters drawn around the point. */
  readonly radiusMeters = input<number | null>(null);
  readonly readOnly = input(false);
  readonly pointSelected = output<PickedPoint>();

  private readonly mapHost = viewChild.required<ElementRef<HTMLDivElement>>('mapHost');
  private map?: L.Map;
  private resizeObserver?: ResizeObserver;
  private marker?: L.Marker;
  private circle?: L.Circle;

  constructor() {
    effect(() => {
      const p = this.point();
      if (this.map && p) {
        this.placeMarker(p);
      }
    });
    effect(() => {
      this.radiusMeters();
      this.drawRadius();
    });
  }

  ngAfterViewInit(): void {
    const start = this.point() ?? LIMA_CENTER;
    this.map = L.map(this.mapHost().nativeElement, {
      center: [start.latitude, start.longitude],
      zoom: DEFAULT_ZOOM,
    });
    L.tileLayer(OSM_TILES, { maxZoom: MAX_ZOOM, attribution: OSM_ATTRIBUTION }).addTo(this.map);

    const p = this.point();
    if (p) {
      this.placeMarker(p);
    }
    if (!this.readOnly()) {
      this.map.on('click', (event: L.LeafletMouseEvent) => this.select(event.latlng));
    }
    // Leaflet measures its container once; redraw the tiles when the layout changes its size.
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(this.mapHost().nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private select(latlng: L.LatLng): void {
    const picked = { latitude: latlng.lat, longitude: latlng.lng };
    this.placeMarker(picked);
    this.pointSelected.emit(picked);
  }

  private placeMarker(p: PickedPoint): void {
    if (!this.map) {
      return;
    }
    const latlng = L.latLng(p.latitude, p.longitude);
    if (this.marker) {
      this.marker.setLatLng(latlng);
    } else {
      this.marker = L.marker(latlng, { draggable: !this.readOnly(), icon: MARKER_ICON }).addTo(this.map);
      this.marker.on('dragend', () => this.select(this.marker!.getLatLng()));
    }
    this.map.panTo(latlng);
    this.drawRadius();
  }

  private drawRadius(): void {
    const radius = this.radiusMeters();
    this.circle?.remove();
    this.circle = undefined;
    if (!this.map || !this.marker || !radius) {
      return;
    }
    const color =
      getComputedStyle(document.documentElement).getPropertyValue('--status-verified').trim() ||
      RADIUS_FALLBACK_COLOR;
    this.circle = L.circle(this.marker.getLatLng(), {
      radius,
      color,
      weight: 1.5,
      dashArray: '6 4',
      fillOpacity: 0.08,
    }).addTo(this.map);
  }
}
