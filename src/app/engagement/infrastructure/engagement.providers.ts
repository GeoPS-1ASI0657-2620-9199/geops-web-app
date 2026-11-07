import { ReviewRepository } from '../domain/ports/review.repository';
import { HttpReviewRepository } from './http-review.repository';
import { FollowRepository } from '../domain/ports/follow.repository';
import { HttpFollowRepository } from './http-follow.repository';
import { Provider } from '@angular/core';
import { SavedOfferRepository } from '../domain/ports/saved-offer.repository';
import { HttpSavedOfferRepository } from './http-saved-offer.repository';

/** Adapters of the engagement context, registered once in app.config.ts. */
export const engagementProviders: Provider[] = [
  { provide: ReviewRepository, useClass: HttpReviewRepository },
  { provide: FollowRepository, useClass: HttpFollowRepository },
  { provide: SavedOfferRepository, useClass: HttpSavedOfferRepository },
];
