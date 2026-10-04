import { Component, inject, signal, OnInit } from '@angular/core';
import {Router, RouterLink, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { FooterContent } from '../footer-content/footer-content';
import { ConsumerToolbar } from '../../../../loyalty/presentation/components/consumer-toolbar/consumer-toolbar';
import { OwnerToolbarComponent } from '../../../../loyalty/presentation/components/owner-toolbar/owner-toolbar.component';
import {TranslateModule} from '@ngx-translate/core';
import {LanguageSwitcher} from '../language-switcher/language-switcher';
import { CartSidebarComponent } from '../../../../cart/presentation/components/cart-sidebar/cart-sidebar.component';
import { CartStore } from '../../../../cart/application/cart.store';
import {AuthService} from '../../../../identity/infrastructure/auth/auth.service';
import {CommonModule} from '@angular/common';
import { NavigationLoadingService } from '../../services/navigation-loading.service';
import { NavigationBackdropComponent } from '../navigation-backdrop/navigation-backdrop.component';
import { NotificationsDropdownComponent } from '../../../../notifications/presentation/components/notifications-dropdown/notifications-dropdown.component';
import { NotificationsStore } from '../../../../notifications/application/notifications.store';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatDividerModule,
    FooterContent,
    ConsumerToolbar,
    OwnerToolbarComponent,
    TranslateModule,
    LanguageSwitcher,
    CartSidebarComponent,
    CommonModule,
    NavigationBackdropComponent,
    NotificationsDropdownComponent,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
  readonly cartStore = inject(CartStore);
  readonly notificationsStore = inject(NotificationsStore);
  private readonly navigationLoadingService = inject(NavigationLoadingService);

  q = '';
  userName = 'Usuario';
  userEmail = 'usuario@geops.com';
  isMobileMenuOpen = signal(false);
  isSearchFocused = signal(false);
  isOwner = signal(false);

  // Use cartStore's signals directly
  cartCount = this.cartStore.totalItems;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Listen to navigation events to show/hide backdrop
    this.router.events.pipe(
      filter(event =>
        event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      )
    ).subscribe(event => {
      if (event instanceof NavigationStart) {
        // Show backdrop when navigation starts
        this.navigationLoadingService.showBackdrop();
      } else {
        // Hide backdrop when navigation ends, is cancelled, or errors
        setTimeout(() => {
          this.navigationLoadingService.hideBackdrop();
        }, 300); // Small delay to ensure smooth transition
      }
    });
  }
  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name;
      this.userEmail = user.email || 'usuario@geops.com';
      this.isOwner.set(user.role === 'OWNER');

      // Load notifications for authenticated user
      this.notificationsStore.loadNotifications(user.id);
    } else {
      console.warn('[Layout] No hay usuario autenticado');
    }
    // No need to subscribe - cartStore handles everything internally
  }

  get userInitial() {
    const n = this.userName?.trim();
    return n ? n[0].toUpperCase() : '?';
  }

  doSearch() {
    const term = this.q.trim();
    if (term) {
      this.router.navigate(['/ofertas'], { queryParams: { q: term } });
      this.isSearchFocused.set(false);
      this.closeMobileMenu();
    }
  }

  clearSearch() {
    this.q = '';
    this.router.navigate(['/ofertas']);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  onSearchFocus() {
    this.isSearchFocused.set(true);
  }

  onSearchBlur() {
    setTimeout(() => this.isSearchFocused.set(false), 200);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


