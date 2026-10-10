import { Session, displayNameOf } from './session';

const base: Session = { accessToken: 't', expiresAt: 0, userId: 1, role: 'CONSUMER', email: 'lucia.fernandez@correo.pe' };

describe('displayNameOf', () => {
  it('uses the business name of an owner', () => {
    expect(displayNameOf({ ...base, role: 'BUSINESS_OWNER', businessName: 'Bodega Grau' })).toBe('Bodega Grau');
  });

  it('greets a consumer by the first word of the email, capitalized', () => {
    expect(displayNameOf(base)).toBe('Lucia');
    expect(displayNameOf({ ...base, email: 'revision604572@ejemplo.pe' })).toBe('Revision');
    expect(displayNameOf({ ...base, email: '12345@correo.pe' })).toBe('12345@correo.pe');
  });
});
