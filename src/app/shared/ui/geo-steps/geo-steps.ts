import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Numbered progress of a wizard: done steps show a check, the current one is highlighted. */
@Component({
  selector: 'geo-steps',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="steps" aria-label="Pasos">
      @for (step of steps(); track step; let i = $index; let last = $last) {
        <li
          class="step"
          [class.done]="i < current()"
          [class.current]="i === current()"
          [attr.aria-current]="i === current() ? 'step' : null">
          <span class="dot">
            @if (i < current()) {
              <mat-icon aria-hidden="true">check</mat-icon>
            } @else {
              {{ i + 1 }}
            }
          </span>
          <span class="label">{{ step }}</span>
        </li>
        @if (!last) {
          <li class="line" aria-hidden="true"></li>
        }
      }
    </ol>
  `,
  styles: [
    `
      .steps { display: flex; align-items: center; gap: var(--space-md); margin: 0; padding: 0; list-style: none; }
      .step { display: flex; align-items: center; gap: var(--space-sm); }
      .dot {
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--neutral-line);
        color: var(--text-dim);
        font: 400 11px/1 var(--font-brand);
      }
      .dot mat-icon { width: 16px; height: 16px; font-size: 16px; }
      .label { font: 400 13px/1.45 var(--font-brand); color: var(--text-dim); }
      .done .dot { background: var(--status-verified); color: var(--neutral-bg); }
      .current .dot { background: var(--brand-action); color: var(--neutral-bg); }
      .current .label { font-weight: 500; color: var(--brand-deep); }
      .line { width: 40px; height: 2px; background: var(--neutral-line); }
    `,
  ],
})
export class GeoSteps {
  readonly steps = input.required<string[]>();
  /** Zero based index of the current step. */
  readonly current = input(0);
}
