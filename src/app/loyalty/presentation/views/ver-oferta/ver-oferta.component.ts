import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { OffersApiEndpoint } from '../../../infrastructure/offers/offers-api-endpoint';
import { FavoritesApiEndpoint } from '../../../infrastructure/favorites/favorites-api-endpoint';
import { ReviewsApiEndpoint } from '../../../infrastructure/reviews-api-endpoint';
import {AuthService} from '../../../../identity/infrastructure/auth/auth.service';
import { Review } from '../../../domain/model/review.entity';
import { CartStore } from '../../../../cart/application/cart.store';
import { Offer } from '../../../domain/model/offer.entity';

@Component({
  selector: 'app-ver-oferta',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './ver-oferta.component.html',
  styleUrls: ['./ver-oferta.component.css'],
})

/**
 * offer detail screen
 */
export class VerOfertaComponent implements OnInit {
  private readonly cartStore = inject(CartStore);

  offer?: Offer;
  loading = false;
  isFav = false;

  reviews: Review[] = [];
  avgRating = 0;
  reviewsCount = 0;
  myRating = 5;
  myText = '';

  private userId: number | null = null;

  get canPublish(): boolean {
    return !!this.userId && !!this.myText.trim();
  }

  from: 'offers' | 'favorites' | null = null;

  /**
   * creates an instance of the 'viewOfferComponent' component
   * @param route
   * @param router
   * @param location
   * @param offersApi
   * @param favsApi
   * @param reviewsApi
   * @param auth
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private offersApi: OffersApiEndpoint,
    private favsApi: FavoritesApiEndpoint,
    private reviewsApi: ReviewsApiEndpoint,
    private auth: AuthService
  ) {}

  /**
   * initialize the page
   */
  ngOnInit(): void {
    window.scrollTo({ top: 0 });
    this.userId = this.auth.getCurrentUserId();

    const user = this.auth.getCurrentUser();
    this.userId = user ? user.id : 0;

    this.from =
      (this.route.snapshot.queryParamMap.get('from') as any) ?? history.state?.from ?? null;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;

    this.offersApi.getByIds([id]).subscribe({
      next: (offers) => {
        this.offer = offers[0];
        this.loading = false;
        if (!this.offer) return;

        if (this.userId) {
          this.favsApi
            .findRow(this.userId, this.offer.id)
            .subscribe((rows) => (this.isFav = rows.length > 0));
        }

        this.loadReviews(this.offer.id);
      },
      error: () => (this.loading = false),
    });
  }

  /**
   * checks if a location is a district and should not be translated
   * @param location - location name
   */
  isDistrict(location: string): boolean {
    const districts = [
      'Surco',
      'San Miguel',
      'San Borja',
      'Chorrillos',
      'Santa Marina',
      'Trujillo',
      'Arequipa',
      'Ica',
      'Ate',
      'Breña',
      'Comas',
      'Barranco',
      'Los Olivos',
      'Magdalena',
      'Miraflores',
      'Pueblo Libre',
      'San Isidro',
      'Tiendas seleccionadas',
    ];
    // Divide la ubicación por comas y elimina espacios
    const locationParts = location.split(',').map((part) => part.trim());
    // Verifica si alguna parte es un distrito
    return locationParts.some((part) => districts.includes(part));
  }

  /**
   * if there's history, use `location.back()`
   * if not, navigate to the source (favorites / offers)
   */
  goBack() {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    const url = this.from === 'favorites' ? '/favoritos' : '/ofertas';
    this.router.navigate([url]);
  }

  /**
   * returns the URL of the offer image
   */
  imgFor(): string {
    return this.offer?.imageUrl ?? `assets/offers/${this.offer?.id}.jpg`;
  }

  /**
   * toggles the offers favorite for the current user
   * if it's already a favorite, remove it
   * if not, add it
   */
  toggleFav(): void {
    if (!this.userId || !this.offer) return;

    if (this.isFav) {
      this.favsApi.findRow(this.userId, this.offer.id).subscribe((rows) => {
        if (!rows.length) return;
        this.favsApi.removeRow(rows[0].id!).subscribe(() => (this.isFav = false));
      });
    } else {
      this.favsApi.add(this.userId, this.offer.id).subscribe(() => (this.isFav = true));
    }
  }

  /**
   * load the offer reviews and calculate average/quantity
   * @param offerId
   * @private
   */
  private loadReviews(offerId: number) {
    this.reviewsApi.listByOffer(offerId).subscribe((list) => {
      this.reviews = list;
      this.reviewsCount = list.length;
      this.avgRating = list.length
        ? +(list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1)
        : 0;
    });
  }

  /**
   * post a current user review for this offer
   */
  publishReview() {
    if (!this.userId || !this.offer || !this.myText.trim()) return;

    const me = this.auth.getCurrentUser();

    this.reviewsApi
      .add({
        offerId: this.offer.id,
        userId: this.userId,
        userName: me?.name ?? '',
        rating: this.myRating,
        text: this.myText.trim(),
      })
      .subscribe((r) => {
        this.reviews = [r, ...this.reviews];
        this.reviewsCount++;
        this.avgRating = +(
          this.reviews.reduce((s, x) => s + x.rating, 0) / this.reviews.length
        ).toFixed(1);
        this.myText = '';
        this.myRating = 5;
      });
  }

  /**
   * increase the "likes" of a review
   * @param r - review that is liked
   */
  like(r: Review) {
    this.reviewsApi.like(r.id, r.likes + 1).subscribe((updated) => {
      const i = this.reviews.findIndex((x) => x.id === r.id);
      if (i >= 0) this.reviews[i] = updated;
    });
  }

  /**
   * returns the capital initial to display on the avatar to be displayed in reviews
   * @param name - username
   * @param fallback
   */
  initialOf(name?: string, fallback: string = '?'): string {
    const n = (name ?? '').trim();
    return n ? n[0].toUpperCase() : fallback;
  }

  /**
   * Añade una oferta al carrito
   */
  addToCart() {
    if (!this.offer) return;

    if (!this.userId) {
      alert('Debes iniciar sesión para agregar al carrito');
      return;
    }

    const offerTitle = this.offer.title;
    const offerImageUrl = this.imgFor();

    this.cartStore.addItem(this.userId, this.offer.id, offerTitle, this.offer.price, offerImageUrl, 1);
    this.offersApi.recordCampaignClick(this.offer.campaignId);
  }

  /**
   * Procede a comprar directamente - añade al carrito y abre el sidebar
   */
  buyNow() {
    if (!this.offer) return;

    if (!this.userId) {
      alert('Debes iniciar sesión para comprar');
      return;
    }

    const offerTitle = this.offer.title;
    const offerImageUrl = this.imgFor();

    // Add to cart and open sidebar
    this.cartStore.addItem(this.userId, this.offer.id, offerTitle, this.offer.price, offerImageUrl, 1);
    this.cartStore.openSidebar();
    this.offersApi.recordCampaignClick(this.offer.campaignId);
  }

  protected readonly String = String;
}
