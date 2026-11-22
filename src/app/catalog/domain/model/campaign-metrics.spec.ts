import { DailyMetric, barShares, baselineError, customPeriodError, periodFor } from './campaign-metrics';

describe('campaign metrics rules', () => {
  it('counts the presets back from today in Lima and leaves the campaign preset to the server', () => {
    expect(periodFor('campaign', '2026-10-08')).toEqual({});
    expect(periodFor('last7', '2026-10-08')).toEqual({ from: '2026-10-02', to: '2026-10-08' });
    expect(periodFor('last30', '2026-03-01')).toEqual({ from: '2026-01-31', to: '2026-03-01' });
  });

  it('rejects a custom range without dates, reversed or longer than a year', () => {
    expect(customPeriodError('', '2026-10-08')).toBe('missing');
    expect(customPeriodError('2026-10-08', '2026-10-01')).toBe('order');
    expect(customPeriodError('2025-10-01', '2026-10-08')).toBe('tooLong');
    expect(customPeriodError('2026-10-01', '2026-10-08')).toBeNull();
  });

  it('applies the baseline rules of catalog-service', () => {
    expect(baselineError(null, 18.5)).toBe('customers');
    expect(baselineError(0, 18.5)).toBe('customers');
    expect(baselineError(12.5, 18.5)).toBe('customers');
    expect(baselineError(140, 0)).toBe('ticket');
    expect(baselineError(140, 18.555)).toBe('ticket');
    expect(baselineError(140, 18.55)).toBeNull();
  });

  it('scales the bars to the busiest day and keeps empty periods flat', () => {
    const daily: DailyMetric[] = [
      { date: '2026-10-05', impressions: 50, clicks: 2, reservations: 0, redemptions: 0 },
      { date: '2026-10-06', impressions: 0, clicks: 0, reservations: 0, redemptions: 0 },
      { date: '2026-10-07', impressions: 200, clicks: 4, reservations: 0, redemptions: 0 },
    ];

    expect(barShares(daily, 'impressions')).toEqual([0.25, 0, 1]);
    expect(barShares(daily, 'redemptions')).toEqual([0, 0, 0]);
  });
});
