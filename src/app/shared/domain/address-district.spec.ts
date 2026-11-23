import { ADDRESS_DISTRICTS, composeAddress, knownDistrict, splitAddress } from './address-district';

describe('address district', () => {
  it('lists the 43 districts of Lima and the 7 of Callao, once each', () => {
    expect(ADDRESS_DISTRICTS.length).toBe(50);
    expect(new Set(ADDRESS_DISTRICTS).size).toBe(50);
    expect(ADDRESS_DISTRICTS).toContain('Chorrillos');
    expect(ADDRESS_DISTRICTS).toContain('Callao');
  });

  it('recognizes a district without caring about case or accents', () => {
    expect(knownDistrict(' jesus maria ')).toBe('Jesús María');
    expect(knownDistrict('Narnia')).toBeNull();
  });

  it('splits the street from a known district at the end', () => {
    expect(splitAddress('San Andrés 191, Chorrillos')).toEqual({ street: 'San Andrés 191', district: 'Chorrillos' });
    expect(splitAddress('Av. Larco 345, Of. 2, miraflores')).toEqual({ street: 'Av. Larco 345, Of. 2', district: 'Miraflores' });
  });

  it('keeps the whole text as the street when there is no known district', () => {
    expect(splitAddress('San Andrés 191')).toEqual({ street: 'San Andrés 191', district: null });
    expect(splitAddress('Calle 5, Mz B')).toEqual({ street: 'Calle 5, Mz B', district: null });
  });

  it('adds the district once, even if the owner also typed it', () => {
    expect(composeAddress('San Andrés 191', 'Chorrillos')).toBe('San Andrés 191, Chorrillos');
    expect(composeAddress('San Andrés 191, Chorrillos', 'Chorrillos')).toBe('San Andrés 191, Chorrillos');
    expect(composeAddress('San Andrés 191, ', 'Chorrillos')).toBe('San Andrés 191, Chorrillos');
  });
});
