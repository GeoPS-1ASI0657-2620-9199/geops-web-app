import { TestBed } from '@angular/core/testing';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { TranslatedDatepickerIntl } from './translated-datepicker-intl';

describe('TranslatedDatepickerIntl', () => {
  let intl: MatDatepickerIntl;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: MatDatepickerIntl, useClass: TranslatedDatepickerIntl }],
    });
    intl = TestBed.inject(MatDatepickerIntl);
    translate = TestBed.inject(TranslateService);
  });

  it('reads in Spanish before the translations arrive', () => {
    expect(intl.openCalendarLabel).toBe('Abrir calendario');
    expect(intl.prevMonthLabel).toBe('Mes anterior');
    expect(intl.nextMonthLabel).toBe('Mes siguiente');
    expect(intl.switchToMultiYearViewLabel).toBe('Elegir mes y año');
    expect(intl.formatYearRangeLabel('2024', '2047')).toBe('2024 a 2047');
  });

  it('follows the language of the app and tells the calendar to redraw', () => {
    const changed = jasmine.createSpy('changes');
    intl.changes.subscribe(changed);

    translate.setTranslation('en', {
      datepicker: { openCalendarLabel: 'Open calendar', nextMonthLabel: 'Next month', yearRangeLabel: '{{start}} to {{end}}' },
    });
    translate.use('en');

    expect(intl.openCalendarLabel).toBe('Open calendar');
    expect(intl.nextMonthLabel).toBe('Next month');
    expect(intl.formatYearRangeLabel('2024', '2047')).toBe('2024 to 2047');
    expect(changed).toHaveBeenCalled();
  });
});
