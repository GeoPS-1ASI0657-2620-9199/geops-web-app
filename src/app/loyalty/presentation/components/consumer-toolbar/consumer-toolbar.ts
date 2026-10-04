import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

/**
 * ConsumerToolbarComponent
 *
 * Barra de navegación específica para usuarios con rol CONSUMER.
 * Muestra las opciones: Home, Ofertas, Categorías, Favoritos, Mis Cupones
 */
@Component({
  selector: 'app-consumer-toolbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './consumer-toolbar.component.html',
  styleUrls: ['./consumer-toolbar.component.css']
})
export class ConsumerToolbar {}
