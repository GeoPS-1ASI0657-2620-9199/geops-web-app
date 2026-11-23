import { TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import { DAY_MONTH_YEAR, isoDatepickerProviders, isoToTyped, typedToIso } from './iso-date-adapter';

describe('IsoDateAdapter', () => {
  let adapter: DateAdapter<string>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...isoDatepickerProviders] });
    adapter = TestBed.inject(DateAdapter<string>);
  });

  it('shows an ISO day as dd/mm/yyyy, whatever the OS uses', () => {
    expect(adapter.format('2026-10-05', DAY_MONTH_YEAR)).toBe('05/10/2026');
  });

  it('reads what the owner types day first and keeps it as an ISO day', () => {
    expect(adapter.parse('05/10/2026', DAY_MONTH_YEAR)).toBe('2026-10-05');
    expect(adapter.parse('5/1/2027', DAY_MONTH_YEAR)).toBe('2027-01-05');
  });

  it('treats an empty field as no date and a day that does not exist as invalid', () => {
    expect(adapter.parse('', DAY_MONTH_YEAR)).toBeNull();
    expect(adapter.deserialize('')).toBeNull();
    expect(adapter.isValid(adapter.parse('31/02/2026', DAY_MONTH_YEAR)!)).toBeFalse();
    expect(adapter.isValid(adapter.parse('2026-10-05', DAY_MONTH_YEAR)!)).toBeFalse();
  });

  it('does the calendar math on ISO days', () => {
    expect(adapter.addCalendarDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(adapter.addCalendarMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(adapter.createDate(2026, 9, 5)).toBe('2026-10-05');
    expect(adapter.compareDate('2026-10-05', '2026-10-31')).toBeLessThan(0);
    expect(adapter.getFirstDayOfWeek()).toBe(1);
  });

  it('names the months in Spanish of Peru', () => {
    expect(adapter.getMonthNames('long')[9].toLowerCase()).toBe('octubre');
  });

  it('converts both ways at the boundary', () => {
    expect(typedToIso('31/12/2026')).toBe('2026-12-31');
    expect(isoToTyped('2026-12-31')).toBe('31/12/2026');
    expect(isoToTyped('')).toBe('');
  });
});
