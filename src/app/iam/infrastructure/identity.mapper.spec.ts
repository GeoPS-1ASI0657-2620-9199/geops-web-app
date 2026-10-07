import { toRegisterBusinessRequest, toRegisterConsumerRequest, toRegisteredUser } from './identity.mapper';

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

  it('sends the business with its point as latitude and longitude', () => {
    const request = toRegisterBusinessRequest({
      fullName: 'Rosa Quispe Mamani',
      email: 'rosa.quispe@ejemplo.pe',
      phone: '987654321',
      password: 'Bodega#2026',
      business: {
        businessName: 'Bodega Doña Rosa',
        businessType: '',
        ruc: '10456789019',
        address: 'Jr. Huánuco 1250, La Victoria',
        location: { latitude: -12.0681, longitude: -77.035 },
        openingHours: 'Lun-Sáb 07:00-22:00',
      },
    });

    expect(request.role).toBe('BUSINESS_OWNER');
    expect(request.businessProfile).toEqual({
      businessName: 'Bodega Doña Rosa',
      businessType: undefined,
      ruc: '10456789019',
      address: 'Jr. Huánuco 1250, La Victoria',
      latitude: -12.0681,
      longitude: -77.035,
      openingHours: 'Lun-Sáb 07:00-22:00',
    });
  });
});
