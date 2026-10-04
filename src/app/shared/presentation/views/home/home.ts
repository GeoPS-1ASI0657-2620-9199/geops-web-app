import {Component, inject, OnInit, signal, viewChild, computed} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import { WelcomeBannerComponent } from '../../../../subscriptions/presentation/components/welcome-banner/welcome-banner.component';
import {Offer} from '../../../../loyalty/domain/model/offer.entity';
import {OffersApiEndpoint} from '../../../../loyalty/infrastructure/offers/offers-api-endpoint';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {FavoritesApiEndpoint} from '../../../../loyalty/infrastructure/favorites/favorites-api-endpoint';
import {CartStore} from '../../../../cart/application/cart.store';
import {AuthService} from '../../../../identity/infrastructure/auth/auth.service';
import {RouterLink} from '@angular/router';
import {GoogleMap, MapAdvancedMarker, MapInfoWindow} from '@angular/google-maps';
import {FormsModule} from '@angular/forms';

interface OfferLocation {
  offer: Offer;
  lat: number;
  lng: number;
}

interface CategoryMapping {
  key: string;
  label: string;
  categories: string[];
  titleKeywords: string[]; // Palabras clave para buscar en el título
  excludeKeywords?: string[]; // Palabras clave para excluir
}

@Component({
  selector: 'app-home',
  imports: [
    TranslatePipe,
    WelcomeBannerComponent,
    DecimalPipe,
    NgForOf,
    RouterLink,
    NgIf,
    GoogleMap,
    FormsModule,
    MapAdvancedMarker,
    MapInfoWindow
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  private favSet = new Set<number>();
  private currentUserId: number | null = null;
  private userId: number = 1;
  private readonly cartStore = inject(CartStore);
  private impressionsTracked = false;

  categories: CategoryMapping[] = [
    {
      key: 'all',
      label: 'home.map.all',
      categories: [],
      titleKeywords: []
    },
    {
      key: 'cinemas',
      label: 'home.map.cinemas',
      categories: ['Entretenimiento'],
      titleKeywords: ['cine', 'cinemark', 'cineplanet', 'película', 'pelicula', 'entradas'],
      excludeKeywords: ['buffet', 'park', 'jungle', 'inflable', 'kids', 'niños', 'juego']
    },
    {
      key: 'buffets',
      label: 'home.map.buffets',
      categories: ['Gastronomía'],
      titleKeywords: ['buffet', 'almuerzo', 'cena', 'bailable'],
      excludeKeywords: ['maki', 'makis', 'sushi', 'nikkei', 'ramen']
    },
    {
      key: 'parks',
      label: 'home.map.parks',
      categories: ['Entretenimiento'],
      titleKeywords: ['park', 'parque', 'inflable', 'jungle', 'aquatica', 'infinity'],
      excludeKeywords: ['cine', 'buffet', 'maki']
    },
    {
      key: 'children',
      label: 'home.map.for-children',
      categories: ['Entretenimiento'],
      titleKeywords: ['kids', 'niños', 'niñ', 'playland', 'mundo kids', 'infantil', 'coney'],
      excludeKeywords: ['buffet', 'maki']
    },
    {
      key: 'makis',
      label: 'home.map.makis',
      categories: ['Gastronomía'],
      titleKeywords: ['maki', 'makis', 'sushi', 'nikkei', 'ramen', 'shimaya', 'sakura', 'barra libre'],
      excludeKeywords: ['buffet', 'cine']
    },
    {
      key: 'beauty',
      label: 'home.map.beauty',
      categories: ['Belleza', 'Gift Card'],
      titleKeywords: ['belleza', 'facial', 'beauty', 'kabuki', 'minna', 'dbs', 'aruma', 'skin', 'cuidado'],
      excludeKeywords: []
    }
  ];
  selectedCategories = signal<string[]>(['all']);
  allOffers = signal<Offer[]>([]);

  latitude = signal<number>(-12.0464);
  longitude = signal<number>(-77.0428);
  locationAllowed = signal<boolean>(false);
  center = signal<google.maps.LatLngLiteral>({lat: this.latitude(), lng: this.longitude()});
  zoomSignal = signal(13);
  maxDistanceKm = signal<number>(3.5);

  offerLocations = signal<OfferLocation[]>([]);
  infoWindowRef = viewChild.required(MapInfoWindow);

  // Computed signals para filtrar ofertas según categorías
  filteredMapOffers = computed(() => {
    const selected = this.selectedCategories();
    const locations = this.offerLocations();

    if (selected.includes('all')) {
      return locations;
    }

    return locations.filter(loc =>
      selected.some(catKey => this.offerMatchesCategory(loc.offer, catKey))
    );
  });

  filteredDisplayOffers = computed(() => {
    const selected = this.selectedCategories();
    const offers = this.allOffers();

    if (selected.includes('all')) {
      return offers;
    }

    return offers.filter(offer =>
      selected.some(catKey => this.offerMatchesCategory(offer, catKey))
    );
  });

  // Ofertas agrupadas por tipo para la vista
  cinemaOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();

    // Si 'cinemas' no está seleccionado y no es 'all', no mostrar
    if (!selected.includes('all') && !selected.includes('cinemas')) {
      return [];
    }

    return filtered.filter(o => this.offerMatchesCategory(o, 'cinemas'));
  });

  buffetOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();

    if (!selected.includes('all') && !selected.includes('buffets')) {
      return [];
    }

    return filtered.filter(o => this.offerMatchesCategory(o, 'buffets'));
  });

  parkOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();

    if (!selected.includes('all') && !selected.includes('parks')) {
      return [];
    }

    return filtered.filter(o => this.offerMatchesCategory(o, 'parks'));
  });

  mechGamesOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();

    if (!selected.includes('all') && !selected.includes('children')) {
      return [];
    }

    return filtered.filter(o => this.offerMatchesCategory(o, 'children'));
  });

  makisOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();

    if (!selected.includes('all') && !selected.includes('makis')) {
      return [];
    }

    return filtered.filter(o => this.offerMatchesCategory(o, 'makis'));
  });

  beautyOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();

    if (!selected.includes('all') && !selected.includes('beauty')) {
      return [];
    }

    return filtered.filter(o => this.offerMatchesCategory(o, 'beauty'));
  });

  constructor(
    private offersApi: OffersApiEndpoint,
    private favoritesApi: FavoritesApiEndpoint,
    private authService: AuthService
  )
  {}

  ngOnInit(): void {
    this.checkPermissionsOnLoad().then();

    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = user.id;
    } else {
      console.warn('[Home] No hay usuario autenticado');
    }

    this.currentUserId = this.authService.getCurrentUserId();

    if (!this.currentUserId) {
      console.warn('[Home] No hay usuario autenticado');
    }

    // Cargar todas las ofertas de una vez
    this.loadAllOffers();
    this.fetchFavs();
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
   * Selects the categories selected in the map filter. If the user selects All, it will only
   * select All category and unselects the other categories.
   * @param catKey - Detects which category was selected and pushes into selectedCategories array.
   */
  selectCategory(catKey: string) {
    if (catKey === 'all') {
      this.selectedCategories.set(['all']);
    } else {
      const current = this.selectedCategories();
      let updated = current.filter(c => c !== 'all');

      if (updated.includes(catKey)) {
        updated = updated.filter(c => c !== catKey);
      } else {
        updated.push(catKey);
      }

      // Si no hay categorías seleccionadas, volver a 'all'
      if (updated.length === 0) {
        updated = ['all'];
      }

      this.selectedCategories.set(updated);
    }
  }

  /**
   * Verifies if the category selected is in the selectedCategories array.
   * @param catKey - The string of the category
   * @returns If the category is in the selectedCategory array.
   */
  isCategoryActive(catKey: string): boolean {
    return this.selectedCategories().includes(catKey);
  }

  /**
   * Verifica si una oferta coincide con una categoría específica
   */
  private offerMatchesCategory(offer: Offer, categoryKey: string): boolean {
    const category = this.categories.find(cat => cat.key === categoryKey);
    if (!category) return false;

    const titleLower = offer.title.toLowerCase();
    const categoryLower = offer.category.toLowerCase();

    // Verificar si la categoría de BD coincide
    const categoryMatch = category.categories.some(cat =>
      categoryLower.includes(cat.toLowerCase())
    );

    // Verificar palabras clave en el título
    const titleMatch = category.titleKeywords.some(keyword =>
      titleLower.includes(keyword.toLowerCase())
    );

    // Verificar palabras clave de exclusión
    const hasExcludedKeyword = category.excludeKeywords?.some(keyword =>
      titleLower.includes(keyword.toLowerCase())
    ) || false;

    // Debe coincidir con categoría O título, pero NO tener keywords excluidas
    return (categoryMatch || titleMatch) && !hasExcludedKeyword;
  }

  /**
   * Obtiene las categorías de base de datos correspondientes a las categorías seleccionadas
   */
  private getDbCategoriesForSelected(selected: string[]): string[] {
    const dbCategories = new Set<string>();

    selected.forEach(key => {
      const category = this.categories.find(cat => cat.key === key);
      if (category && category.categories.length > 0) {
        category.categories.forEach(dbCat => dbCategories.add(dbCat));
      }
    });

    return Array.from(dbCategories);
  }

  /**
   * Function to get the url of the offer image
   * @param o - The offer that might have an image
   * @returns the url of the image, if there is not one, returns an empty string
   */
  imgFor(o: Offer | null): string {
    return !o ? '' : (o.imageUrl ?? `assets/offers/${o.id}.jpg`);
  }

  isFav(id: number) { return this.favSet.has(id); }

  toggleFav(o: Offer) {
    if (!this.currentUserId) {
      console.warn('[Ofertas] You have to log-in to add favorites');
      alert('Debes iniciar sesión para agregar favoritos');
      return;
    }

    if (this.favSet.has(o.id)) {
      // Eliminar favorito usando el endpoint directo
      this.favoritesApi.removeByUserAndOffer(this.currentUserId, o.id).subscribe({
        next: () => {
          this.favSet.delete(o.id);
        },
        error: (err) => {
          console.error('[Ofertas] Error al eliminar favorito:', err);
        }
      });
    } else {
      this.favoritesApi.add(this.currentUserId, o.id).subscribe(() => {
        this.favSet.add(o.id);
      });
    }
  }

  private fetchFavs() {
    if (!this.currentUserId) {
      this.favSet.clear();
      return;
    }
    this.favoritesApi.getByUser(this.currentUserId).subscribe({
      next: (rows) => {
        this.favSet = new Set<number>(rows.map((r) => r.offerId));
      },
      error: () => this.favSet.clear(),
    });
  }

  buyNow(o: Offer) {
    // Using hardcoded user ID for now - in real app would come from auth service
    const offerTitle = o.title;
    const offerImageUrl = this.imgFor(o);

    this.offersApi.recordCampaignClick(o.campaignId);
    // Add to cart and open sidebar
    this.cartStore.addItem(this.userId, o.id, offerTitle, o.price, offerImageUrl, 1);
    this.cartStore.openSidebar();
  }

  addToCart(o: Offer) {
    const offerTitle = o.title;
    const offerImageUrl = this.imgFor(o);

    this.offersApi.recordCampaignClick(o.campaignId);
    this.cartStore.addItem(this.userId, o.id, offerTitle, o.price, offerImageUrl, 1);
  }

  onViewOffer(offer: Offer) {
    this.offersApi.recordCampaignClick(offer.campaignId);
  }

  /**
   * @summary
   * Asks the user to get their location
   * Stores the latitude and longitude
   */
  getLocation(isLocationAllowed: boolean = false) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitude.set(position.coords.latitude);
        this.longitude.set(position.coords.longitude);
        this.center.set({lat: this.latitude(), lng: this.longitude()});
        this.locationAllowed.set(true);

        if(isLocationAllowed) {
          localStorage.setItem('locationAllowed','true');
        }

        // Generar ubicaciones aleatorias para las ofertas existentes
        this.generateOfferLocations();
      },
      (error) => {
        console.error('[Home] Error getting location:', error.message);
        // Usar ubicación por defecto (Lima centro)
        this.latitude.set(-12.0464);
        this.longitude.set(-77.0428);
        this.center.set({lat: this.latitude(), lng: this.longitude()});
      }
    )
  }

  /**
   * @summary Checks if geolocation was previously accepted
   */
  async checkPermissionsOnLoad() {
    const wasAllowed = localStorage.getItem('locationAllowed') === 'true';

    try {
      const permission = await navigator.permissions.query({name: 'geolocation'});

      if(permission.state === 'granted' && wasAllowed) {
        this.getLocation();
      }
    } catch (error) {
      console.warn('[Home] Could not query geolocation permission', error);
    }
  }

  /**
   * @summary Generates a location using Harvesine Formula
   * @param baseLat The user's latitude
   * @param baseLng The user's longitude
   * @param maxDistanceKm The maximum radius distance in kilometers
   */
  generateNearbyLocation(baseLat: number, baseLng: number, maxDistanceKm: number) {
    // Bounding box de Lima Metropolitana
    const minLat = -12.35;
    const maxLat = -11.75;
    const minLng = -77.20;
    const maxLng = -76.80;

    // 1 grado ≈ 111 km
    const kmToDeg = 1 / 111;

    // radio aleatorio (entre 0 km y max km)
    const randomDistKm = Math.random() * maxDistanceKm;
    const randomDistDeg = randomDistKm * kmToDeg;

    // dirección aleatoria
    const angle = Math.random() * 2 * Math.PI;

    // Nueva lat/lng generada alrededor de la base
    let newLat = baseLat + randomDistDeg * Math.cos(angle);
    let newLng = baseLng + randomDistDeg * Math.sin(angle);

    // Si se sale de Lima, lo reencerramos dentro del bounding box
    if (newLat < minLat) newLat = minLat;
    if (newLat > maxLat) newLat = maxLat;
    if (newLng < minLng) newLng = minLng;
    if (newLng > maxLng) newLng = maxLng;

    return { lat: newLat, lng: newLng };
  }

  openInfoWindow(location: OfferLocation, marker: MapAdvancedMarker) {
    const content = `
      <div style="padding: 8px; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #000;">${location.offer.title}</h3>
        <p style="margin: 0 0 4px 0; color: #A751D4; font-weight: 600;">${location.offer.partner}</p>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">📍 ${location.offer.location}</p>
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #000;">S/ ${location.offer.price.toFixed(2)}</p>
      </div>
    `;
    this.infoWindowRef().open(marker, true, content);
  }

  /**
   * Carga todas las ofertas desde el backend
   */
  private loadAllOffers() {
    this.offersApi.getAll().subscribe({
      next: (offers) => {
        this.allOffers.set(offers);
        this.trackFirstImpressions(offers);

        // Si la ubicación ya está permitida, generar ubicaciones
        if (this.locationAllowed()) {
          this.generateOfferLocations();
        }
      },
      error: (err) => {
        console.error('[Home] Error loading offers:', err);
      }
    });
  }

  /**
   * Genera ubicaciones aleatorias para todas las ofertas cerca del usuario
   */
  private generateOfferLocations() {
    const offers = this.allOffers();
    const baseLat = this.latitude();
    const baseLng = this.longitude();
    const maxDist = this.maxDistanceKm();

    const locations: OfferLocation[] = offers.map(offer => {
      const coords = this.generateNearbyLocation(baseLat, baseLng, maxDist);
      return {
        offer,
        lat: coords.lat,
        lng: coords.lng
      };
    });

    this.offerLocations.set(locations);
  }

  private trackFirstImpressions(offers: Offer[]): void {
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
    const unique = new Set<number>();
    offers.forEach(offer => {
      if (typeof offer.campaignId === 'number' && offer.campaignId > 0) {
        unique.add(offer.campaignId);
      }
    });
    return Array.from(unique);
  }

  /**
   * Actualiza el rango de distancia y regenera las ubicaciones
   */
  updateDistanceRange(newDistance: number) {
    this.maxDistanceKm.set(newDistance);

    // Ajustar zoom según distancia
    if (newDistance <= 2) {
      this.zoomSignal.set(14);
    } else if (newDistance <= 4) {
      this.zoomSignal.set(13);
    } else {
      this.zoomSignal.set(12);
    }

    if (this.locationAllowed()) {
      this.generateOfferLocations();
    }
  }
}
