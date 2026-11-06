import { SavedBusinessRepository } from '../domain/ports/saved-business.repository';
import { HttpSavedBusinessRepository } from './http-saved-business.repository';
import { Provider } from '@angular/core';
import { SavedOfferRepository } from '../domain/ports/saved-offer.repository';
import { HttpSavedOfferRepository } from './http-saved-offer.repository';

/** Adapters of the engagement context, registered once in app.config.ts. */
export const engagementProviders: Provider[] = [
  { provide: SavedBusinessRepository, useClass: HttpSavedBusinessRepository },
  { provide: SavedOfferRepository, useClass: HttpSavedOfferRepository },
];
