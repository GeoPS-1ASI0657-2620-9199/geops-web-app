import { Injectable, inject } from '@angular/core';
import { OfferDetail } from '../domain/model/offer-detail';
import { OfferRepository } from '../domain/ports/offer.repository';

/** Price, validity, conditions and location of one offer (US04). */
@Injectable({ providedIn: 'root' })
export class GetOfferDetailUseCase {
  private readonly offers = inject(OfferRepository);

  execute(offerId: number): Promise<OfferDetail> {
    return this.offers.findById(offerId);
  }
}
