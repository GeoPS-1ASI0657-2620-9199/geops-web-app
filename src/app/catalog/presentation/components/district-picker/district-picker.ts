import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { LimaDistrict } from '../../../domain/model/lima-district';
import { DistrictDirectory } from '../../../domain/ports/district.directory';

/** Districts offered as chips; the other 33 stay in the list next to them. */
const FEATURED = [
  'Miraflores',
  'San Isidro',
  'Barranco',
  'Surquillo',
  'Jesús María',
  'Lince',
  'Pueblo Libre',
  'Magdalena del Mar',
  'San Miguel',
  'Breña',
];

/**
 * "Elige tu distrito" of the Figma screens 3 and 24: the consumer did not share the location or it is
 * too imprecise, so the search starts from the center of a district (CA-03.2, US46).
 */
@Component({
  selector: 'app-district-picker',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card">
      <h2 class="title">{{ title() }}</h2>
      @if (description()) {
        <p class="description">{{ description() }}</p>
      }
      <div class="chips" role="group">
        @for (district of featured(); track district.name) {
          <button type="button" class="chip" [class.on]="chosen()?.name === district.name" (click)="chosen.set(district)">
            {{ district.name }}
          </button>
        }
        <mat-select
          class="other"
          [placeholder]="'search.otherDistrict' | translate"
          [value]="isFeatured() ? null : chosen()?.name"
          (selectionChange)="chooseByName($event.value)"
          [attr.aria-label]="'search.otherDistrict' | translate">
          @for (district of others(); track district.name) {
            <mat-option [value]="district.name">{{ district.name }}</mat-option>
          }
        </mat-select>
      </div>
      <div class="actions">
        <button mat-flat-button type="button" [disabled]="!chosen()" (click)="confirm()">
          {{ chosen() ? ('search.searchIn' | translate: { district: chosen()!.name }) : ('search.pickOne' | translate) }}
        </button>
        @if (canRetryGps()) {
          <button mat-stroked-button type="button" (click)="retryGps.emit()">{{ 'search.retryGps' | translate }}</button>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .card {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
        padding: 24px;
        background: var(--neutral-bg);
        border: 1px solid var(--neutral-line);
        border-radius: var(--radius-panel);
      }
      .title { margin: 0; font: 600 19px/1.3 var(--font-brand); color: var(--text-primary); }
      .description { margin: 0; font: 400 12.5px/1.45 var(--font-brand); color: var(--text-dim); }
      .chips { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm); }
      .chip {
        height: 28px;
        padding: 0 14px;
        border: 1px solid var(--neutral-line);
        border-radius: var(--radius-chip);
        background: var(--neutral-bg);
        font: 400 11.5px/1 var(--font-brand);
        cursor: pointer;
      }
      .chip.on { border-color: var(--brand-action); background: var(--brand-action); color: var(--neutral-bg); }
      .other {
        width: 200px;
        height: 28px;
        padding: 4px 12px;
        border: 1px solid var(--neutral-line);
        border-radius: var(--radius-chip);
        font: 400 11.5px/1.4 var(--font-brand);
      }
      .actions { display: flex; flex-wrap: wrap; gap: var(--space-md); margin-top: var(--space-xs); }
    `,
  ],
})
export class DistrictPicker {
  private readonly directory = inject(DistrictDirectory);

  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly selected = input<string | null>(null);
  /** Off when the page is not served over HTTPS: the browser would refuse again. */
  readonly canRetryGps = input(true);
  readonly districtSelected = output<LimaDistrict>();
  readonly retryGps = output<void>();

  private readonly all = computed(() =>
    [...this.directory.all()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  );
  protected readonly featured = computed(() =>
    FEATURED.map((name) => this.all().find((d) => d.name === name)).filter((d): d is LimaDistrict => !!d),
  );
  protected readonly others = computed(() => this.all().filter((d) => !FEATURED.includes(d.name)));
  protected readonly chosen = signal<LimaDistrict | null>(null);
  protected readonly isFeatured = computed(() => FEATURED.includes(this.chosen()?.name ?? ''));

  constructor() {
    queueMicrotask(() => {
      const name = this.selected();
      if (name) {
        this.chooseByName(name);
      }
    });
  }

  chooseByName(name: string): void {
    this.chosen.set(this.all().find((d) => d.name === name) ?? null);
  }

  confirm(): void {
    const district = this.chosen();
    if (district) {
      this.districtSelected.emit(district);
    }
  }
}
