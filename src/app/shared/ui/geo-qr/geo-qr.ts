import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { create } from 'qrcode';

/** Quiet zone of four modules around the code, as the QR standard asks. */
const MARGIN = 4;

/**
 * QR of a short text (the reservation code), drawn as one SVG path from the module matrix. It is
 * built in the browser, with no network call and no HTML injection.
 */
@Component({
  selector: 'geo-qr',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="viewBox()" role="img" [attr.aria-label]="label()" shape-rendering="crispEdges">
      <rect [attr.width]="side()" [attr.height]="side()" fill="#ffffff" />
      <path [attr.d]="path()" fill="#1a1420" />
    </svg>
  `,
  styles: [`:host { display: inline-block; line-height: 0; } svg { width: 100%; height: 100%; }`],
})
export class GeoQr {
  readonly value = input.required<string>();
  readonly label = input.required<string>();

  private readonly modules = computed(() => create(this.value(), { errorCorrectionLevel: 'M' }).modules);
  protected readonly side = computed(() => this.modules().size + MARGIN * 2);
  protected readonly viewBox = computed(() => `0 0 ${this.side()} ${this.side()}`);
  protected readonly path = computed(() => {
    const { size, data } = this.modules();
    let d = '';
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (data[row * size + col]) {
          d += `M${col + MARGIN} ${row + MARGIN}h1v1h-1z`;
        }
      }
    }
    return d;
  });
}
