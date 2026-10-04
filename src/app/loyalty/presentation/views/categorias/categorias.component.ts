import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FavoritesApiEndpoint } from '../../../infrastructure/favorites/favorites-api-endpoint';
import { TranslateModule } from '@ngx-translate/core';
import { CartStore } from '../../../../cart/application/cart.store';
import {AuthService} from '../../../../identity/infrastructure/auth/auth.service';
import { OffersApiEndpoint } from '../../../infrastructure/offers/offers-api-endpoint';

type Offer = {
  campaignId: number;
  id: number;
  title: string;
  partner: string;
  price: number;
  codePrefix: string;
  validUntil: string;
  rating: number;
  location: string;
  category: string;
  imageUrl?: string;
};

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css'],
})

export class CategoriasComponent implements OnInit, OnDestroy {

  private readonly cartStore = inject(CartStore);

  loading = false;
  all: Offer[] = [];
  featured: Offer[] = [];
  filtered: Offer[] = [];

  categories: string[] = [];
  locations: string[] = [];

  idx = 0;
  timer?: any;
  userId = 0;

  /**
   * search filters
   */
  filters = {
    q: '',
    category: 'all',
    location: 'all',
    sort: 'relevance' as 'relevance' | 'priceAsc' | 'priceDesc' | 'ratingDesc',
  };

  private favSet = new Set<number>();
  private dataLoaded = false;
  private currentUserId: number | null = null;
  private impressionsTracked = false;

  /**
   * creates an instance of the offerscomponent component
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offersApi: OffersApiEndpoint,
    private favoritesApi: FavoritesApiEndpoint,
    private authService: AuthService
  ) {}

  /**
   * retrieves offers from the API
   * loads all offers
   * starts the featured offers carousel
   * retrieves user favorites
   */
  ngOnInit(): void {

    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = (user.id);
    } else {
      console.warn('[Layout] No hay usuario autenticado');
    }

    this.currentUserId = this.authService.getCurrentUserId();

    if (!this.currentUserId) {
      console.warn('[Ofertas] No hay usuario autenticado');
    }

    this.loading = true;

    this.offersApi.getAll().subscribe({
      next: (offers) => {
        const order = [14, 8, 18, 21];
        this.all = offers as Offer[];
        this.featured = order
          .map((id) => this.all.find((o) => o.id === id))
          .filter((o): o is Offer => !!o);

        this.categories = Array.from(new Set(this.all.map((o) => o.category))).sort();
        this.locations = Array.from(new Set(this.all.map((o) => o.location))).sort();

        this.trackInitialImpressions(this.all);
        this.dataLoaded = true;
        this.applyFilters();
        this.loading = false;
        this.startAuto();
      },
      error: () => (this.loading = false),
    });

