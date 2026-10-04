import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { CampaignOffer } from '../../../domain/model/offer.entity';

/**
 * CampaignOffersListComponent
 *
 * List component for managing campaign offers.
 * Shows offers with edit and delete actions.
 */
@Component({
  selector: 'app-campaign-offers-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, TranslateModule],
  templateUrl: './campaign-offers-list.component.html',
  styleUrls: ['./campaign-offers-list.component.css']
})
export class CampaignOffersListComponent {
  @Input() offers: CampaignOffer[] = [];
  @Input() readonly: boolean = false;

  @Output() editOffer = new EventEmitter<CampaignOffer>();
  @Output() deleteOffer = new EventEmitter<number>();

  onEdit(offer: CampaignOffer): void {
    this.editOffer.emit(offer);
  }

  onDelete(offerId: number): void {
    this.deleteOffer.emit(offerId);
  }
}
