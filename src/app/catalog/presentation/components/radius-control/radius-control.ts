import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { MAX_RADIUS_MINUTES, MIN_RADIUS_MINUTES } from '../../../domain/model/nearby-offer';

/** How far the consumer is willing to walk, from 5 to 20 minutes (Figma "Control de radio"). */
@Component({
  selector: 'app-radius-control',
  standalone: true,
  imports: [MatSliderModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="radius">
      <div class="head">
        <span class="geo-body-strong">Radio de búsqueda</span>
        <span class="value geo-tabular">{{ minutes() }} min a pie</span>
      </div>
      <mat-slider [min]="min" [max]="max" [step]="1" discrete class="slider">
        <input
          matSliderThumb
          [value]="minutes()"
          (change)="changed.emit(+$any($event.target).value)"
          aria-label="Minutos a pie" />
      </mat-slider>
      <p class="geo-meta">Ajusta hasta dónde estás dispuesto a caminar.</p>
    </div>
  `,
  styles: [
    `
      .radius { display: flex; flex-direction: column; gap: var(--space-xs); min-width: 260px; }
      .head { display: flex; justify-content: space-between; gap: var(--space-md); }
      .value { font: 600 13px/1.45 var(--font-brand); color: var(--brand-deep); }
      .slider { width: 100%; margin: 0; }
      .geo-meta { margin: 0; }
    `,
  ],
})
export class RadiusControl {
  protected readonly min = MIN_RADIUS_MINUTES;
  protected readonly max = MAX_RADIUS_MINUTES;
  readonly minutes = input.required<number>();
  /** Emitted when the consumer releases the slider, not while dragging, to avoid extra searches. */
  readonly changed = output<number>();
}
