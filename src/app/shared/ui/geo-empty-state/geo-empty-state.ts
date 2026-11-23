import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Empty or failed result: icon in a circle, a title, a short text and the actions as content. */
@Component({
  selector: 'geo-empty-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="empty" role="status">
      <span class="icon"><mat-icon aria-hidden="true">{{ icon() }}</mat-icon></span>
      @if (headingLevel() === 1) {
        <h1 class="geo-section-title">{{ title() }}</h1>
      } @else {
        <h2 class="geo-section-title">{{ title() }}</h2>
      }
      @if (description()) {
        <p class="geo-body description">{{ description() }}</p>
      }
      <div class="actions"><ng-content /></div>
    </section>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-3xl) var(--space-xl);
        background: var(--neutral-bg);
        border: 1px solid var(--neutral-line);
        border-radius: var(--radius-panel);
        text-align: center;
      }
      .icon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--brand-mist);
        color: var(--brand-deep);
      }
      .icon mat-icon { width: 30px; height: 30px; font-size: 30px; }
      h1 { margin: 0; }
      .description { margin: 0; max-width: 560px; color: var(--text-dim); }
      .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-md); }
    `,
  ],
})
export class GeoEmptyState {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  /** 1 when the empty state is the whole page (404, forbidden) and its title is the page title. */
  readonly headingLevel = input<1 | 2>(2);
}
