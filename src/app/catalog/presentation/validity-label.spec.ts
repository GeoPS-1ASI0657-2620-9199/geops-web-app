import { validityLabel } from './validity-label';

describe('validityLabel', () => {
  it('says when an offer expires as a calendar day', () => {
    const today = new Date(2026, 9, 4, 18, 30);
    expect(validityLabel('2026-10-04', today)).toBe('Vence hoy');
    expect(validityLabel('2026-10-05', today)).toBe('Vence mañana');
    expect(validityLabel('2026-10-15', today)).toBe('Vence el 15 de octubre');
  });
});
