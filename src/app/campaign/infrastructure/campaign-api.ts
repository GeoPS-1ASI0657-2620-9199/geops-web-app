import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Campaign } from '../domain/model/campaign.entity';
import { CampaignOffer } from '../domain/model/offer.entity';
import { CampaignApiEndpoint } from './campaign-api-endpoint';

/**
 * Campaign API Service
 *
 * Service layer for Campaign bounded context.
 * Manages campaigns and offers with state management using BehaviorSubject.
 * Provides methods for CRUD operations and caching.
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignApi {
  private readonly endpoint: CampaignApiEndpoint;

  // State management
  private campaignsSubject = new BehaviorSubject<Campaign[]>([]);
  public campaigns$ = this.campaignsSubject.asObservable();

  private selectedCampaignSubject = new BehaviorSubject<Campaign | null>(null);
  public selectedCampaign$ = this.selectedCampaignSubject.asObservable();

  private campaignOffersSubject = new BehaviorSubject<CampaignOffer[]>([]);
  public campaignOffers$ = this.campaignOffersSubject.asObservable();

  constructor(http: HttpClient) {
    this.endpoint = new CampaignApiEndpoint(http);
  }

  // ==================== CAMPAIGN OPERATIONS ====================

  /**
   * Get all campaigns for a user
   */
  getCampaignsByUserId(userId: number): Observable<Campaign[]> {
    return this.endpoint.getByUserId(userId).pipe(
      tap(campaigns => this.campaignsSubject.next(campaigns)),
      catchError(error => {
        console.error('Error fetching campaigns:', error);
        return of([]);
      })
    );
  }

  /**
   * Get a single campaign by ID
   */
  getCampaignById(id: number): Observable<Campaign> {
    return this.endpoint.getById(id).pipe(
      tap(campaign => this.selectedCampaignSubject.next(campaign)),
      catchError(error => {
        console.error('Error fetching campaign:', error);
        throw error;
      })
    );
  }

  /**
   * Create a new campaign
   */
  createCampaign(campaign: Partial<Campaign>): Observable<Campaign> {
    return this.endpoint.createCampaign(campaign).pipe(
      tap(newCampaign => {
        const current = this.campaignsSubject.value;
        this.campaignsSubject.next([...current, newCampaign]);
      }),
      catchError(error => {
        console.error('Error creating campaign:', error);
        throw error;
      })
    );
  }

  /**
   * Update an existing campaign
   */
  updateCampaign(id: number, campaign: Partial<Campaign>): Observable<Campaign> {
    return this.endpoint.updateCampaign(id, campaign).pipe(
      tap(updated => {
        const current = this.campaignsSubject.value;
        const index = current.findIndex(c => c.id === id);
        if (index !== -1) {
          current[index] = updated;
          this.campaignsSubject.next([...current]);
        }
        if (this.selectedCampaignSubject.value?.id === id) {
          this.selectedCampaignSubject.next(updated);
        }
      }),
      catchError(error => {
        console.error('Error updating campaign:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a campaign
   */
  deleteCampaign(id: number): Observable<void> {
    return this.endpoint.deleteCampaign(id).pipe(
      tap(() => {
        const current = this.campaignsSubject.value;
        this.campaignsSubject.next(current.filter(c => c.id !== id));
        if (this.selectedCampaignSubject.value?.id === id) {
          this.selectedCampaignSubject.next(null);
        }
      }),
      catchError(error => {
        console.error('Error deleting campaign:', error);
        throw error;
      })
    );
  }

  // ==================== OFFER OPERATIONS ====================

  /**
   * Get all offers for a campaign
   */
  getOffersByCampaignId(campaignId: number): Observable<CampaignOffer[]> {
    return this.endpoint.getOffersByCampaignId(campaignId).pipe(
      tap(offers => this.campaignOffersSubject.next(offers)),
      catchError(error => {
        console.error('Error fetching offers:', error);
        // Reset offers list to empty array on any error (including 404)
        this.campaignOffersSubject.next([]);
        return of([]);
      })
    );
  }

  /**
   * Get a single offer by ID
   */
  getOfferById(offerId: number): Observable<CampaignOffer> {
    return this.endpoint.getOfferById(offerId).pipe(
      catchError(error => {
        console.error('Error fetching offer:', error);
        throw error;
      })
    );
  }

  /**
   * Create a new offer
   */
  createOffer(offer: Partial<CampaignOffer>): Observable<CampaignOffer> {
    return this.endpoint.createOffer(offer).pipe(
      tap(newOffer => {
        const current = this.campaignOffersSubject.value;
        this.campaignOffersSubject.next([...current, newOffer]);
      }),
      catchError(error => {
        console.error('Error creating offer:', error);
        throw error;
      })
    );
  }

  /**
   * Update an existing offer
   */
  updateOffer(offerId: number, offer: Partial<CampaignOffer>): Observable<CampaignOffer> {
    return this.endpoint.updateOffer(offerId, offer).pipe(
      tap(updated => {
        const current = this.campaignOffersSubject.value;
        const index = current.findIndex(o => o.id === offerId);
        if (index !== -1) {
          current[index] = updated;
          this.campaignOffersSubject.next([...current]);
        }
      }),
      catchError(error => {
        console.error('Error updating offer:', error);
        throw error;
      })
    );
  }

  /**
   * Delete an offer
   */
  deleteOffer(offerId: number): Observable<void> {
    return this.endpoint.deleteOffer(offerId).pipe(
      tap(() => {
        const current = this.campaignOffersSubject.value;
        this.campaignOffersSubject.next(current.filter(o => o.id !== offerId));
      }),
      catchError(error => {
        console.error('Error deleting offer:', error);
        throw error;
      })
    );
  }

  // ==================== STATE MANAGEMENT ====================

  /**
   * Select a campaign (update selected campaign subject)
   */
  selectCampaign(campaign: Campaign | null): void {
    this.selectedCampaignSubject.next(campaign);
  }

  /**
   * Clear campaigns cache
   */
  clearCampaigns(): void {
    this.campaignsSubject.next([]);
  }

  /**
   * Clear offers cache
   */
  clearOffers(): void {
    this.campaignOffersSubject.next([]);
  }

  /**
   * Get current campaigns value (synchronous)
   */
  getCurrentCampaigns(): Campaign[] {
    return this.campaignsSubject.value;
  }

  /**
   * Get current selected campaign (synchronous)
   */
  getCurrentSelectedCampaign(): Campaign | null {
    return this.selectedCampaignSubject.value;
  }

  /**
   * Get current offers value (synchronous)
   */
  getCurrentOffers(): CampaignOffer[] {
    return this.campaignOffersSubject.value;
  }
}
