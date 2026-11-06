import { ReviewRepository } from '../domain/ports/review.repository';
import { HttpReviewRepository } from './http-review.repository';
import { Provider } from '@angular/core';
import { SavedOfferRepository } from '../domain/ports/saved-offer.repository';
import { HttpSavedOfferRepository } from './http-saved-offer.repository';

/** Adapters of the engagement context, registered once in app.config.ts. */
export const engagementProviders: Provider[] = [
  { provide: ReviewRepository, useClass: HttpReviewRepository },
  { provide: SavedOfferRepository, useClass: HttpSavedOfferRepository },
];
