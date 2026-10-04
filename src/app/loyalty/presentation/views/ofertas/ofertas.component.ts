import { Component, OnDestroy, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OffersApiEndpoint } from '../../../infrastructure/offers/offers-api-endpoint';
import { FavoritesApiEndpoint } from '../../../infrastructure/favorites/favorites-api-endpoint';
import { TranslateModule } from '@ngx-translate/core';
import { CartStore } from '../../../../cart/application/cart.store';
import {AuthService} from '../../../../identity/infrastructure/auth/auth.service';
import { Offer } from '../../../domain/model/offer.entity';

@Component({
  selector: 'app-ofertas',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  templateUrl: './ofertas.component.html',
  styleUrls: ['./ofertas.component.css'],
})

/**
 * offers screen
 */
export class OfertasComponent implements OnInit, OnDestroy {

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

  // Dropdown states
  categoryOpen = false;
  sortOpen = false;
  locationOpen = false;

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
   * creates an instance of the 'offersComponent' component
   * @param route
   * @param router
   * @param offersApi
   * @param favoritesApi
   * @param authService
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offersApi: OffersApiEndpoint,
    private favoritesApi: FavoritesApiEndpoint,
    private authService: AuthService
  ) {}

  /**
   * initialize the page
   */
  ngOnInit(): void {

    const user = this.authService.getCurrentUser();
    this.currentUserId = this.authService.getCurrentUserId();
    this.userId = user ? (user.id) : 0;
    if (user) {
      this.userId = (user.id);
    } else {
      console.warn('[Layout] No hay usuario autenticado');
    }

    this.currentUserId = this.authService.getCurrentUserId();

    if (!this.currentUserId) {
      console.warn('[Ofertas] No hay usuario autenticado');
    }

    this.route.queryParams.subscribe(params => {
      this.filters.q = params['q'] || '';
      this.filters.category = params['category'] || 'all';
      this.filters.location = params['location'] || 'all';
      this.filters.sort = params['sort'] || 'relevance';

      if (this.dataLoaded) {
        this.applyFiltersWithoutUpdatingUrl();
      }
    });

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
        this.applyFiltersWithoutUpdatingUrl();
        this.loading = false;
        this.startAuto();
      },
      error: () => (this.loading = false),
    });

    this.fetchFavs();
  }

  /**
   * called when the component is destroyed
   * also stops the carousel timer
   * @return { void}
   */
  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  /**
   * checks if a location is a district and should not be translated
   * @param location - location name
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
   * starts the automatic scrolling of the carousel
   */
  startAuto() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.next(), 2000);
  }

  /**
   * change the featured offer in the carousel
   */
  next() {
    this.idx = (this.idx + 1) % this.featured.length;
  }

  /**
   * change the carousel to a specific offer
   * @param index
   */
  goTo(index: number) {
    this.idx = index;
    this.startAuto();
  }

  /**
   * get the currently active featured offer
   */
  active(): Offer | null {
    return this.featured[this.idx] ?? null;
  }

  /**
   * returns the URL of the corresponding image of an offer, if there is no image
   * @param o
   */
  imgFor(o: Offer | null): string {
    return !o ? '' : (o.imageUrl ?? `assets/offers/${o.id}.jpg`);
  }

  /**
   * filters are applied and URL is updated
   */
  applyFilters() {
    this.applyFiltersWithoutUpdatingUrl();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.filters.q || null,
        category: this.filters.category !== 'all' ? this.filters.category : null,
        location: this.filters.location !== 'all' ? this.filters.location : null,
        sort: this.filters.sort !== 'relevance' ? this.filters.sort : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * applies filters without updating the URL (used when syncing from URL)
   */
  private applyFiltersWithoutUpdatingUrl() {
    const q = this.filters.q.trim().toLowerCase();

    let list = this.all.filter((o) => {
      const byText =
        !q || [o.title, o.partner, o.category, o.location].some((s) =>
          s.toLowerCase().includes(q)
        );
      const byCat = this.filters.category === 'all' || o.category === this.filters.category;
      const byLoc = this.filters.location === 'all' || o.location.toLowerCase().includes(this.filters.location.toLowerCase());
      return byText && byCat && byLoc;
    });

    switch (this.filters.sort) {
      case 'priceAsc':  list = list.sort((a, b) => a.price - b.price); break;
      case 'priceDesc': list = list.sort((a, b) => b.price - a.price); break;
      case 'ratingDesc':list = list.sort((a, b) => b.rating - a.rating); break;
      default: break;
    }

    this.filtered = list;
  }

  /**
   * clears the applied filters
   */
  clearFilters() {
    this.filters = { q: '', category: 'all', location: 'all', sort: 'relevance' };
    this.applyFilters();
  }

  /**
   * toggle category dropdown
   */
  toggleCategory() {
    this.categoryOpen = !this.categoryOpen;
    this.sortOpen = false;
    this.locationOpen = false;
  }

  /**
   * toggle sort dropdown
   */
  toggleSort() {
    this.sortOpen = !this.sortOpen;
    this.categoryOpen = false;
    this.locationOpen = false;
  }

  /**
   * toggle location dropdown
   */
  toggleLocation() {
    this.locationOpen = !this.locationOpen;
    this.categoryOpen = false;
    this.sortOpen = false;
  }

  /**
   * select category
   */
  selectCategory(category: string) {
    this.filters.category = category;
    this.categoryOpen = false;
    this.applyFilters();
  }

  /**
   * select sort option
   */
  selectSort(sort: 'relevance' | 'priceAsc' | 'priceDesc' | 'ratingDesc') {
    this.filters.sort = sort;
    this.sortOpen = false;
    this.applyFilters();
  }

  /**
   * select location
   */
  selectLocation(location: string) {
    this.filters.location = location;
    this.locationOpen = false;
    this.applyFilters();
  }

  /**
   * close all dropdowns when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInsideDropdown = target.closest('.custom-select-wrapper');

    if (!clickedInsideDropdown) {
      this.categoryOpen = false;
      this.sortOpen = false;
      this.locationOpen = false;
    }
  }

  /**
   * get the current users favorites from the API
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
   * check if an offer is marked as a favorite
   * @param id
   */
  isFav(id: number) { return this.favSet.has((id)); }

  /**
   * this basically updates the favorite status of an offer.
   * If its already marked, it removes it from your favorites; if not, it adds it.
   * @param o
   */
  toggleFav(o: Offer) {
    if (!this.currentUserId) {
      alert('Debes iniciar sesión para agregar favoritos');
      return;
    }

    if (this.favSet.has((o.id))) {
      // Eliminar favorito usando el endpoint directo
      this.favoritesApi.removeByUserAndOffer(this.currentUserId, o.id).subscribe({
        next: () => {
          this.favSet.delete((o.id));
        },
        error: (err) => {
          console.error('[Ofertas] Error al eliminar favorito:', err);
        }
      });
    } else {
      this.favoritesApi.add(this.currentUserId, o.id).subscribe(() => {
        this.favSet.add((o.id));
      });
    }
  }

  /**
   * add an offer to your cart
   * @param o - offer to add
   */
  addToCart(o: Offer) {
    const offerTitle = o.title;
    const offerImageUrl = this.imgFor(o);

    this.offersApi.recordCampaignClick(o.campaignId);
    this.cartStore.addItem(this.userId, o.id, offerTitle, o.price, offerImageUrl, 1);
  }

  /**
   * proceed to buy directly - adds to cart and opens the sidebar
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
