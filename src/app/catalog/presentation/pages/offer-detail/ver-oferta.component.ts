import { MatIconModule } from '@angular/material/icon';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { OffersApiEndpoint } from '../../../infrastructure/offers/offers-api-endpoint';
import {AuthService} from '../../../../iam/infrastructure/auth.service';
import { Offer } from '../../../domain/model/offer.entity';

@Component({
  selector: 'app-ver-oferta',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatIconModule],
  templateUrl: './ver-oferta.component.html',
  styleUrls: ['./ver-oferta.component.css'],
})

/**
 * offer detail screen
 */
export class VerOfertaComponent implements OnInit {
  offer?: Offer;
  loading = false;
  private userId: number | null = null;

  from: 'offers' | 'favorites' | null = null;

  /**
   * creates an instance of the 'viewOfferComponent' component
   * @param route
   * @param router
   * @param location
   * @param offersApi
   * @param auth
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private offersApi: OffersApiEndpoint,
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
    this.router.navigate(['/offers']);
  }

  /**
   * returns the URL of the offer image
   */
  imgFor(): string {
    return this.offer?.imageUrl ?? `assets/offers/${this.offer?.id}.jpg`;
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

  protected readonly String = String;
}
