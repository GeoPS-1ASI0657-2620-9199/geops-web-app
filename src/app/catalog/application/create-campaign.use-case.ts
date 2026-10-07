import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import { CampaignDraft, CreatedCampaign, firstViolation, todayInLima } from '../domain/model/campaign';
import { CampaignRepository } from '../domain/ports/campaign.repository';

const MESSAGES: Record<string, string> = {
  CAMPAIGN_ALREADY_ENDED: 'La vigencia que elegiste ya pasó. Elige una fecha de fin desde hoy.',
  INVALID_CAMPAIGN_PERIOD: 'La fecha de fin no puede ser anterior a la de inicio.',
  INVALID_CAMPAIGN_ZONE: 'Revisa la zona: el radio va de 400 m a 5 km y el distrito debe estar elegido.',
  OFFER_VALIDITY_OUTSIDE_CAMPAIGN: 'Cada oferta debe vencer dentro de la vigencia de la campaña.',
  CAMPAIGN_WITHOUT_OFFERS: 'Agrega al menos una oferta para que la campaña aparezca en la búsqueda.',
  INVALID_STORE_LOCATION: 'Marca en el mapa dónde está tu local.',
};

/** Publishes a campaign with its zone and offers (US05, US06), checking the rules first. */
@Injectable({ providedIn: 'root' })
export class CreateCampaignUseCase {
  private readonly campaigns = inject(CampaignRepository);

  execute(draft: CampaignDraft, now: Date = new Date()): Promise<CreatedCampaign> {
    const violation = firstViolation(draft, todayInLima(now));
    if (violation) {
      return Promise.reject(new ApiError(violation, MESSAGES[violation]));
    }
    return this.campaigns.create({
      ...draft,
      businessName: draft.businessName.trim(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      storeLocation: { ...draft.storeLocation, address: draft.storeLocation.address.trim() },
      offers: draft.offers.map((offer) => ({
        ...offer,
        title: offer.title.trim(),
        conditions: offer.conditions.trim(),
        category: offer.category.trim(),
      })),
    });
  }
}
