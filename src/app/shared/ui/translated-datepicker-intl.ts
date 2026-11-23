import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { TranslateService } from '@ngx-translate/core';

/** Labels of the calendar that come from datepicker.<name> in the translation files. */
const LABELS = [
  'calendarLabel',
  'openCalendarLabel',
  'closeCalendarLabel',
  'prevMonthLabel',
  'nextMonthLabel',
  'prevYearLabel',
  'nextYearLabel',
  'prevMultiYearLabel',
  'nextMultiYearLabel',
  'switchToMonthViewLabel',
  'switchToMultiYearViewLabel',
  'startDateLabel',
  'endDateLabel',
  'comparisonDateLabel',
] as const;
type Label = (typeof LABELS)[number];

/**
 * The texts screen readers hear on every datepicker, in the language of the app. They start in Spanish,
 * the default language, so the calendar never reads in English while the translations load.
 */
@Injectable()
export class TranslatedDatepickerIntl extends MatDatepickerIntl {
  override calendarLabel = 'Calendario';
  override openCalendarLabel = 'Abrir calendario';
  override closeCalendarLabel = 'Cerrar calendario';
  override prevMonthLabel = 'Mes anterior';
  override nextMonthLabel = 'Mes siguiente';
  override prevYearLabel = 'Año anterior';
  override nextYearLabel = 'Año siguiente';
  override prevMultiYearLabel = '24 años anteriores';
  override nextMultiYearLabel = '24 años siguientes';
  override switchToMonthViewLabel = 'Elegir fecha';
  override switchToMultiYearViewLabel = 'Elegir mes y año';
  override startDateLabel = 'Fecha de inicio';
  override endDateLabel = 'Fecha de fin';
  override comparisonDateLabel = 'Rango de comparación';
  private rangeLabel = '{{start}} a {{end}}';

  constructor() {
    super();
    inject(TranslateService)
      .stream('datepicker')
      .pipe(takeUntilDestroyed())
      .subscribe((texts: unknown) => this.apply(texts));
  }

  override formatYearRangeLabel(start: string, end: string): string {
    return this.rangeLabel.replace('{{start}}', start).replace('{{end}}', end);
  }

  /** A language without the datepicker block (or still loading) answers the key itself: it is ignored. */
  private apply(texts: unknown): void {
    if (!texts || typeof texts !== 'object') {
      return;
    }
    const read = texts as Partial<Record<Label | 'yearRangeLabel', unknown>>;
    for (const label of LABELS) {
      const text = read[label];
      if (typeof text === 'string') {
        this[label] = text;
      }
    }
    if (typeof read.yearRangeLabel === 'string') {
      this.rangeLabel = read.yearRangeLabel;
    }
    this.changes.next();
  }
}
