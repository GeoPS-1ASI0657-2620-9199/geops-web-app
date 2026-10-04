import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { Offer } from '../../domain/model/offer.entity';
import { OfferResource, OffersResponse } from './offers-response';

export class OffersAssembler
  implements BaseAssembler<Offer, OfferResource, OffersResponse>
{
  /**
   * converts a resource received from the API to a domain entity
   * @param r - resource received from the API
   */
  toEntityFromResource(r: OfferResource): Offer {
    return { ...r };
  }

  /**
   * converts a domain entity to the resource format expected by the API
   * @param e - domain entity
   */
  toResourceFromEntity(e: Offer): OfferResource {
    return { ...e };
  }

  /**
   * converts an API "wrapper" response to an array of entities
   * @param _resp - API response
   */
  toEntitiesFromResponse(_resp: OffersResponse): Offer[] {
    return [];
  }
}
