import { computed, Injectable, Signal, signal, inject } from '@angular/core';
import { retry } from 'rxjs';
import { Campaign } from '../domain/model/campaign.entity';
import { CampaignOffer } from '../domain/model/offer.entity';
import { calculateCtr } from '../domain/utils/campaign-metrics.util';
import { CampaignApi } from '../infrastructure/campaign-api';
import { CampaignCartOperations } from '../infrastructure/campaign-cart-operations';

/**
 * Application service store for managing campaign state in the 'campaign' bounded context.
 * Handles campaigns and offers using Angular signals.
 *
 * This store replaces the old CampaignService pattern (BehaviorSubject) with Angular Signals
 * for better performance and type safety.
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignStore {
  private readonly api = inject(CampaignApi);
  private readonly cartOperations = inject(CampaignCartOperations);

  // ==================== PRIVATE SIGNALS ====================

  private readonly campaignsSignal = signal<Campaign[]>([]);
  private readonly selectedCampaignSignal = signal<Campaign | null>(null);
  private readonly campaignOffersSignal = signal<CampaignOffer[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // ==================== PUBLIC READONLY SIGNALS ====================

  /**
   * Readonly signal for the list of campaigns
   */
  readonly campaigns = this.campaignsSignal.asReadonly();

  /**
   * Readonly signal for the currently selected campaign
   */
  readonly selectedCampaign = this.selectedCampaignSignal.asReadonly();

  /**
   * Readonly signal for offers of the current campaign
   */
  readonly campaignOffers = this.campaignOffersSignal.asReadonly();

  /**
   * Readonly signal indicating if data is loading
   */
  readonly loading = this.loadingSignal.asReadonly();

  /**
   * Readonly signal for the current error message
   */
  readonly error = this.errorSignal.asReadonly();

  // ==================== COMPUTED SIGNALS ====================

  /**
   * Computed signal for the count of campaigns
   */
  readonly campaignCount = computed(() => this.campaigns().length);

  /**
   * Computed signal for the count of campaign offers
   */
  readonly offerCount = computed(() => this.campaignOffers().length);

  /**
   * Computed signal for active campaigns
   */
  readonly activeCampaigns = computed(() =>
    this.campaigns().filter(c => c.status === 'ACTIVE')
  );

  /**
   * Computed signal for paused campaigns
   */
  readonly pausedCampaigns = computed(() =>
    this.campaigns().filter(c => c.status === 'PAUSED')
  );

  /**
   * Computed signal for finalized campaigns
   */
  readonly finalizedCampaigns = computed(() =>
    this.campaigns().filter(c => c.status === 'FINALIZED')
  );

  /**
   * Computed signal indicating if selected campaign is active
   */
  readonly isSelectedCampaignActive = computed(() =>
    this.selectedCampaign()?.status === 'ACTIVE'
  );

  /**
   * Computed signal indicating if selected campaign is expired
   */
  readonly isSelectedCampaignExpired = computed(() => {
    const campaign = this.selectedCampaign();
    if (!campaign) return false;

    const endDate = new Date(campaign.endDate);
    return endDate < new Date() || campaign.status === 'FINALIZED';
  });

  // ==================== CONSTRUCTOR ====================

  /**
   * Creates an instance of CampaignStore
   * Note: Initial data loading happens on-demand via loadCampaignsByUserId
   */
  constructor() {
    // No automatic loading - data is loaded on-demand by components
  }

  private normalizeCampaign(campaign: Campaign): Campaign {
    const totalImpressions = campaign.totalImpressions ?? 0;
    const totalClicks = campaign.totalClicks ?? 0;

    return {
      ...campaign,
      totalImpressions,
      totalClicks,
      CTR: calculateCtr(totalClicks, totalImpressions)
    };
  }

  // ==================== CAMPAIGN METHODS ====================

  /**
   * Retrieves a campaign by its ID as a signal
   * @param id - The ID of the campaign
   * @returns A Signal containing the Campaign object or undefined if not found
   */
  getCampaignById(id: number): Signal<Campaign | undefined> {
    return computed(() => id ? this.campaigns().find(c => c.id === id) : undefined);
  }

  /**
   * Load campaigns for a specific user
   * @param userId - The ID of the user
   */
  loadCampaignsByUserId(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getCampaignsByUserId(userId).pipe(retry(2)).subscribe({
      next: campaigns => {
        this.campaignsSignal.set(campaigns.map(c => this.normalizeCampaign(c)));
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load campaigns'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Load a single campaign by ID and set as selected
   * @param id - The ID of the campaign
   */
  loadCampaignById(id: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getCampaignById(id).pipe(retry(2)).subscribe({
      next: campaign => {
        this.selectedCampaignSignal.set(this.normalizeCampaign(campaign));
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load campaign'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Create a new campaign
   * @param campaign - The campaign to create
   */
  createCampaign(campaign: Partial<Campaign>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.createCampaign(campaign).pipe(retry(2)).subscribe({
      next: created => {
        const normalized = this.normalizeCampaign(created);
        this.campaignsSignal.update(campaigns => [...campaigns, normalized]);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to create campaign'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Update an existing campaign
   * @param id - The ID of the campaign
   * @param updates - The updates to apply
   */
  updateCampaign(id: number, updates: Partial<Campaign>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // Check if status is changing to PAUSED or FINALIZED
    const currentCampaign = this.campaigns().find(c => c.id === id);
    const isStatusChangingToNonActive =
      currentCampaign?.status === 'ACTIVE' &&
      (updates.status === 'PAUSED' || updates.status === 'FINALIZED');

    // If changing to non-active status, clean carts first
    if (isStatusChangingToNonActive) {
      this.cartOperations.removeOffersFromAllCarts(id).subscribe({
        next: () => {
          this.performCampaignUpdate(id, updates);
        },
        error: err => {
          this.errorSignal.set(this.formatError(err, 'Failed to clean carts'));
          this.loadingSignal.set(false);
        }
      });
    } else {
      // Otherwise, just update
      this.performCampaignUpdate(id, updates);
    }
  }

  /**
   * Perform the actual campaign update (used internally)
   * @param id - The ID of the campaign
   * @param updates - The updates to apply
   */
  private performCampaignUpdate(id: number, updates: Partial<Campaign>): void {
    this.api.updateCampaign(id, updates).pipe(retry(2)).subscribe({
      next: updated => {
        const normalized = this.normalizeCampaign(updated);
        this.campaignsSignal.update(campaigns =>
          campaigns.map(c => c.id === id ? normalized : c)
        );
        if (this.selectedCampaignSignal()?.id === id) {
          this.selectedCampaignSignal.set(normalized);
        }
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to update campaign'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Delete a campaign
   * Removes all associated offers from all carts before deletion
   * @param id - The ID of the campaign to delete
   */
  deleteCampaign(id: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // First, remove offers from all carts
    this.cartOperations.removeOffersFromAllCarts(id).subscribe({
      next: () => {
        // Then delete the campaign
        this.api.deleteCampaign(id).pipe(retry(2)).subscribe({
          next: () => {
            this.campaignsSignal.update(campaigns =>
              campaigns.filter(c => c.id !== id)
            );
            if (this.selectedCampaignSignal()?.id === id) {
              this.selectedCampaignSignal.set(null);
            }
            this.loadingSignal.set(false);
          },
          error: err => {
            this.errorSignal.set(this.formatError(err, 'Failed to delete campaign'));
            this.loadingSignal.set(false);
          }
        });
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to clean carts before deletion'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Select a campaign
   * @param campaign - The campaign to select (or null to clear)
   */
  selectCampaign(campaign: Campaign | null): void {
    this.selectedCampaignSignal.set(campaign ? this.normalizeCampaign(campaign) : null);
    if (campaign) {
      this.loadOffersByCampaignId(campaign.id!);
    } else {
      this.campaignOffersSignal.set([]);
    }
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedCampaignSignal.set(null);
    this.campaignOffersSignal.set([]);
  }

  // ==================== OFFER METHODS ====================

  /**
   * Retrieves an offer by its ID as a signal
   * @param id - The ID of the offer
   * @returns A Signal containing the CampaignOffer object or undefined if not found
   */
  getOfferById(id: number): Signal<CampaignOffer | undefined> {
    return computed(() => id ? this.campaignOffers().find(o => o.id === id) : undefined);
  }

  /**
   * Load offers for a specific campaign
   * @param campaignId - The ID of the campaign
   */
  loadOffersByCampaignId(campaignId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getOffersByCampaignId(campaignId).pipe(retry(2)).subscribe({
      next: offers => {
        this.campaignOffersSignal.set(offers);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load offers'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Create a new offer
   * @param offer - The offer to create
   */
  createOffer(offer: Partial<CampaignOffer>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.createOffer(offer).pipe(retry(2)).subscribe({
      next: created => {
        this.campaignOffersSignal.update(offers => [...offers, created]);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to create offer'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Update an existing offer
   * @param id - The ID of the offer
   * @param updates - The updates to apply
   */
  updateOffer(id: number, updates: Partial<CampaignOffer>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.updateOffer(id, updates).pipe(retry(2)).subscribe({
      next: updated => {
        this.campaignOffersSignal.update(offers =>
          offers.map(o => o.id === id ? updated : o)
        );
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to update offer'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Delete an offer
   * @param id - The ID of the offer to delete
   */
  deleteOffer(id: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.deleteOffer(id).pipe(retry(2)).subscribe({
      next: () => {
        this.campaignOffersSignal.update(offers =>
          offers.filter(o => o.id !== id)
        );
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to delete offer'));
        this.loadingSignal.set(false);
      }
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Calculate campaign metrics
   * @param campaign - The campaign to calculate metrics for
   */
  calculateCampaignMetrics(campaign: Campaign): {
    impressions: number;
    clicks: number;
    ctr: number;
  } {
    return {
      impressions: campaign.totalImpressions,
      clicks: campaign.totalClicks,
      ctr: calculateCtr(campaign.totalClicks, campaign.totalImpressions),
    };
  }

  /**
   * Check if a campaign is active
   * @param campaign - The campaign to check
   */
  isActive(campaign: Campaign): boolean {
    return campaign.status === 'ACTIVE';
  }

  /**
   * Check if a campaign has expired
   * @param campaign - The campaign to check
   */
  isExpired(campaign: Campaign): boolean {
    const endDate = new Date(campaign.endDate);
    return endDate < new Date() || campaign.status === 'FINALIZED';
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Format error messages for user-friendly display
   * @param error - The error object
   * @param fallback - The fallback error message
   * @returns A formatted error message
   */
  private formatError(error: any, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }

}
