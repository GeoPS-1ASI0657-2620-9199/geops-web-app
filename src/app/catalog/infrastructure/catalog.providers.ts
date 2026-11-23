import { Provider } from '@angular/core';
import { CampaignMetricsRepository } from '../domain/ports/campaign-metrics.repository';
import { CampaignRepository } from '../domain/ports/campaign.repository';
import { DistrictDirectory } from '../domain/ports/district.directory';
import { DistrictPreferenceStore } from '../domain/ports/district-preference.store';
import { OfferImageUploader } from '../domain/ports/offer-image.uploader';
import { LocationProvider } from '../domain/ports/location.provider';
import { ModerationRepository } from '../domain/ports/moderation.repository';
import { OfferRepository } from '../domain/ports/offer.repository';
import { RadiusPreferenceGateway } from '../domain/ports/radius-preference.gateway';
import { RadiusPreferenceStore } from '../domain/ports/radius-preference.store';
import { BrowserRadiusPreferenceStore } from './browser-radius-preference.store';
import { BrowserDistrictPreferenceStore } from './browser-district-preference.store';
import { BrowserLocationProvider } from './browser-location.provider';
import { HttpCampaignMetricsRepository } from './http-campaign-metrics.repository';
import { HttpCampaignRepository } from './http-campaign.repository';
import { HttpOfferImageUploader } from './http-offer-image.uploader';
import { HttpModerationRepository } from './http-moderation.repository';
import { HttpOfferRepository } from './http-offer.repository';
import { HttpRadiusPreferenceGateway } from './http-radius-preference.gateway';
import { StaticDistrictDirectory } from './static-district.directory';

/** Adapters of the catalog context, registered once in app.config.ts. */
export const catalogProviders: Provider[] = [
  { provide: OfferRepository, useClass: HttpOfferRepository },
  { provide: CampaignRepository, useClass: HttpCampaignRepository },
  { provide: OfferImageUploader, useClass: HttpOfferImageUploader },
  { provide: ModerationRepository, useClass: HttpModerationRepository },
  { provide: CampaignMetricsRepository, useClass: HttpCampaignMetricsRepository },
  { provide: LocationProvider, useClass: BrowserLocationProvider },
  { provide: DistrictDirectory, useClass: StaticDistrictDirectory },
  { provide: RadiusPreferenceStore, useClass: BrowserRadiusPreferenceStore },
  { provide: DistrictPreferenceStore, useClass: BrowserDistrictPreferenceStore },
  { provide: RadiusPreferenceGateway, useClass: HttpRadiusPreferenceGateway },
];
