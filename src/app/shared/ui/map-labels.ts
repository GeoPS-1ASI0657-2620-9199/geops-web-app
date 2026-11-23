import { TranslateService } from '@ngx-translate/core';

/** Texts Leaflet would otherwise show in English ("Zoom in", "Zoom out", "Marker"). */
export interface MapLabels {
  readonly zoomIn: string;
  readonly zoomOut: string;
  readonly location: string;
}

/** Used when the translations are not loaded yet; GeoPS speaks Spanish first. */
const SPANISH: MapLabels = { zoomIn: 'Acercar', zoomOut: 'Alejar', location: 'Ubicación' };

export function mapLabels(translate: TranslateService | null): MapLabels {
  const pick = (key: string, fallback: string): string => {
    const text: unknown = translate?.instant(key);
    return typeof text === 'string' && text !== key ? text : fallback;
  };
  return {
    zoomIn: pick('map.zoomIn', SPANISH.zoomIn),
    zoomOut: pick('map.zoomOut', SPANISH.zoomOut),
    location: pick('map.location', SPANISH.location),
  };
}
