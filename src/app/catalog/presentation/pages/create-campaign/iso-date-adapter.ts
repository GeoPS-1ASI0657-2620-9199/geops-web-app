import { Injectable, Provider } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, NativeDateAdapter } from '@angular/material/core';

/** Peru writes the day first; the native date input followed the OS and showed mm/dd/yyyy. */
export const DATE_LOCALE = 'es-PE';
/** What the owner types and reads in the three date fields. */
export const DAY_MONTH_YEAR = 'dd/MM/yyyy';
/** The value the form keeps and Catalog receives: an ISO day. */
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const TYPED_DAY = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/;
const INVALID_DAY = 'invalid';

export const DAY_MONTH_YEAR_FORMATS: MatDateFormats = {
  parse: { dateInput: DAY_MONTH_YEAR },
  display: {
    dateInput: DAY_MONTH_YEAR,
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

/** yyyy-mm-dd as a local calendar day, or null when it is not a real day. */
export function isoToDate(iso: string): Date | null {
  const match = ISO_DAY.exec(iso);
  return match ? calendarDay(+match[1], +match[2], +match[3]) : null;
}

export function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** dd/mm/yyyy as the owner types it, to an ISO day; null for an empty field, 'invalid' for anything else. */
export function typedToIso(typed: string): string | null {
  if (!typed.trim()) {
    return null;
  }
  const match = TYPED_DAY.exec(typed);
  const day = match ? calendarDay(+match[3], +match[2], +match[1]) : null;
  return day ? dateToIso(day) : INVALID_DAY;
}

export function isoToTyped(iso: string): string {
  const match = ISO_DAY.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

function calendarDay(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  const real = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return real ? date : null;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * The datepicker works with ISO day strings, so the form keeps the yyyy-mm-dd values the rules and
 * Catalog already use, and only the field shows dd/mm/yyyy. Calendar math goes to NativeDateAdapter.
 */
@Injectable()
export class IsoDateAdapter extends DateAdapter<string> {
  private readonly native = new NativeDateAdapter();

  constructor() {
    super();
    this.native.setLocale(DATE_LOCALE);
    super.setLocale(DATE_LOCALE);
  }

  getYear(date: string): number {
    return this.native.getYear(this.toDate(date));
  }

  getMonth(date: string): number {
    return this.native.getMonth(this.toDate(date));
  }

  getDate(date: string): number {
    return this.native.getDate(this.toDate(date));
  }

  getDayOfWeek(date: string): number {
    return this.native.getDayOfWeek(this.toDate(date));
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    return this.native.getMonthNames(style);
  }

  getDateNames(): string[] {
    return this.native.getDateNames();
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    return this.native.getDayOfWeekNames(style);
  }

  getYearName(date: string): string {
    return this.native.getYearName(this.toDate(date));
  }

  /** Monday, as calendars are printed in Peru. */
  getFirstDayOfWeek(): number {
    return 1;
  }

  getNumDaysInMonth(date: string): number {
    return this.native.getNumDaysInMonth(this.toDate(date));
  }

  clone(date: string): string {
    return date;
  }

  createDate(year: number, month: number, date: number): string {
    return dateToIso(this.native.createDate(year, month, date));
  }

  today(): string {
    return dateToIso(this.native.today());
  }

  parse(value: unknown): string | null {
    return typeof value === 'string' ? typedToIso(value) : null;
  }

  format(date: string, displayFormat: Intl.DateTimeFormatOptions | string): string {
    if (displayFormat === DAY_MONTH_YEAR) {
      return isoToTyped(date);
    }
    return this.native.format(this.toDate(date), displayFormat as Intl.DateTimeFormatOptions);
  }

  addCalendarYears(date: string, years: number): string {
    return dateToIso(this.native.addCalendarYears(this.toDate(date), years));
  }

  addCalendarMonths(date: string, months: number): string {
    return dateToIso(this.native.addCalendarMonths(this.toDate(date), months));
  }

  addCalendarDays(date: string, days: number): string {
    return dateToIso(this.native.addCalendarDays(this.toDate(date), days));
  }

  toIso8601(date: string): string {
    return date;
  }

  isDateInstance(obj: unknown): boolean {
    return typeof obj === 'string';
  }

  isValid(date: string): boolean {
    return isoToDate(date) !== null;
  }

  invalid(): string {
    return INVALID_DAY;
  }

  /** An empty control is no date, not an invalid one, so only "required" speaks for it. */
  override deserialize(value: unknown): string | null {
    return value === '' ? null : super.deserialize(value);
  }

  private toDate(date: string): Date {
    return isoToDate(date) ?? new Date(NaN);
  }
}

/** Datepicker setup of the campaign form: ISO values, dd/mm/yyyy on screen, Spanish month names. */
export const isoDatepickerProviders: Provider[] = [
  { provide: MAT_DATE_LOCALE, useValue: DATE_LOCALE },
  { provide: DateAdapter, useClass: IsoDateAdapter },
  { provide: MAT_DATE_FORMATS, useValue: DAY_MONTH_YEAR_FORMATS },
];
