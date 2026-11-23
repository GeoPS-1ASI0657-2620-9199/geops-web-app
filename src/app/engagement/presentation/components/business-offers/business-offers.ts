import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ActiveOffer } from '../../../domain/model/active-offer';

let nextPanel = 0;

/** yyyy-MM-dd as dd/MM/yyyy, without going through Date (a date-only string would move a day back in Lima). */
export function shortDay(isoDay: string): string {
  const [year, month, day] = isoDay.split('-');
  return day && month && year ? `${day}/${month}/${year}` : isoDay;
}

/**
 * "Ver N ofertas" under a saved or followed business: it opens every offer the business has open
 * today, each one a link to its detail, so the consumer picks one instead of being sent to the first.
 * The host takes no box of its own: the button sits in the business row and the list takes the
 * whole width below it.
 */
@Component({
  selector: 'app-business-offers',
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (offers().length > 0) {
      <button mat-stroked-button type="button" class="toggle" [attr.aria-expanded]="open()" [attr.aria-controls]="panelId" (click)="open.set(!open())">
        {{ (offers().length === 1 ? 'businessOffers.showOne' : 'businessOffers.show') | translate: { count: offers().length } }}
        <mat-icon iconPositionEnd aria-hidden="true">{{ open() ? 'expand_less' : 'expand_more' }}</mat-icon>
        <span class="sr-only"> {{ businessName() }}</span>
      </button>
      @if (open()) {
        <ul class="offers" [id]="panelId" [attr.aria-label]="'businessOffers.listLabel' | translate: { name: businessName() }">
          @for (offer of offers(); track offer.offerId) {
            <li>
              <a [routerLink]="['/offers', offer.offerId]">
                <span class="title">{{ offer.title }}</span>
                <span class="until">{{ 'businessOffers.until' | translate: { date: day(offer.validTo) } }}</span>
                <mat-icon aria-hidden="true">chevron_right</mat-icon>
              </a>
            </li>
          }
        </ul>
      }
    }
  `,
  styles: [`
    :host { display: contents; }
    .toggle { height: 38px; color: var(--brand-deep); }
    .offers { order: 1; flex-basis: 100%; list-style: none; margin: 0; padding: 0; border: 1px solid var(--neutral-line-soft); border-radius: var(--radius-card); overflow: hidden; }
    .offers li + li { border-top: 1px solid var(--neutral-line-soft); }
    .offers a { display: flex; align-items: center; gap: var(--space-md); min-height: 48px; padding: var(--space-sm) var(--space-lg); color: var(--text-primary); text-decoration: none; }
    .offers a:hover { background: var(--brand-soft); }
    .offers a:focus-visible { outline: 2px solid var(--brand-deep); outline-offset: -2px; }
    .title { flex: 1; min-width: 0; font: 500 13.5px/1.3 var(--font-brand); overflow-wrap: anywhere; }
    .until { flex: none; font: 400 12.5px/1.3 var(--font-brand); color: var(--text-dim); }
    mat-icon { flex: none; color: var(--text-dim); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    @media (pointer: coarse), (max-width: 640px) { .toggle { height: 40px; } }
    @media (max-width: 480px) { .offers a { flex-wrap: wrap; } .until { flex-basis: calc(100% - 40px); order: 2; } }
  `],
})
export class BusinessOffers {
  readonly offers = input.required<readonly ActiveOffer[]>();
  readonly businessName = input.required<string>();
  protected readonly open = signal(false);
  protected readonly panelId = `business-offers-${nextPanel++}`;
  protected readonly day = shortDay;
}
