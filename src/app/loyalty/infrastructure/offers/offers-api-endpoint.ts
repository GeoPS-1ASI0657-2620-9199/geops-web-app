import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Offer } from '../../domain/model/offer.entity';
import { OfferResource, OffersResponse } from './offers-response';
import { OffersAssembler } from './offers-assembler';
import { map, Observable, switchMap, forkJoin, of, catchError, take } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CampaignApiEndpoint } from '../../../campaign/infrastructure/campaign-api-endpoint';

@Injectable({ providedIn: 'root' })
export class OffersApiEndpoint extends BaseApiEndpoint<
  Offer,
  OfferResource,
  OffersResponse,
  OffersAssembler
> {
  /**
   * creates an instance of the offersApiEndpoint service
   * @param http - angular http client
   */
  constructor(http: HttpClient, private readonly campaignApi: CampaignApiEndpoint) {
    super(http, `${environment.platformProviderApiBaseUrl}/offers`, new OffersAssembler());
  }

  /**
   * Override getAll() to filter offers by active campaigns only
   */
  override getAll(): Observable<Offer[]> {
    return this.http.get<OfferResource[]>(this.endpointUrl).pipe(
      switchMap(offers => {
        if (!offers || offers.length === 0) {
          return of([]);
        }

        // Get unique campaign IDs
        const campaignIds = Array.from(new Set(offers.map(o => o.campaignId)));

        // Fetch all campaigns with error handling
        const campaignRequests = campaignIds.map(id =>
          this.http.get<any>(`${environment.platformProviderApiBaseUrl}/campaigns/${id}`).pipe(
            map(campaign => ({ id, status: campaign.status })),
            catchError(err => {
              console.warn(`[OffersApiEndpoint] Campaign ${id} not found or error:`, err);
              return of({ id, status: 'PAUSED' }); // Treat as inactive if error
            })
          )
        );

        return forkJoin(campaignRequests).pipe(
          map(campaigns => {
            // Filter only ACTIVE campaigns
            const activeCampaignIds = campaigns
              .filter(c => c.status === 'ACTIVE')
              .map(c => c.id);

            // Filter offers by active campaigns
            const filteredOffers = offers
              .filter(offer => activeCampaignIds.includes(offer.campaignId))
              .map(r => this.assembler.toEntityFromResource(r));

            return filteredOffers;
          })
        );
      }),
      catchError(err => {
        console.error('[OffersApiEndpoint] Error fetching offers:', err);
        return of([]);
      })
    );
  }

  /**
   * gets a set of offers for its ids
   * Also filters by active campaigns
   * @param ids - list of ids
   */
  getByIds(ids: number[]): Observable<Offer[]> {
    const qs = ids.map(id => `id=${encodeURIComponent(String(id))}`).join('&');
    return this.http
      .get<OfferResource[]>(`${this.endpointUrl}?${qs}`)
      .pipe(
        switchMap(offers => {
          if (!offers || offers.length === 0) {
            return of([]);
          }

          // Get unique campaign IDs
          const campaignIds = Array.from(new Set(offers.map(o => o.campaignId)));

          // Fetch all campaigns with error handling
          const campaignRequests = campaignIds.map(id =>
            this.http.get<any>(`${environment.platformProviderApiBaseUrl}/campaigns/${id}`).pipe(
              map(campaign => ({ id, status: campaign.status })),
              catchError(err => {
                console.warn(`[OffersApiEndpoint] Campaign ${id} not found or error:`, err);
                return of({ id, status: 'PAUSED' }); // Treat as inactive if error
              })
            )
          );

          return forkJoin(campaignRequests).pipe(
            map(campaigns => {
              // Filter only ACTIVE campaigns
              const activeCampaignIds = campaigns
                .filter(c => c.status === 'ACTIVE')
                .map(c => c.id);

              // Filter offers by active campaigns
              const filteredOffers = offers
                .filter(offer => activeCampaignIds.includes(offer.campaignId))
                .map(r => this.assembler.toEntityFromResource(r));


              return filteredOffers;
            })
          );
        }),
        catchError(err => {
          console.error('[OffersApiEndpoint] Error fetching offers by IDs:', err);
          return of([]);
        })
      );
  }

  recordCampaignClick(campaignId?: number): void {
    if (!this.isValidCampaignId(campaignId)) {
      return;
    }
    this.persistEngagementDelta(campaignId!, { clicks: 1 });
  }

  recordCampaignImpressions(campaignIds: number[]): void {
    campaignIds.forEach(id => {
      if (this.isValidCampaignId(id)) {
        this.persistEngagementDelta(id, { impressions: 1 });
      }
    });
  }

  private persistEngagementDelta(
    campaignId: number,
    delta: { clicks?: number; impressions?: number }
  ): void {
    this.campaignApi
      .getById(campaignId)
      .pipe(
        take(1),
        switchMap(campaign => {
          const updated = {
            ...campaign,
            totalClicks: (campaign.totalClicks ?? 0) + (delta.clicks ?? 0),
            totalImpressions: (campaign.totalImpressions ?? 0) + (delta.impressions ?? 0)
          };

          return this.campaignApi.updateCampaign(campaignId, updated).pipe(take(1));
        })
      )
      .subscribe({
        error: err => console.error('[OffersApiEndpoint] Failed to persist campaign engagement:', err)
      });
  }

  private isValidCampaignId(id?: number): id is number {
    return typeof id === 'number' && id > 0;
  }
}
