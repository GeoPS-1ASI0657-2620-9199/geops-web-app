import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

let nextId = 0;

/** Sales of a day divided by the customers of that day, rounded to cents; null until both are above 0. */
export function averageTicketOf(daySales: number | null, dayCustomers: number | null): number | null {
  if (!daySales || !dayCustomers || daySales <= 0 || dayCustomers <= 0) {
    return null;
  }
  return Math.round((daySales / dayCustomers) * 100) / 100;
}

/**
 * "¿No lo sabes? Calcúlalo con las ventas de un día": for an owner who knows what he sold in a day and how many
 * customers he served, but not the average spend. It works it out and hands it to the form, which keeps its own
 * field so the owner can also type the average directly (US45).
 */
@Component({
  selector: 'geo-ticket-calculator',
  standalone: true,
  imports: [DecimalPipe, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="toggle" [attr.aria-expanded]="open()" [attr.aria-controls]="panelId" (click)="open.set(!open())">
      {{ 'ticketCalculator.toggle' | translate }}
    </button>
    @if (open()) {
      <div class="panel" [id]="panelId">
        <label class="field">
          <span>{{ 'ticketCalculator.daySales' | translate }}</span>
          <input type="number" class="input" min="0.01" step="0.01" inputmode="decimal" data-testid="day-sales"
            [value]="daySales() ?? ''" (input)="daySales.set(read($event))" />
          <small class="hint">{{ 'ticketCalculator.daySalesHint' | translate }}</small>
        </label>
        <label class="field">
          <span>{{ 'ticketCalculator.dayCustomers' | translate }}</span>
          <input type="number" class="input" min="1" step="1" inputmode="numeric" data-testid="day-customers"
            [value]="dayCustomers() ?? ''" (input)="dayCustomers.set(read($event))" />
          <small class="hint">{{ 'ticketCalculator.dayCustomersHint' | translate }}</small>
        </label>
        <p class="result" role="status" data-testid="ticket-result">
          @if (result(); as value) {
            {{ 'ticketCalculator.result' | translate: { value: (value | number: '1.2-2') } }}
          } @else {
            {{ 'ticketCalculator.waiting' | translate }}
          }
        </p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .toggle { padding: 0; border: 0; background: none; color: var(--brand-deep); font: 600 12.5px/1.4 var(--font-brand); text-decoration: underline; cursor: pointer; }
    .toggle:focus-visible { outline: 2px solid var(--brand-deep); outline-offset: 2px; }
    .panel { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); margin-top: var(--space-sm); padding: var(--space-md); border: 1px solid var(--neutral-line-soft); border-radius: var(--radius-card); background: var(--neutral-surface, transparent); }
    .field { display: flex; flex-direction: column; gap: 4px; font: 500 12.5px/1.3 var(--font-brand); }
    .input { width: 100%; box-sizing: border-box; height: 40px; padding: 0 10px; border: 1px solid var(--neutral-line); border-radius: var(--radius-input); font: 400 14px/1 var(--font-brand); }
    .input:focus { outline: 2px solid var(--brand-mist, var(--brand-action)); }
    .hint { font: 400 12px/1.35 var(--font-brand); color: var(--text-dim); }
    .result { grid-column: 1 / -1; margin: 0; font: 600 13px/1.4 var(--font-brand); color: var(--status-verified); }
    @media (max-width: 480px) { .panel { grid-template-columns: 1fr; } }
  `],
})
export class GeoTicketCalculator {
  /** The average spend per customer worked out from the day, every time both figures are valid. */
  readonly ticket = output<number>();
  protected readonly open = signal(false);
  protected readonly daySales = signal<number | null>(null);
  protected readonly dayCustomers = signal<number | null>(null);
  protected readonly result = computed(() => averageTicketOf(this.daySales(), this.dayCustomers()));
  protected readonly panelId = `ticket-calculator-${nextId++}`;

  protected read(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value;
    const value = raw === '' ? null : Number(raw);
    queueMicrotask(() => {
      const ticket = this.result();
      if (ticket !== null) this.ticket.emit(ticket);
    });
    return value !== null && Number.isFinite(value) ? value : null;
  }
}
