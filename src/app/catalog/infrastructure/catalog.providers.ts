import { Provider } from '@angular/core';
import { CampaignRepository } from '../domain/ports/campaign.repository';
import { DistrictDirectory } from '../domain/ports/district.directory';
import { LocationProvider } from '../domain/ports/location.provider';
import { OfferRepository } from '../domain/ports/offer.repository';
import { RadiusPreferenceGateway } from '../domain/ports/radius-preference.gateway';
import { RadiusPreferenceStore } from '../domain/ports/radius-preference.store';
import { BrowserRadiusPreferenceStore } from './browser-radius-preference.store';
import { BrowserLocationProvider } from './browser-location.provider';
import { HttpCampaignRepository } from './http-campaign.repository';
import { HttpOfferRepository } from './http-offer.repository';
import { HttpRadiusPreferenceGateway } from './http-radius-preference.gateway';
import { StaticDistrictDirectory } from './static-district.directory';

/** Adapters of the catalog context, registered once in app.config.ts. */
export const catalogProviders: Provider[] = [
  { provide: OfferRepository, useClass: HttpOfferRepository },
  { provide: CampaignRepository, useClass: HttpCampaignRepository },
  { provide: LocationProvider, useClass: BrowserLocationProvider },
  { provide: DistrictDirectory, useClass: StaticDistrictDirectory },
  { provide: RadiusPreferenceStore, useClass: BrowserRadiusPreferenceStore },
  { provide: RadiusPreferenceGateway, useClass: HttpRadiusPreferenceGateway },
];
