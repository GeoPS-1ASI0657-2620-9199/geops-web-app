import { Injectable, inject } from '@angular/core';
import { OfferDetail } from '../domain/model/offer-detail';
import { OfferRepository } from '../domain/ports/offer.repository';

/** Price, validity, conditions and location of one offer (US04). */
@Injectable({ providedIn: 'root' })
export class GetOfferDetailUseCase {
  private readonly offers = inject(OfferRepository);

  /** trackClick is only for the detail page a buyer opens: it counts a click for the campaign metrics. */
  execute(offerId: number, trackClick = false): Promise<OfferDetail> {
    return trackClick ? this.offers.findById(offerId, { trackClick: true }) : this.offers.findById(offerId);
  }
}
