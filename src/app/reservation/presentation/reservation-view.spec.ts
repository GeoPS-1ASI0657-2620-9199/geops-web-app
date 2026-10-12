import { limaTime, limaDateTime } from './reservation-view';

describe('limaDateTime', () => {
  it('shows the end of the offer day in Lima, not the next day in UTC', () => {
    const text = limaDateTime('2026-10-15T04:59:59Z');

    expect(text).toContain('14');
    expect(text).toContain('11:59');
    expect(text).not.toContain('15');
  });

  it('limaTime gives the hour and minute in Lima', () => {
    expect(limaTime('2026-10-20T17:42:10Z')).toBe('12:42');
  });
});
