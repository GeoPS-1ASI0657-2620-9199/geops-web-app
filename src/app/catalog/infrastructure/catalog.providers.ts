import { Provider } from '@angular/core';
import { DistrictDirectory } from '../domain/ports/district.directory';
import { LocationProvider } from '../domain/ports/location.provider';
import { OfferRepository } from '../domain/ports/offer.repository';
import { BrowserLocationProvider } from './browser-location.provider';
import { HttpOfferRepository } from './http-offer.repository';
import { StaticDistrictDirectory } from './static-district.directory';

/** Adapters of the catalog context, registered once in app.config.ts. */
export const catalogProviders: Provider[] = [
  { provide: OfferRepository, useClass: HttpOfferRepository },
  { provide: LocationProvider, useClass: BrowserLocationProvider },
  { provide: DistrictDirectory, useClass: StaticDistrictDirectory },
];
