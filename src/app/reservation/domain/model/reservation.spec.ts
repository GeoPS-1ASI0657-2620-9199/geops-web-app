import { isReservationStatus, isPositiveId, isWellFormedCode } from './reservation';

describe('Reservation', () => {
  it('accepts the codes reservation-service generates', () => {
    expect(isWellFormedCode('K7P3XM9Q')).toBeTrue();
  });

  it('rejects codes with ambiguous characters or the wrong length', () => {
    expect(isWellFormedCode('K7P3XM0Q')).toBeFalse();
    expect(isWellFormedCode('K7P3XMIQ')).toBeFalse();
    expect(isWellFormedCode('K7P3XM9')).toBeFalse();
    expect(isWellFormedCode('k7p3xm9q')).toBeFalse();
  });

  it('knows only the four statuses of the service', () => {
    expect(isReservationStatus('ACTIVE')).toBeTrue();
    expect(isReservationStatus('REPORTED')).toBeTrue();
    expect(isReservationStatus('VIGENTE')).toBeFalse();
    expect(isReservationStatus(null)).toBeFalse();
  });

  it('takes only positive integers as ids', () => {
    expect(isPositiveId(15)).toBeTrue();
    expect(isPositiveId(0)).toBeFalse();
    expect(isPositiveId(Number('abc'))).toBeFalse();
  });
});
