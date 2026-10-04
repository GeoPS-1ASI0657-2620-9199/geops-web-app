import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { User } from '../../../domain/model/user.entity';
import { DetailsConsumer } from '../../../domain/model/details-consumer.entity';
import { DetailsConsumerService } from '../../../infrastructure/users/details-consumer.service';
import { FavoritesApiEndpoint } from '../../../../loyalty/infrastructure/favorites/favorites-api-endpoint';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

/**
 * ProfilesComponent displays user profile information and favorite count.
 * Fetches user data and favorites on initialization.
 */
@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule, TranslateModule],
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.css']
})
export class ProfilesComponent implements OnInit {
  user: User | null = null;
  consumerDetails: DetailsConsumer | null = null;
  favoriteCount: number = 0;
  browserLocationPermission: string = 'ASK'; // Track browser permission state

  /**
   * Initializes ProfilesComponent with AuthService and FavoritesApiEndpoint.
   * @param authService Service for user authentication and data
   * @param favoritesApi Service for retrieving user favorites
   * @param detailsConsumerService Service for retrieving consumer details
   */
  constructor(
    private authService: AuthService,
    private favoritesApi: FavoritesApiEndpoint,
    private detailsConsumerService: DetailsConsumerService
  ) {}

  /**
   * Lifecycle hook that runs on component initialization.
   * Loads current user and fetches favorite count.
   */
  ngOnInit() {
    this.user = this.authService.getCurrentUser();

    if (this.user?.id) {
      // Load favorites count
      this.favoritesApi.getByUser(this.user.id).subscribe({
        next: (favoriteRows) => {
          this.favoriteCount = favoriteRows.length;
        },
        error: (err) => {
          console.error('Error fetching favorites:', err);
          this.favoriteCount = 0;
        }
      });

      // Load consumer details if user is a consumer
      if (this.user.role === 'CONSUMER') {
        this.detailsConsumerService.getByUserId(this.user.id).subscribe({
          next: (details) => {
            this.consumerDetails = details;
            // Check browser location permission after loading details
            this.checkBrowserLocationPermission();
          },
          error: (err) => {
            console.error('Error fetching consumer details:', err);
            this.consumerDetails = null;
          }
        });
      }
    }
  }

  /**
   * Checks the current browser geolocation permission status
   * and updates the browserLocationPermission property
   */
  private async checkBrowserLocationPermission(): Promise<void> {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });

        switch (permission.state) {
          case 'granted':
            this.browserLocationPermission = 'ALWAYS';
            break;
          case 'denied':
            this.browserLocationPermission = 'DENIED';
            break;
          case 'prompt':
          default:
            this.browserLocationPermission = 'ASK';
            break;
        }

        // Listen for permission changes
        permission.addEventListener('change', () => {
          switch (permission.state) {
            case 'granted':
              this.browserLocationPermission = 'ALWAYS';
              break;
            case 'denied':
              this.browserLocationPermission = 'DENIED';
              break;
            case 'prompt':
            default:
              this.browserLocationPermission = 'ASK';
              break;
          }
        });
      } catch (error) {
        console.warn('[ProfileComponent] Could not check geolocation permission:', error);
        this.browserLocationPermission = 'ASK';
      }
    } else {
      console.warn('[ProfileComponent] Permissions API not supported');
      this.browserLocationPermission = 'ASK';
    }
  }

  /**
   * Returns the first letter of the user's name in uppercase for avatar display.
   */
  get avatar(): string {
    return this.user?.name ? this.user.name.charAt(0).toUpperCase() : '';
  }

  /**
   * Returns the location permission status from browser.
   * This getter is used in the component template (profiles.component.html).
   */
  get locationPermission(): string {
    return this.browserLocationPermission;
  }

  /**
   * Returns a formatted string with the user's saved places (home, work, university).
   */
  get places(): string {
    if (!this.consumerDetails) return '';
    const home = this.consumerDetails.direccionCasa ? `Casa: ${this.consumerDetails.direccionCasa}` : '';
    const work = this.consumerDetails.direccionTrabajo ? `Trabajo: ${this.consumerDetails.direccionTrabajo}` : '';
    const university = this.consumerDetails.direccionUniversidad ? `Universidad: ${this.consumerDetails.direccionUniversidad}` : '';
    return [home, work, university].filter(Boolean).join('<br>');
  }
}
