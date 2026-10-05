import { Provider } from '@angular/core';
import { CampaignRepository } from '../domain/ports/campaign.repository';
import { DistrictDirectory } from '../domain/ports/district.directory';
import { LocationProvider } from '../domain/ports/location.provider';
import { OfferRepository } from '../domain/ports/offer.repository';
import { BrowserLocationProvider } from './browser-location.provider';
import { HttpCampaignRepository } from './http-campaign.repository';
import { HttpOfferRepository } from './http-offer.repository';
import { StaticDistrictDirectory } from './static-district.directory';

/** Adapters of the catalog context, registered once in app.config.ts. */
export const catalogProviders: Provider[] = [
  { provide: OfferRepository, useClass: HttpOfferRepository },
  { provide: CampaignRepository, useClass: HttpCampaignRepository },
  { provide: LocationProvider, useClass: BrowserLocationProvider },
  { provide: DistrictDirectory, useClass: StaticDistrictDirectory },
];
