import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Campaign } from '../domain/model/campaign.entity';
import { CampaignOffer } from '../domain/model/offer.entity';
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
import { CampaignAssembler, OfferAssembler } from './campaign-assembler';
import { environment } from '../../../environments/environment';

/**
 * Campaign API Endpoint
 *
 * Handles HTTP requests to the Campaign API.
 * Provides methods for CRUD operations on campaigns and their associated offers.
 */
@Injectable({
  providedIn: 'root',
})
export class CampaignApiEndpoint extends BaseApiEndpoint<
  Campaign,
  CampaignResource,
  CampaignResponse,
  CampaignAssembler
> {
  private readonly offerAssembler = new OfferAssembler();

  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}/campaigns`, new CampaignAssembler());
  }

  /**
   * Get all campaigns by user ID
   */
  getByUserId(userId: number): Observable<Campaign[]> {
    return this.http
      .get<CampaignResource[]>(`${this.endpointUrl}/user/${userId}/campaigns`)
      .pipe(map((resources) => resources.map((r) => this.assembler.toEntityFromResource(r))));
  }

  /**
   * Create a new campaign
   */
  createCampaign(campaign: Partial<Campaign>): Observable<Campaign> {
    const resource = this.assembler.toCreateResource(campaign);
    return this.http
      .post<CampaignResource>(this.endpointUrl, resource)
      .pipe(map((r) => this.assembler.toEntityFromResource(r)));
  }

  /**
   * Update an existing campaign (PATCH)
   */
  updateCampaign(id: number, campaign: Partial<Campaign>): Observable<Campaign> {
    const resource = this.assembler.toUpdateResource(campaign);
    return this.http
      .patch<CampaignResource>(`${this.endpointUrl}/${id}`, resource)
      .pipe(map((r) => this.assembler.toEntityFromResource(r)));
  }

  /**
   * Delete a campaign
   */
  deleteCampaign(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${id}`);
  }

  // ==================== OFFER OPERATIONS ====================

  /**
   * Get all offers for a campaign
   */
  getOffersByCampaignId(campaignId: number): Observable<CampaignOffer[]> {
    return this.http
      .get<OfferResource[]>(
        `${environment.platformProviderApiBaseUrl}/offers/campaign/${campaignId}`
      )
      .pipe(map((resources) => resources.map((r) => this.offerAssembler.toEntityFromResource(r))));
  }

  /**
   * Get a single offer by ID
   */
  getOfferById(offerId: number): Observable<CampaignOffer> {
    return this.http
      .get<OfferResource>(`${environment.platformProviderApiBaseUrl}/offers/${offerId}`)
      .pipe(map((r) => this.offerAssembler.toEntityFromResource(r)));
  }

  /**
   * Create a new offer
   */
  createOffer(offer: Partial<CampaignOffer>): Observable<CampaignOffer> {
    const resource = this.offerAssembler.toCreateResource(offer);
    return this.http
      .post<OfferResource>(`${environment.platformProviderApiBaseUrl}/offers`, resource)
      .pipe(map((r) => this.offerAssembler.toEntityFromResource(r)));
  }

  /**
   * Update an existing offer
   */
  updateOffer(offerId: number, offer: Partial<CampaignOffer>): Observable<CampaignOffer> {
    const resource = this.offerAssembler.toUpdateResource(offer);
    return this.http
      .put<OfferResource>(`${environment.platformProviderApiBaseUrl}/offers/${offerId}`, resource)
      .pipe(map((r) => this.offerAssembler.toEntityFromResource(r)));
  }

  /**
   * Delete an offer
   */
  deleteOffer(offerId: number): Observable<void> {
    return this.http.delete<void>(`${environment.platformProviderApiBaseUrl}/offers/${offerId}`);
  }
}
