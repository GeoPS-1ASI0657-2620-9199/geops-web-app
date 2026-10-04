import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesApiEndpoint } from '../../../infrastructure/favorites/favorites-api-endpoint';
import { OffersApiEndpoint } from '../../../infrastructure/offers/offers-api-endpoint';
import { TranslateModule } from '@ngx-translate/core';
import {AuthService} from '../../../../identity/infrastructure/auth/auth.service';
import {CartStore} from '../../../../cart/application/cart.store';
import { Offer } from '../../../domain/model/offer.entity';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './favoritos.component.html',
  styleUrls: ['./favoritos.component.css'],
})

/**
 * favorites screen
 */
export class FavoritosComponent implements OnInit {
  private readonly cartStore = inject(CartStore);

  loading = false;
  offers: Offer[] = [];

  private currentUserId: number | null = null;
  private impressionsTracked = false;

  /**
   * creates an instance of the 'favoritesComponent' component
   * @param favsApi
   * @param offersApi
   * @param authService
   */
  constructor(
    private favsApi: FavoritesApiEndpoint,
    private offersApi: OffersApiEndpoint,
    private authService: AuthService
  ) {}

  /**
   * load the users favorite offers
   * @returns {void}
   */
  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    if (!this.currentUserId) {
      console.warn('[Favoritos] No hay usuario autenticado');
      return;
    }

    this.fetch();
  }

  /**
   * checks if a location is a district and should not be translated
   * @param location - location name
   */
  isDistrict(location: string): boolean {
    const districts = [
      'Surco', 'San Miguel', 'San Borja', 'Chorrillos', 'Santa Marina', 'Trujillo',
      'Arequipa', 'Ica', 'Ate', 'Breña', 'Comas', 'Barranco', 'Los Olivos', 'Magdalena',
      'Miraflores', 'Pueblo Libre', 'San Isidro', 'Tiendas seleccionadas'
    ];
    // Divide la ubicación por comas y elimina espacios
    const locationParts = location.split(',').map(part => part.trim());
    // Verifica si alguna parte es un distrito
    return locationParts.some(part => districts.includes(part));
  }

  /**
   * gets the users favorites and retrieves offers based on the users ID.
   */
  fetch() {
    if (!this.currentUserId) {
      this.offers = [];
      return;
    }

    this.loading = true;

    this.favsApi.getByUser(this.currentUserId).subscribe({
      next: (rows) => {
        // Convertir offerId de string a number
        const ids = rows.map((r) => Number(r.offerId));

        if (!ids.length) {
          this.offers = [];
          this.loading = false;
          return;
        }

        this.offersApi.getByIds(ids).subscribe({
          next: (list) => {
            const map = new Map(list.map((o) => [o.id, o]));
            this.offers = ids.map((id) => map.get(id)!).filter(Boolean) as Offer[];
            this.trackInitialImpressions(this.offers);
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
      },
      error: () => (this.loading = false),
    });
  }

  /**
   * Returns the URL of the image associated with an offer.
   * @param o - offer
   */
  imgFor(o: Offer) { return o.imageUrl ?? `assets/offers/${o.id}.jpg`; }

  /**
   * removes the offer from the user's favorites list
   * @param o - offer you want to remove from favorites
   */
  remove(o: Offer) {
    if (!this.currentUserId) return;

    // Usar el endpoint directo que elimina por userId y offerId
    this.favsApi.removeByUserAndOffer(this.currentUserId, o.id).subscribe({
      next: () => {
        this.offers = this.offers.filter((x) => x.id !== o.id);
      },
      error: (err) => {
        console.error('[Favoritos] Error al eliminar favorito:', err);
      }
    });
  }

  /**
   * Añade una oferta al carrito
   * @param o - Oferta a añadir
   */
  addToCart(o: Offer) {
    if (!this.currentUserId) {
      console.warn('[Favoritos] No hay usuario autenticado para añadir al carrito');
      return;
    }

    const offerTitle = o.title;
    const offerImageUrl = this.imgFor(o);

    this.offersApi.recordCampaignClick(o.campaignId);
    this.cartStore.addItem(this.currentUserId, o.id, offerTitle, o.price, offerImageUrl, 1);
  }

  /**
   * Procede a comprar directamente - añade al carrito y abre el sidebar
   * @param o - Oferta a comprar
   */
  buyNow(o: Offer) {
    if (!this.currentUserId) {
      console.warn('[Favoritos] No hay usuario autenticado para comprar');
      return;
    }

    const offerTitle = o.title;
    const offerImageUrl = this.imgFor(o);

    this.offersApi.recordCampaignClick(o.campaignId);
    // Add to cart and open sidebar
    this.cartStore.addItem(this.currentUserId, o.id, offerTitle, o.price, offerImageUrl, 1);
    this.cartStore.openSidebar();
  }

  onViewOffer(o: Offer) {
    this.offersApi.recordCampaignClick(o.campaignId);
  }

  private trackInitialImpressions(offers: Offer[]): void {
    if (this.impressionsTracked || !offers.length) {
      return;
    }

    const ids = new Set<number>();
    offers.forEach(offer => {
      if (typeof offer.campaignId === 'number' && offer.campaignId > 0) {
        ids.add(offer.campaignId);
      }
    });

    if (ids.size) {
      this.offersApi.recordCampaignImpressions(Array.from(ids));
      this.impressionsTracked = true;
    }
  }

}
