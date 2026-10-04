import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Campaign } from '../domain/model/campaign.entity';
import { CampaignOffer } from '../domain/model/offer.entity';
import { calculateCtr } from '../domain/utils/campaign-metrics.util';
import {
  CampaignResource,
  CampaignResponse,
  CreateCampaignResource,
  UpdateCampaignResource,
  OfferResource,
  OfferResponse,
  CreateOfferResource,
  UpdateOfferResource
} from './campaign-response';

/**
 * Campaign Assembler
 *
 * Converts between Campaign entities and API resources.
 * Implements the BaseAssembler interface for type safety.
 */
export class CampaignAssembler implements BaseAssembler<Campaign, CampaignResource, CampaignResponse> {

  /**
   * Converts API resource to domain entity
   */
  toEntityFromResource(resource: CampaignResource): Campaign {
    const totalImpressions = resource.totalImpressions ?? 0;
    const totalClicks = resource.totalClicks ?? 0;

    return {
      id: resource.id,
      userId: resource.userId,
      name: resource.name,
      description: resource.description,
      startDate: resource.startDate,
      endDate: resource.endDate,
      status: resource.status as 'ACTIVE' | 'PAUSED' | 'FINALIZED',
      estimatedBudget: resource.estimatedBudget,
      totalImpressions,
      totalClicks,
      CTR: calculateCtr(totalClicks, totalImpressions),
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  /**
   * Converts domain entity to API resource
   */
  toResourceFromEntity(entity: Campaign): CampaignResource {
    const totalImpressions = entity.totalImpressions ?? 0;
    const totalClicks = entity.totalClicks ?? 0;

    return {
      id: entity.id,
      userId: entity.userId,
      name: entity.name,
      description: entity.description,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      estimatedBudget: entity.estimatedBudget,
      totalImpressions,
      totalClicks,
      CTR: calculateCtr(totalClicks, totalImpressions),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Converts API response to array of domain entities
   */
  toEntitiesFromResponse(response: CampaignResponse): Campaign[] {
    if (!Array.isArray(response.data)) {
      return [this.toEntityFromResource(response.data)];
    }
    return response.data.map(resource => this.toEntityFromResource(resource));
  }

  /**
   * Converts create command to API resource
   */
  toCreateResource(entity: Partial<Campaign>): CreateCampaignResource {
    return {
      userId: entity.userId!,
      name: entity.name!,
      description: entity.description!,
      startDate: entity.startDate!,
      endDate: entity.endDate!,
      status: entity.status || 'PAUSED',
      estimatedBudget: entity.estimatedBudget || 0
    };
  }

  /**
   * Converts update command to API resource
   * IMPORTANT: Backend requires all mandatory fields in PATCH request
   */
  toUpdateResource(entity: Partial<Campaign>): UpdateCampaignResource {
    // Backend requires all these fields to be present in PATCH
    return {
      name: entity.name!,
      description: entity.description!,
      startDate: entity.startDate!,
      endDate: entity.endDate!,
      status: entity.status!,
      estimatedBudget: entity.estimatedBudget!,
      // Optional fields
      ...(entity.totalImpressions !== undefined && { totalImpressions: entity.totalImpressions }),
      ...(entity.totalClicks !== undefined && { totalClicks: entity.totalClicks }),
      ...(entity.CTR !== undefined && { ctr: 0 })
    };
  }
}

/**
 * Offer Assembler
 *
 * Converts between Offer entities and API resources.
 */
export class OfferAssembler implements BaseAssembler<CampaignOffer, OfferResource, OfferResponse> {

  private normalizeDate(value?: string | Date | null): string | undefined {
    if (!value) return undefined;
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  }

  /**
   * Converts API resource to domain entity
   */
  toEntityFromResource(resource: OfferResource): CampaignOffer {
    return {
      id: resource.id,
      campaignId: resource.campaignId,
      title: resource.title,
      partner: resource.partner,
      price: resource.price,
      originalPrice: resource.originalPrice,
      description: resource.description,
      category: resource.category,
      location: resource.location,
      latitude: resource.latitude,
      longitude: resource.longitude,
      imageUrl: resource.imageUrl,
      validUntil: resource.validTo,
      codePrefix: resource.codePrefix,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      rating: resource.rating,
    };
  }

  /**
   * Converts domain entity to API resource
   */
  toResourceFromEntity(entity: CampaignOffer): OfferResource {
    return {
      id: entity.id,
      campaignId: entity.campaignId,
      title: entity.title,
      partner: entity.partner,
      price: entity.price,
      originalPrice: entity.originalPrice,
      description: entity.description,
      category: entity.category,
      location: entity.location,
      latitude: entity.latitude,
      longitude: entity.longitude,
      imageUrl: entity.imageUrl,
      validTo: this.normalizeDate(entity.validUntil),
      codePrefix: entity.codePrefix,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      rating: entity.rating,
    };
  }

  /**
   * Converts API response to array of domain entities
   */
  toEntitiesFromResponse(response: OfferResponse): CampaignOffer[] {
    if (!Array.isArray(response.data)) {
      return [this.toEntityFromResource(response.data)];
    }
    return response.data.map(resource => this.toEntityFromResource(resource));
  }

  /**
   * Converts create command to API resource
   */
  toCreateResource(entity: Partial<CampaignOffer>): CreateOfferResource {
    return {
      campaignId: entity.campaignId!,
      title: entity.title!,
      partner: entity.partner!,
      price: entity.price!,
      originalPrice: entity.originalPrice,
      description: entity.description,
      category: entity.category,
      location: entity.location,
      latitude: entity.latitude,
      longitude: entity.longitude,
      imageUrl: entity.imageUrl,
      validTo: this.normalizeDate(entity.validUntil),
      codePrefix: entity.codePrefix,
      rating: entity.rating || 0,
    };
  }

  /**
   * Converts update command to API resource
   */
  toUpdateResource(entity: Partial<CampaignOffer>): UpdateOfferResource {
    const resource: UpdateOfferResource = {};

    if (entity.title !== undefined) resource.title = entity.title;
    if (entity.partner !== undefined) resource.partner = entity.partner;
    if (entity.price !== undefined) resource.price = entity.price;
    if (entity.originalPrice !== undefined) resource.originalPrice = entity.originalPrice;
    if (entity.description !== undefined) resource.description = entity.description;
    if (entity.category !== undefined) resource.category = entity.category;
    if (entity.location !== undefined) resource.location = entity.location;
    if (entity.latitude !== undefined) resource.latitude = entity.latitude;
    if (entity.longitude !== undefined) resource.longitude = entity.longitude;
    if (entity.imageUrl !== undefined) resource.imageUrl = entity.imageUrl;
    if (entity.validUntil !== undefined) resource.validTo = this.normalizeDate(entity.validUntil);
    if (entity.codePrefix !== undefined) resource.codePrefix = entity.codePrefix;

    return resource;
  }
}
