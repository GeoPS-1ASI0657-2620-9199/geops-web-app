import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** The nine variants of the Figma "Sello" component. */
export type SealKind =
  | 'verified'
  | 'reference'
  | 'expired'
  | 'active'
  | 'paused'
  | 'pending'
  | 'withdrawn'
  | 'reported'
  | 'unverified';

interface SealStyle {
  label: string;
  tone: 'green' | 'amber' | 'red' | 'purple' | 'grey';
  icon?: string;
}

const SEALS: Record<SealKind, SealStyle> = {
  verified: { label: 'Verificado', tone: 'green', icon: 'check' },
  reference: { label: 'Sin garantía', tone: 'amber' },
  expired: { label: 'Vencida', tone: 'red' },
  active: { label: 'Activa', tone: 'green' },
  paused: { label: 'Pausada', tone: 'amber' },
  pending: { label: 'Pendiente', tone: 'purple' },
  withdrawn: { label: 'Retirada', tone: 'red' },
  reported: { label: 'Reportada', tone: 'amber' },
  unverified: { label: 'Sin sello', tone: 'grey' },
};

/** Small status badge. The verified seal goes next to the business name, never on the offer. */
@Component({
  selector: 'geo-seal',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="seal" [class]="'seal tone-' + style().tone">
      @if (style().icon) {
        <mat-icon aria-hidden="true">{{ style().icon }}</mat-icon>
      }
      {{ text() ?? style().label }}
    </span>
  `,
  styles: [
    `
      .seal {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 3px 8px;
        border-radius: 4px;
        font: 600 10px/1.3 var(--font-brand);
        text-transform: uppercase;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }
      mat-icon { width: 11px; height: 11px; font-size: 11px; }
      .tone-green { background: var(--feedback-verified-bg); color: var(--feedback-verified-ink); }
      .tone-amber { background: var(--feedback-amber-bg); color: var(--feedback-amber-ink); }
      .tone-red { background: var(--feedback-red-bg); color: var(--feedback-red-ink); }
      .tone-purple { background: var(--brand-mist); color: var(--brand-deep); }
      .tone-grey { background: var(--neutral-line-soft); color: var(--text-dim); }
    `,
  ],
})
export class GeoSeal {
  readonly kind = input.required<SealKind>();
  /** Overrides the default label, e.g. "Canje verificado". */
  readonly text = input<string | null>(null);
  protected readonly style = computed(() => SEALS[this.kind()]);
}
