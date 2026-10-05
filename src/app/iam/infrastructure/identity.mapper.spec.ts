import { toRegisterConsumerRequest, toRegisteredUser } from './identity.mapper';

describe('identity.mapper', () => {
  it('joins given names and surnames into the full name Identity stores', () => {
    const request = toRegisterConsumerRequest({
      givenNames: '  Ariana  Lucía ',
      surnames: 'Torres Ríos ',
      email: 'ariana@correo.pe',
      phone: '987654321',
      password: 'Ofertas#2026',
    });

    expect(request).toEqual({
      role: 'CONSUMER',
      fullName: 'Ariana Lucía Torres Ríos',
      email: 'ariana@correo.pe',
      phone: '987654321',
      password: 'Ofertas#2026',
    });
  });

  it('keeps only the account data of the created user', () => {
    const user = toRegisteredUser({
      userId: 41,
      fullName: 'Lucía Fernández Ríos',
      email: 'lucia.fernandez@ejemplo.pe',
      role: 'CONSUMER',
      consumerProfileId: 15,
    });

    expect(user).toEqual({
      userId: 41,
      fullName: 'Lucía Fernández Ríos',
      email: 'lucia.fernandez@ejemplo.pe',
      role: 'CONSUMER',
    });
  });
});
