import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { GetOfferDetailUseCase } from '../../../../catalog/application/get-offer-detail.use-case';
import { OfferDetail } from '../../../../catalog/domain/model/offer-detail';
import { validityLabel } from '../../../../catalog/presentation/validity-label';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoOfferCard } from '../../../../shared/ui/geo-offer-card/geo-offer-card';
import {
  ListSavedOffersUseCase,
  RemoveSavedOfferUseCase,
} from '../../../application/saved-offers.use-cases';
import { SavedOffer, splitByValidity } from '../../../domain/model/saved-offer';

type ViewState = 'loading' | 'ready' | 'empty' | 'error';

/** A saved offer with what Catalog adds for its card: photo, price and category. */
interface FavoriteCard {
  readonly saved: SavedOffer;
  readonly detail: OfferDetail | null;
}

/** "Mis Favoritos" (US12, Figma screen 10): the saved offers still valid and the ones that ended. */
@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink, MatButtonModule, TranslateModule, GeoAlert, GeoEmptyState, GeoOfferCard],
  templateUrl: './favorites.page.html',
  styleUrl: './favorites.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPage implements OnInit {
  private readonly listSaved = inject(ListSavedOffersUseCase);
  private readonly removeSaved = inject(RemoveSavedOfferUseCase);
  private readonly getOffer = inject(GetOfferDetailUseCase);

  protected readonly state = signal<ViewState>('loading');
  protected readonly cards = signal<FavoriteCard[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly current = computed(() => this.cards().filter((card) => !card.saved.expired));
  protected readonly expired = computed(() => this.cards().filter((card) => card.saved.expired));

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      const saved = await this.listSaved.execute();
      const { current, expired } = splitByValidity(saved);
      const cards = await Promise.all([...current, ...expired].map((offer) => this.withDetail(offer)));
      this.cards.set(cards);
      this.state.set(cards.length ? 'ready' : 'empty');
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : null);
      this.state.set('error');
    }
  }

  async remove(event: Event, offerId: number): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    try {
      await this.removeSaved.execute(offerId);
      this.cards.update((cards) => cards.filter((card) => card.saved.offerId !== offerId));
      if (!this.cards().length) {
        this.state.set('empty');
      }
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : null);
    }
  }

  protected validity(card: FavoriteCard): string {
    return card.saved.expired ? `Venció el ${validityLabel(card.saved.validTo).replace(/^Vence (el )?/, '')}` : validityLabel(card.saved.validTo);
  }

  private async withDetail(saved: SavedOffer): Promise<FavoriteCard> {
    try {
      return { saved, detail: await this.getOffer.execute(saved.offerId) };
    } catch {
      return { saved, detail: null };
    }
  }
}
