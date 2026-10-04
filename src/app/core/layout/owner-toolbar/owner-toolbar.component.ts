import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

/**
 * OwnerToolbarComponent
 *
 * Barra de navegación específica para usuarios con rol OWNER.
 * Muestra las opciones: Resumen, Campañas, Crear, Reportes, Comentarios
 */
@Component({
  selector: 'app-owner-toolbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './owner-toolbar.component.html',
  styleUrls: ['./owner-toolbar.component.css']
})
export class OwnerToolbarComponent {
  /** Secciones del menú de owner */
  menuItems = [
    { labelKey: 'ownerToolbar.campaigns', route: '/campaigns', icon: 'campaign' },
    { labelKey: 'ownerToolbar.create', route: '/campaigns/new', icon: 'add_circle' }
  ];

  activeRoute = '/owner-dashboard';

  /**
   * Verifica si una ruta está activa
   */
  isActive(route: string): boolean {
    return this.activeRoute === route;
  }

  /**
   * Navega a una sección
   */
  navigateTo(route: string): void {
    this.activeRoute = route;
  }
}

