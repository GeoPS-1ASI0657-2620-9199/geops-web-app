import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GeoSeal } from '../geo-seal/geo-seal';

const MAX_STARS = 5;

/**
 * Offer card of the Figma "Tarjeta de oferta" component.
 * Rules: real photo, validity always visible, price in the brand color and distance in green
 * (the only two accents), tabular figures. A reference offer has a dashed amber border.
 * The actions (reserve, save) go as content so each screen decides them.
 */
@Component({
  selector: 'geo-offer-card',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, GeoSeal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card" [class.reference]="kind() === 'reference'">
      @if (imageUrl(); as url) {
        <img class="photo" [src]="url" [alt]="title()" [attr.loading]="priority() ? 'eager' : 'lazy'" />
      } @else if (category()) {
        <div class="photo placeholder" aria-hidden="true">
          <mat-icon>sell</mat-icon>
          <span>{{ category() }}</span>
        </div>
      }
      <div class="content">
        <h3 class="geo-card-title title">{{ title() }}</h3>
        <div class="merchant-row">
          <span class="merchant">{{ merchant() }}</span>
          @if (kind() !== 'standard') {
            <geo-seal [kind]="kind() === 'reference' ? 'reference' : 'verified'" />
          }
        </div>
        @if (rating() !== null) {
          <div class="rating" [attr.aria-label]="'Valoración ' + rating() + ' de 5'">
            @for (star of stars(); track $index) {
              <mat-icon aria-hidden="true" [class.filled]="star.filled">{{ star.name }}</mat-icon>
            }
            <span class="geo-meta">{{ rating() | number: '1.1-1' }}</span>
          </div>
        }
        <p class="validity geo-meta"><span class="dot"></span>{{ validity() }}</p>
        <div class="figures">
          <span class="price geo-tabular">
            <small>S/</small> {{ price() | number: '1.2-2' }}
            @if (regularPrice()) {
              <s class="regular">S/ {{ regularPrice() | number: '1.2-2' }}</s>
            }
          </span>
          @if (distanceMeters() !== null) {
            <span class="distance geo-tabular">
              <mat-icon class="filled" aria-hidden="true">location_on</mat-icon>
              {{ distanceMeters() }} m · {{ walkMinutes() }} min
            </span>
          }
        </div>
        <div class="actions"><ng-content /></div>
      </div>
    </article>
  `,
  styles: [
    `
      .card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--neutral-bg);
        border: 1px solid var(--neutral-line);
        border-radius: var(--radius-card);
      }
      .card.reference { border: 1.5px dashed var(--status-reference); }
      .photo { width: 100%; height: 148px; object-fit: cover; background: var(--neutral-line-soft); }
      .placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-xs);
        height: 96px;
        background: var(--brand-mist);
        color: var(--brand-deep);
        font: 500 12px/1.3 var(--font-brand);
      }
      .content { display: flex; flex-direction: column; gap: 6px; padding: var(--space-md) var(--space-lg) var(--space-lg); }
      .title { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .merchant-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); }
      .merchant { font: 400 11px/1.3 var(--font-brand); color: var(--brand-action); }
      .rating { display: flex; align-items: center; gap: 1px; color: var(--status-rating); }
      .rating mat-icon { width: 13px; height: 13px; font-size: 13px; }
      .rating .geo-meta { margin-left: var(--space-xs); }
      .validity { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--text-primary); }
      .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--status-verified); }
      .figures { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-sm); }
      .price { font: 700 20px/1.14 var(--font-brand); color: var(--brand-action); }
      .price small { font-size: 12px; font-weight: 500; }
      .regular { margin-left: 4px; font: 400 11px/1 var(--font-brand); color: var(--text-faint); }
      .distance { display: inline-flex; align-items: center; gap: 2px; font: 500 11px/1 var(--font-brand); color: var(--status-verified); }
      .distance mat-icon { width: 14px; height: 14px; font-size: 14px; }
      /* Material Symbols draw the filled glyph through the FILL axis of the font. */
      .filled { font-variation-settings: 'FILL' 1; }
      .actions { display: flex; gap: var(--space-sm); margin-top: var(--space-xs); }
      .actions:empty { display: none; }
    `,
  ],
})
export class GeoOfferCard {
  /** verified: business with seal · reference: public source without guarantee · standard: neither. */
  readonly kind = input<'verified' | 'reference' | 'standard'>('verified');
  readonly title = input.required<string>();
  readonly merchant = input.required<string>();
  /** Photo of the offer; Catalog does not send one in the Sprint 1, so the category stands in. */
  readonly imageUrl = input<string | null>(null);
  readonly category = input<string | null>(null);
  readonly validity = input.required<string>();
  readonly price = input.required<number>();
  readonly regularPrice = input<number | null>(null);
  readonly rating = input<number | null>(null);
  readonly distanceMeters = input<number | null>(null);
  readonly walkMinutes = input<number | null>(null);
  /** True for the cards visible on load, so their photo is not lazy loaded. */
  readonly priority = input(false);

  /** Glyph and fill of each of the five stars, half stars included. */
  protected readonly stars = computed(() => {
    const value = this.rating() ?? 0;
    return Array.from({ length: MAX_STARS }, (_, i) =>
      value >= i + 1
        ? { name: 'star', filled: true }
        : value >= i + 0.5
          ? { name: 'star_half', filled: true }
          : { name: 'star', filled: false },
    );
  });
}
