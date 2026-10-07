import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../shared/domain/api-error';
import { RegisterBusiness } from '../domain/model/register-business';
import { IdentityGateway } from '../domain/ports/identity.gateway';
import { INVALID_LOCATION, RegisterBusinessUseCase } from './register-business.use-case';

const OWNER: RegisterBusiness = {
  fullName: '  Rosa   Quispe Mamani ',
  email: ' Rosa.Quispe@Ejemplo.PE',
  phone: '987 654 321',
  password: 'Bodega#2026',
  business: {
    businessName: ' Bodega Doña Rosa ',
    businessType: 'Bodega',
    ruc: '10456789019 ',
    address: ' Jr. Huánuco 1250, La Victoria ',
    location: { latitude: -12.0681, longitude: -77.035 },
    openingHours: '',
  },
};

describe('RegisterBusinessUseCase', () => {
  let gateway: jasmine.SpyObj<IdentityGateway>;
  let useCase: RegisterBusinessUseCase;

  beforeEach(() => {
    gateway = jasmine.createSpyObj<IdentityGateway>('IdentityGateway', ['registerBusiness']);
    gateway.registerBusiness.and.resolveTo({
      userId: 42,
      fullName: 'Rosa Quispe Mamani',
      email: 'rosa.quispe@ejemplo.pe',
      role: 'BUSINESS_OWNER',
    });
    TestBed.configureTestingModule({ providers: [{ provide: IdentityGateway, useValue: gateway }] });
    useCase = TestBed.inject(RegisterBusinessUseCase);
  });

  it('sends the owner and the business cleaned up in a single request', async () => {
    await useCase.execute(OWNER);

    expect(gateway.registerBusiness).toHaveBeenCalledOnceWith({
      fullName: 'Rosa Quispe Mamani',
      email: 'rosa.quispe@ejemplo.pe',
      phone: '987654321',
      password: 'Bodega#2026',
      business: {
        businessName: 'Bodega Doña Rosa',
        businessType: 'Bodega',
        ruc: '10456789019',
        address: 'Jr. Huánuco 1250, La Victoria',
        location: { latitude: -12.0681, longitude: -77.035 },
        openingHours: '',
      },
    });
  });

  it('asks for the point on the map before calling Identity (CA-22.2)', async () => {
    const withoutPoint = { ...OWNER, business: { ...OWNER.business, location: null as never } };

    await expectAsync(useCase.execute(withoutPoint)).toBeRejectedWith(
      jasmine.objectContaining<ApiError>({ code: INVALID_LOCATION }),
    );
    expect(gateway.registerBusiness).not.toHaveBeenCalled();
  });

  it('rejects a point outside the valid range', async () => {
    const outOfRange = { ...OWNER, business: { ...OWNER.business, location: { latitude: 120, longitude: -77 } } };

    await expectAsync(useCase.execute(outOfRange)).toBeRejected();
    expect(gateway.registerBusiness).not.toHaveBeenCalled();
  });
});
