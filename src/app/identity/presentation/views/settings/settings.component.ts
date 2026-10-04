import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { User } from '../../../domain/model/user.entity';
import { DetailsConsumer } from '../../../domain/model/details-consumer.entity';
import { DetailsOwner } from '../../../domain/model/details-owner.entity';
import { DetailsConsumerService } from '../../../infrastructure/users/details-consumer.service';
import { DetailsOwnerService } from '../../../infrastructure/users/details-owner.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

/**
 * SettingsComponent allows users to view and update their profile settings,
 * including personal information, password, and role-specific details.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSlideToggleModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: User | null = null;
  consumerDetails: DetailsConsumer | null = null;
  ownerDetails: DetailsOwner | null = null;

  mensaje = '';
  cargando = false;

  passwordActual = '';
  newPassword = '';
  confirmPassword = '';

  /** List of all available categories for favorites */
  readonly ALL_CATEGORIES: string[] = [
    'Infantil','Entretenimiento','Viajes','Sushi','Moda','Tecnología','Belleza','Salud','Deporte'
  ];

  /** Tracks which fields are in edit mode */
  editState: Record<string, boolean> = {
    name: false,
    email: false,
    phone: false,
    businessName: false,
    businessType: false,
    taxId: false,
    website: false,
    description: false,
    address: false,
    horarioAtencion: false,
    direccionCasa: false,
    direccionTrabajo: false,
    direccionUniversidad: false,
    passwordActual: false,
    newPassword: false,
    confirmPassword: false
  };

  /**
   * Initializes SettingsComponent with required services.
   */
  constructor(
    private authService: AuthService,
    private detailsConsumerService: DetailsConsumerService,
    private detailsOwnerService: DetailsOwnerService
  ) {}

  /**
   * Loads user and role-specific details on component initialization.
   */
  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user?.id) {
      // Migración automática: Corregir planes inválidos (FREEMIUM)
      if (this.user.plan !== 'BASIC' && this.user.plan !== 'PREMIUM') {
        console.warn('[SettingsComponent] Invalid plan detected:', this.user.plan, '- Migrating to BASIC');
        this.user.plan = 'BASIC';
        // Actualizar el usuario en el servicio
        this.authService.setCurrentUser(this.user);
      }

      this.loadRoleSpecificDetails();

      // Check browser permissions status and sync with UI
      this.checkBrowserPermissions();
    }
  }

  /**
   * Checks current browser permissions for notifications and location
   * and syncs the toggle states accordingly
   */
  private async checkBrowserPermissions(): Promise<void> {
    // Wait for consumer details to load first
    setTimeout(async () => {
      if (!this.consumerDetails) return;

      // Check notification permission
      if ('Notification' in window) {
        const notificationPermission = Notification.permission;

        if (notificationPermission === 'granted') {
          this.consumerDetails.recibirNotificaciones = true;
        } else if (notificationPermission === 'denied') {
          this.consumerDetails.recibirNotificaciones = false;
        }
      }

      // Check geolocation permission (requires API check)
      if ('permissions' in navigator) {
        try {
          const locationPermission = await navigator.permissions.query({ name: 'geolocation' });

          if (locationPermission.state === 'granted') {
            this.consumerDetails.permisoUbicacion = true;
          } else if (locationPermission.state === 'denied') {
            this.consumerDetails.permisoUbicacion = false;
          }
        } catch (error) {
          console.warn('[SettingsComponent] Could not check geolocation permission:', error);
        }
      }
    }, 500); // Wait 500ms for details to load
  }

  /**
   * Loads details based on user role (CONSUMER or OWNER)
   */
  private loadRoleSpecificDetails(): void {
    if (!this.user) return;

    this.cargando = true;

    if (this.user.role === 'CONSUMER') {
      this.detailsConsumerService.getByUserId(this.user.id).subscribe({
        next: (details) => {
          // If details is null (404 from service), create empty details
          this.consumerDetails = details || this.createEmptyConsumerDetails();
          this.cargando = false;
        },
        error: (error) => {
          console.error('[SettingsComponent] Error loading consumer details:', error);
          this.cargando = false;
          // Initialize empty details if error occurs
          this.consumerDetails = this.createEmptyConsumerDetails();
        }
      });
    } else if (this.user.role === 'OWNER') {
      this.detailsOwnerService.getByUserId(this.user.id).subscribe({
        next: (details) => {
          // If details is null (404 from service), create empty details
          this.ownerDetails = details || this.createEmptyOwnerDetails();
          this.cargando = false;
        },
        error: (error) => {
          console.error('[SettingsComponent] Error loading owner details:', error);
          this.cargando = false;
          // Initialize empty details if error occurs
          this.ownerDetails = this.createEmptyOwnerDetails();
        }
      });
    }
  }

  /**
   * Creates empty consumer details structure
   */
  private createEmptyConsumerDetails(): DetailsConsumer {
    return {
      id: this.user!.id,
      userId: this.user!.id,
      categoriasFavoritas: '',
      recibirNotificaciones: false,
      permisoUbicacion: false,
      direccionCasa: '',
      direccionTrabajo: '',
      direccionUniversidad: ''
    };
  }

  /**
   * Creates empty owner details structure
   */
  private createEmptyOwnerDetails(): DetailsOwner {
    return {
      id: this.user!.id,
      userId: this.user!.id,
      businessName: '',
      businessType: '',
      taxId: '',
      website: '',
      description: '',
      address: '',
      horarioAtencion: ''
    };
  }

  /**
   * Checks if current user is a consumer
   */
  get isConsumer(): boolean {
    return this.user?.role === 'CONSUMER';
  }

  /**
   * Checks if current user is an owner
   */
  get isOwner(): boolean {
    return this.user?.role === 'OWNER';
  }

  /**
   * Returns the first letter of the user's name in uppercase for avatar display.
   */
  get avatar(): string {
    return this.user?.name ? this.user.name.charAt(0).toUpperCase() : '';
  }

  /**
   * Toggles edit mode for a given field.
   * @param key Field name to toggle
   */
  toggleEdit(key: string): void {
    this.editState[key] = !this.editState[key];
  }

  /**
   * Handles changes to favorite categories.
   * @param evt Event from the checkbox
   * @param cat Category name
   */
  onCategoryChange(evt: Event, cat: string): void {
    if (!this.consumerDetails) return;
    const checked = (evt.target as HTMLInputElement).checked;

    // Parse current favorites
    const currentFavorites = this.consumerDetails.categoriasFavoritas
      ? this.consumerDetails.categoriasFavoritas.split(',').map(s => s.trim()).filter(s => s)
      : [];

    const favs = new Set<string>(currentFavorites);
    checked ? favs.add(cat) : favs.delete(cat);

    // Update as comma-separated string
    this.consumerDetails.categoriasFavoritas = Array.from(favs).join(', ');
  }

  /**
   * Checks if a category is in favorites
   */
  isCategoryFavorite(cat: string): boolean {
    if (!this.consumerDetails?.categoriasFavoritas) return false;
    const favorites = this.consumerDetails.categoriasFavoritas
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
    return favorites.includes(cat);
  }

  /**
   * Returns the appropriate icon for each category
   */
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'Infantil': 'child_care',
      'Entretenimiento': 'theaters',
      'Viajes': 'flight',
      'Sushi': 'restaurant',
      'Moda': 'checkroom',
      'Tecnología': 'devices',
      'Belleza': 'spa',
      'Salud': 'favorite',
      'Deporte': 'fitness_center'
    };
    return iconMap[category] || 'category';
  }

  /**
   * Handles notification permission toggle
   * Requests browser notification permission when enabled
   */
  async onNotificationsToggle(event: any): Promise<void> {
    if (!this.consumerDetails) return;

    const isEnabled = event.checked;

    if (isEnabled) {
      // Request notification permission from browser
      if ('Notification' in window) {
        try {
          // Check if already granted
          if (Notification.permission === 'granted') {
            this.consumerDetails.recibirNotificaciones = true;

            // Show a test notification
            new Notification('GeOps', {
              body: 'Las notificaciones están activas',
              icon: '/favicon.ico'
            });

            this.mensaje = 'Notificaciones activadas correctamente';
            setTimeout(() => (this.mensaje = ''), 3000);
            return;
          }

          // Request permission
          const permission = await Notification.requestPermission();

          if (permission === 'granted') {
            this.consumerDetails.recibirNotificaciones = true;

            // Show a test notification
            new Notification('GeOps', {
              body: 'Las notificaciones han sido activadas correctamente',
              icon: '/favicon.ico'
            });

            this.mensaje = 'Notificaciones activadas correctamente';
            setTimeout(() => (this.mensaje = ''), 3000);
          } else {
            // Permission denied, revert toggle
            this.consumerDetails.recibirNotificaciones = false;
            this.mensaje = 'Permiso de notificaciones denegado. Por favor, activa los permisos en tu navegador.';
            setTimeout(() => (this.mensaje = ''), 4000);
          }
        } catch (error) {
          console.error('[SettingsComponent] Error requesting notification permission:', error);
          this.consumerDetails.recibirNotificaciones = false;
          this.mensaje = 'Error al solicitar permisos de notificaciones';
          setTimeout(() => (this.mensaje = ''), 3000);
        }
      } else {
        // Browser doesn't support notifications
        this.consumerDetails.recibirNotificaciones = false;
        this.mensaje = 'Tu navegador no soporta notificaciones';
        setTimeout(() => (this.mensaje = ''), 3000);
        console.warn('[SettingsComponent] Notifications not supported in this browser');
      }
    } else {
      // User is disabling notifications
      this.consumerDetails.recibirNotificaciones = false;
      this.mensaje = 'Notificaciones desactivadas';
      setTimeout(() => (this.mensaje = ''), 2000);
    }
  }

  /**
   * Handles location permission toggle
   * Requests browser geolocation permission when enabled
   */
  async onLocationToggle(event: any): Promise<void> {
    if (!this.consumerDetails) return;

    const isEnabled = event.checked;

    if (isEnabled) {
      // Request geolocation permission from browser
      if ('geolocation' in navigator) {
        try {
          // Request permission by attempting to get current position
          navigator.geolocation.getCurrentPosition(
            (position) => {
              // Permission granted
              this.consumerDetails!.permisoUbicacion = true;
              this.mensaje = 'Ubicación activada correctamente';
              setTimeout(() => (this.mensaje = ''), 3000);
            },
            (error) => {
              // Permission denied or error
              this.consumerDetails!.permisoUbicacion = false;

              let errorMsg = 'Permiso de ubicación denegado';
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMsg = 'Permiso de ubicación denegado. Por favor, activa los permisos en tu navegador.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMsg = 'Ubicación no disponible en este momento';
                  break;
                case error.TIMEOUT:
                  errorMsg = 'Tiempo de espera agotado al obtener ubicación';
                  break;
              }

              this.mensaje = errorMsg;
              setTimeout(() => (this.mensaje = ''), 4000);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        } catch (error) {
          console.error('[SettingsComponent] Error requesting location permission:', error);
          this.consumerDetails.permisoUbicacion = false;
          this.mensaje = 'Error al solicitar permisos de ubicación';
          setTimeout(() => (this.mensaje = ''), 3000);
        }
      } else {
        // Browser doesn't support geolocation
        this.consumerDetails.permisoUbicacion = false;
        this.mensaje = 'Tu navegador no soporta geolocalización';
        setTimeout(() => (this.mensaje = ''), 3000);
        console.warn('[SettingsComponent] Geolocation not supported in this browser');
      }
    } else {
      // User is disabling location
      this.consumerDetails.permisoUbicacion = false;
      this.mensaje = 'Ubicación desactivada';
      setTimeout(() => (this.mensaje = ''), 2000);
    }
  }

  /**
   * Saves the updated user profile and role-specific details.
   * Handles both user base information and consumer/owner details.
   */
  guardar(): void {
    if (!this.user) return;
    this.cargando = true;
    this.mensaje = '';

    // Create observables array for parallel requests
    const saveOperations: any[] = [];

    // Always update user base information
    saveOperations.push(this.authService.updateUser(this.user));

    // Add role-specific details save operation
    if (this.user.role === 'CONSUMER' && this.consumerDetails) {
      const consumerResource = {
        categoriasFavoritas: this.consumerDetails.categoriasFavoritas || '',
        recibirNotificaciones: this.consumerDetails.recibirNotificaciones,
        permisoUbicacion: this.consumerDetails.permisoUbicacion,
        direccionCasa: this.consumerDetails.direccionCasa || '',
        direccionTrabajo: this.consumerDetails.direccionTrabajo || '',
        direccionUniversidad: this.consumerDetails.direccionUniversidad || ''
      };
      saveOperations.push(
        this.detailsConsumerService.createOrUpdate(this.user.id, consumerResource)
      );
    } else if (this.user.role === 'OWNER' && this.ownerDetails) {
      const ownerResource = {
        businessName: this.ownerDetails.businessName,
        businessType: this.ownerDetails.businessType || '',
        taxId: this.ownerDetails.taxId || '',
        website: this.ownerDetails.website || '',
        description: this.ownerDetails.description || '',
        address: this.ownerDetails.address || '',
        horarioAtencion: this.ownerDetails.horarioAtencion || ''
      };
      saveOperations.push(
        this.detailsOwnerService.createOrUpdate(this.user.id, ownerResource)
      );
    }

    // Execute all save operations in parallel
    forkJoin(saveOperations).subscribe({
      next: (results: any[]) => {
        this.cargando = false;
        this.mensaje = 'Perfil actualizado correctamente';

        // Update local data with server response
        if (results.length > 0) {
          this.user = results[0]; // First result is always user
        }
        if (results.length > 1 && results[1]) {
          // Second result is role-specific details
          if (this.user?.role === 'CONSUMER') {
            this.consumerDetails = results[1] as DetailsConsumer;
          } else if (this.user?.role === 'OWNER') {
            this.ownerDetails = results[1] as DetailsOwner;
          }
        }

        setTimeout(() => (this.mensaje = ''), 3000);
      },
      error: (error) => {
        console.error('[SettingsComponent] Error updating profile:', error);
        this.cargando = false;
        this.mensaje = 'Error al actualizar el perfil';
        setTimeout(() => (this.mensaje = ''), 3000);
      }
    });
  }

  /**
   * Cancels editing and reloads the last persisted user state.
   */
  cancelar(): void {
    this.user = this.authService.getCurrentUser();
    this.mensaje = '';
    Object.keys(this.editState).forEach(k => (this.editState[k] = false));

    // Reload role-specific details
    if (this.user?.id) {
      this.loadRoleSpecificDetails();
    }
  }

  /**
   * Updates the user's password after validation.
   * Resets password fields and edit states on success.
   */
  actualizarPassword(): void {
    if (!this.user) return;

    if ((this.user.password ?? '') !== this.passwordActual) {
      this.mensaje = 'La contraseña actual es incorrecta';
      return;
    }
    if (this.newPassword.trim().length < 6) {
      this.mensaje = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.mensaje = 'Las nuevas contraseñas no coinciden';
      return;
    }

    this.user.password = this.newPassword;
    this.mensaje = 'Contraseña actualizada correctamente';

    this.passwordActual = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.editState['passwordActual'] = false;
    this.editState['newPassword'] = false;
    this.editState['confirmPassword'] = false;

    // Persistir el cambio
    this.guardar();
  }

}