    this.fetchFavs();
  }

  /**
   * it is executed when the component is destroyed
   * it also stops the carousel timer
   * @return { void}
   */
  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  /**
   * starts the automatic scrolling of the carousel
   */
  startAuto() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.next(), 2000);
  }

  /**
   * changes the featured offer in the carousel
   */
  next() {
    this.idx = (this.idx + 1) % this.featured.length;
  }

  /**
   * changes the carousel to a specific offer
   * @param index
   */
  goTo(index: number) {
    this.idx = index;
    this.startAuto();
  }

  /**
   * gets the currently active featured offer
   */
  active(): Offer | null {
    return this.featured[this.idx] ?? null;
  }

  /**
   * returns the image URL for an offer, or a default path if no image is available
   * returns a route
   * @param o
   */
  imgFor(o: Offer | null): string {
    return !o ? '' : (o.imageUrl ?? `assets/offers/${o.id}.jpg`);
  }

  /**
   * checks if a location is a district (no translation needed)
   * @param location
   */
  isDistrict(location: string): boolean {
    const districts = [
      'Surco', 'San Miguel', 'San Borja', 'Chorrillos', 'Santa Marina', 'Trujillo',
      'Arequipa', 'Ica', 'Ate', 'Breña', 'Comas', 'Barranco', 'Los Olivos', 'Magdalena',
      'Miraflores', 'Pueblo Libre', 'San Isidro'
    ];
    const locationParts = location.split(',').map(part => part.trim());
    return locationParts.some(part => districts.includes(part));
  }

  /**
   * applies filters
   */
  applyFilters() {
    const q = this.filters.q.trim().toLowerCase();

    let list = this.all.filter((o) => {
      const byText =
        !q || [o.title, o.partner, o.category, o.location].some((s) =>
          s.toLowerCase().includes(q)
        );
      const byCat = this.filters.category === 'all' || o.category === this.filters.category;
      const byLoc = this.filters.location === 'all' || o.location === this.filters.location;
      return byText && byCat && byLoc;
    });

    switch (this.filters.sort) {
      case 'priceAsc':  list = list.sort((a, b) => a.price - b.price); break;
      case 'priceDesc': list = list.sort((a, b) => b.price - a.price); break;
      case 'ratingDesc':list = list.sort((a, b) => b.rating - a.rating); break;
      default: break;
    }

    this.filtered = list;

    if (this.dataLoaded) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: this.filters.q || null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  /**
   * clears the applied filters
   */
  clearFilters() {
    this.filters = { q: '', category: 'all', location: 'all', sort: 'relevance' };
    this.applyFilters();
  }

  /**
   * fetches the current user's favorites from the API
   * @private
   */
  private fetchFavs() {
    if (!this.currentUserId) {
      this.favSet.clear();
      return;
    }
    this.favoritesApi.getByUser(this.currentUserId).subscribe({
      next: (rows) => {
        this.favSet = new Set(rows.map((r) => r.offerId));
      },
      error: () => this.favSet.clear(),
    });
  }

  /**
   * checks if an offer is marked as favorite
   * @param id
   */
  isFav(id: number) { return this.favSet.has((id)); }

  /**
   * basically updates the favorite state of an offer
   * if it's already marked, it removes it from favorites, otherwise it adds it
   * @param o
   */
  toggleFav(o: Offer) {
    if (!this.currentUserId) {
      console.warn('[Ofertas] Debes iniciar sesión para agregar favoritos');
      alert('Debes iniciar sesión para agregar favoritos');
      return;
    }

    if (this.favSet.has((o.id))) {
      // REMOVE favorite using the direct endpoint
      this.favoritesApi.removeByUserAndOffer(this.currentUserId, o.id).subscribe({
        next: () => {
          this.favSet.delete((o.id));
        },
        error: (err) => {
          console.error('[Ofertas] Error al eliminar favorito:', err);
        }
      });
    } else {
      // ADD favorite
      this.favoritesApi.add(this.currentUserId, o.id).subscribe(() => {
        this.favSet.add((o.id));
      });
    }
  }

  /**
   * adds an offer to the cart
   * @param o - offer to add
   */
  addToCart(o: Offer) {
    const offerTitle = o.title;
    const offerImageUrl = this.imgFor(o);

    this.offersApi.recordCampaignClick(o.campaignId);
    this.cartStore.addItem(this.userId, o.id, offerTitle, o.price, offerImageUrl, 1);
  }

  /**
   * proceeds to buy directly - adds to cart and opens the sidebar
   * @param o - offer to buy
   */
  buyNow(o: Offer) {
    const offerTitle = o.title;
    const offerImageUrl = this.imgFor(o);

    this.offersApi.recordCampaignClick(o.campaignId);
    // Add to cart and open sidebar
    this.cartStore.addItem(this.userId, o.id, offerTitle, o.price, offerImageUrl, 1);
    this.cartStore.openSidebar();
  }

  onViewOffer(o: Offer) {
    this.offersApi.recordCampaignClick(o.campaignId);
    this.router.navigate(['/ofertas', o.id], {
      queryParams: { from: 'categorias' },
      queryParamsHandling: 'preserve'
    });
  }

  private trackInitialImpressions(offers: Offer[]): void {
    if (this.impressionsTracked || !offers.length) {
      return;
    }

    const campaignIds = this.extractCampaignIds(offers);
    if (campaignIds.length) {
      this.offersApi.recordCampaignImpressions(campaignIds);
      this.impressionsTracked = true;
    }
  }

  private extractCampaignIds(offers: Offer[]): number[] {
    const ids = new Set<number>();
    offers.forEach(offer => {
      if (typeof offer.campaignId === 'number' && offer.campaignId > 0) {
        ids.add(offer.campaignId);
      }
    });
    return Array.from(ids);
  }
}
