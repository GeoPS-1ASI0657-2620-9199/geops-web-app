import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LimaDistrict } from '../../../domain/model/lima-district';
import { DistrictDirectory } from '../../../domain/ports/district.directory';

/**
 * Manual district choice when the location is denied, missing or imprecise (CA-03.2, GEO-115).
 * Choosing one starts the search from its center.
 */
@Component({
  selector: 'app-district-selector',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" class="field">
      <mat-label>Elige tu distrito</mat-label>
      <mat-select [value]="selected()" (selectionChange)="choose($event.value)">
        @for (district of districts(); track district.name) {
          <mat-option [value]="district.name">{{ district.name }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [`.field { width: 100%; max-width: 360px; }`],
})
export class DistrictSelector {
  private readonly directory = inject(DistrictDirectory);

  readonly selected = input<string | null>(null);
  readonly districtSelected = output<LimaDistrict>();

  protected readonly districts = computed(() =>
    [...this.directory.all()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  );

  choose(name: string): void {
    const district = this.directory.all().find((d) => d.name === name);
    if (district) {
      this.districtSelected.emit(district);
    }
  }
}
