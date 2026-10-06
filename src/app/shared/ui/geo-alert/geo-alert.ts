import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** The four variants of the Figma "Aviso" component. */
export type AlertKind = 'info' | 'success' | 'warning' | 'error';

const ICONS: Record<AlertKind, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

/** Inline notice with an icon, a title and a short description. Extra actions go as content. */
@Component({
  selector: 'geo-alert',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert" [class]="'alert kind-' + kind()" [attr.role]="role()">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <div class="body">
        <p class="title">{{ title() }}</p>
        @if (description()) {
          <p class="description">{{ description() }}</p>
        }
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .alert {
        display: flex;
        gap: var(--space-md);
        padding: var(--space-md) var(--space-lg);
        border: 1px solid;
        border-radius: var(--radius-card);
      }
      mat-icon { flex: none; width: 20px; height: 20px; font-size: 20px; }
      .body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .title { margin: 0; font: 500 13px/1.45 var(--font-brand); }
      .description { margin: 0; font: 400 11px/1.3 var(--font-brand); }
      .kind-info { background: var(--brand-mist); border-color: var(--feedback-purple-border); color: var(--brand-deep); }
      .kind-success { background: var(--feedback-verified-bg); border-color: var(--feedback-verified-border); color: var(--feedback-verified-ink); }
      .kind-warning { background: var(--feedback-amber-bg); border-color: var(--feedback-amber-border); color: var(--feedback-amber-ink); }
      .kind-error { background: var(--feedback-red-bg); border-color: var(--feedback-red-border); color: var(--feedback-red-ink); }
    `,
  ],
})
export class GeoAlert {
  readonly kind = input<AlertKind>('info');
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  protected readonly icon = computed(() => ICONS[this.kind()]);
  /** Errors and warnings are announced by screen readers as they appear. */
  protected readonly role = computed(() =>
    this.kind() === 'error' || this.kind() === 'warning' ? 'alert' : 'status',
  );
}
