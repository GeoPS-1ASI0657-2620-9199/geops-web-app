import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Base URL of the GeoPS gateway. Every adapter builds its URLs from it; none calls a service port. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
