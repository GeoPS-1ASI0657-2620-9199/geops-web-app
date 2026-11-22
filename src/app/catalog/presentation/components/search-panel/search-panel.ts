import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { MAX_RADIUS_MINUTES, MIN_RADIUS_MINUTES, RADIUS_STEP_MINUTES } from '../../../domain/model/nearby-offer';
import { OFFER_ORDERS, OfferOrder } from '../../offer-order';

/**
 * "Panel de búsqueda" of the Figma screen 1: where the search starts ("Lugares"), the radius in
 * walking minutes and the category chips. The map or the list goes inside as content.
 */
@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [MatIconModule, MatSelectModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="row">
        <span class="label">{{ 'search.places' | translate }}</span>
        <span class="place" [class.approx]="approximate()">
          <mat-icon aria-hidden="true">location_on</mat-icon>{{ placeLabel() }}
        </span>
        <button class="link" type="button" (click)="changeDistrict.emit()">{{ 'search.changeDistrict' | translate }}</button>
        <span class="spacer"></span>
        <!-- Each label travels with its select when the row wraps on a phone. -->
        <span class="field">
          <span class="label">{{ 'search.radius' | translate }}</span>
          <mat-select
            class="radius"
            panelWidth="160px"
            [value]="radius()"
            (selectionChange)="radiusChange.emit($event.value)"
            [attr.aria-label]="'search.radius' | translate">
            @for (minutes of radiusOptions(); track minutes) {
              <mat-option [value]="minutes">{{ 'search.minutes' | translate: { minutes } }}</mat-option>
            }
          </mat-select>
        </span>
        @if (order(); as current) {
          <span class="field">
            <span class="label">{{ 'search.orderBy' | translate }}</span>
            <mat-select
              class="radius order"
              panelWidth="180px"
              [value]="current"
              (selectionChange)="orderChange.emit($event.value)"
              [attr.aria-label]="'search.orderBy' | translate">
              @for (item of orders; track item) {
                <mat-option [value]="item">{{ 'categoriesPage.order.' + item | translate }}</mat-option>
              }
            </mat-select>
          </span>
        }
      </div>
      @if (showCategories() && categories().length) {
        <div class="chips" role="group" [attr.aria-label]="'search.categories' | translate">
          <button type="button" class="chip" [class.on]="!category()" [attr.aria-pressed]="!category()" (click)="categoryChange.emit(null)">
            {{ 'search.all' | translate }}
          </button>
          @for (item of categories(); track item) {
            <button
              type="button"
              class="chip"
              [class.on]="category() === item"
              [attr.aria-pressed]="category() === item"
              (click)="categoryChange.emit(item)">
              {{ item }}
            </button>
          }
        </div>
      }
      <ng-content />
    </section>
  `,
  styles: [
    `
      .panel {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 16px 18px 18px;
        background: var(--neutral-bg);
        border: 1px solid var(--neutral-line);
        border-radius: var(--radius-panel);
      }
      .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-md); }
      .label { font: 500 13px/1.45 var(--font-brand); color: var(--text-primary); }
      .place {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 30px;
        padding: 0 14px 0 10px;
        border: 1px solid var(--feedback-purple-border);
        border-radius: var(--radius-chip);
        background: var(--brand-mist);
        font: 500 12px/1 var(--font-brand);
        color: var(--brand-deep);
      }
      .place mat-icon { width: 14px; height: 14px; font-size: 14px; color: var(--brand-action); font-variation-settings: 'FILL' 1; }
      .place.approx { border-color: var(--feedback-amber-border); background: var(--feedback-amber-bg); color: var(--feedback-amber-ink); }
      .link {
        border: 0;
        background: none;
        padding: 0;
        font: 500 12.5px/1 var(--font-brand);
        color: var(--brand-action);
        cursor: pointer;
      }
      .spacer { flex: 1; }
      .field { display: inline-flex; flex: none; align-items: center; gap: var(--space-sm); }
      .radius {
        width: 120px;
        height: 32px;
        padding: 6px 12px;
        border: 1px solid var(--neutral-line);
        border-radius: var(--radius-input);
        font: 400 12.5px/1.4 var(--font-brand);
      }
      .chips { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
      .chip {
        height: 26px;
        padding: 0 14px;
        border: 1px solid var(--neutral-line);
        border-radius: var(--radius-chip);
        background: var(--neutral-bg);
        font: 400 11.5px/1 var(--font-brand);
        color: var(--text-primary);
        cursor: pointer;
      }
      .chip.on { border-color: var(--brand-action); background: var(--brand-action); color: var(--neutral-bg); font-weight: 500; }
      .order { width: 150px; }
      @media (max-width: 720px) {
        .panel { padding: 14px 16px; }
        /*
         * One row that scrolls sideways, so the first offer stays on the first screen. The fade on the
         * right edge, as in the tabs, tells there are more chips instead of cutting them at the border.
         */
        .chips {
          flex-wrap: nowrap;
          overflow-x: auto;
          margin: 0 -16px;
          padding: 0 16px 2px;
          scrollbar-width: none;
          mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent);
          -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 40px), transparent);
        }
        .chips::-webkit-scrollbar { display: none; }
        .chip { flex: none; height: 40px; font-size: 13px; }
        .chip:last-child { margin-right: 32px; }
        .link { min-height: 40px; }
        .radius, .order { width: auto; min-width: 130px; height: 40px; padding-top: 9px; }
      }
    `,
  ],
})
export class SearchPanel {
  readonly placeLabel = input.required<string>();
  /** True when the reading is imprecise or the place is a whole district. */
  readonly approximate = input(false);
  readonly radius = input.required<number>();
  readonly categories = input<readonly string[]>([]);
  readonly category = input<string | null>(null);
  readonly changeDistrict = output<void>();
  readonly radiusChange = output<number>();
  readonly categoryChange = output<string | null>();
  /** Hidden on Inicio, which is a summary: the category filter lives on Ofertas and Categorías. */
  readonly showCategories = input(true);
  /** Shown only where the results are a list that can be reordered (Ofertas). */
  readonly order = input<OfferOrder | null>(null);
  readonly orderChange = output<OfferOrder>();
  protected readonly orders = OFFER_ORDERS;

  /** The four steps of 5 minutes, plus the current value if the slider of another tab left one in between. */
  protected readonly radiusOptions = computed(() => {
    const steps: number[] = [];
    for (let m = MIN_RADIUS_MINUTES; m <= MAX_RADIUS_MINUTES; m += RADIUS_STEP_MINUTES) {
      steps.push(m);
    }
    return [...new Set([...steps, this.radius()])].sort((a, b) => a - b);
  });
}
