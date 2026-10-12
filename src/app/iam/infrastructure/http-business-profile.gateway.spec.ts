import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpBusinessProfileGateway } from './http-business-profile.gateway';

const PROFILES_URL = 'http://gateway.test/api/v1/business-profiles';
const VERIFICATION = {
  verificationId: 31,
  result: 'REJECTED',
  reason: 'ADDRESS_NOT_GEOCODABLE',
  message: 'No encontramos esa dirección en el mapa.',
  address: 'Av. Larco s/n',
  taxpayerStatus: 'ACTIVO',
  taxpayerCondition: 'HABIDO',
  verificationStatus: 'REJECTED',
  checkedAt: '2026-10-21T15:04:00Z',
};

describe('HttpBusinessProfileGateway', () => {
  let gateway: HttpBusinessProfileGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://gateway.test/api/v1' },
        HttpBusinessProfileGateway,
      ],
    });
    gateway = TestBed.inject(HttpBusinessProfileGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the profile with its verification status', async () => {
    const result = gateway.find(84);

    http.expectOne(PROFILES_URL + '/84').flush({
      id: 84,
      businessName: 'Restaurante Don Pepe',
      businessType: 'Restaurante',
      ruc: '20123456786',
      address: 'Av. Larco 345, Miraflores',
      verificationStatus: 'VERIFIED',
      lastVerification: { result: 'APPROVED', reason: null, message: 'ok', checkedAt: '2026-10-21T15:04:00Z' },
    });

    expect(await result).toEqual(
      jasmine.objectContaining({ id: 84, verificationStatus: 'VERIFIED', lastVerification: jasmine.objectContaining({ result: 'APPROVED' }) }),
    );
  });

  it('reads a profile that was never verified', async () => {
    const result = gateway.find(84);

    http.expectOne(PROFILES_URL + '/84').flush({
      id: 84,
      businessName: 'Restaurante Don Pepe',
      ruc: '20123456786',
      address: 'Av. Larco 345, Miraflores',
      verificationStatus: 'UNVERIFIED',
      lastVerification: null,
    });

    expect((await result).lastVerification).toBeNull();
  });

  it('verifies the declared address without a body (E2-11)', async () => {
    const result = gateway.verify(84, null);

    const request = http.expectOne(PROFILES_URL + '/84/ruc-verifications');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush(VERIFICATION, { status: 201, statusText: 'Created' });

    expect(await result).toEqual(
      jasmine.objectContaining({ result: 'REJECTED', reason: 'ADDRESS_NOT_GEOCODABLE', address: 'Av. Larco s/n' }),
    );
  });

  it('sends the corrected address in the same attempt', async () => {
    const result = gateway.verify(84, 'Av. José Larco 345, Miraflores');

    const request = http.expectOne(PROFILES_URL + '/84/ruc-verifications');
    expect(request.request.body).toEqual({ address: 'Av. José Larco 345, Miraflores' });
    request.flush({ ...VERIFICATION, result: 'APPROVED', reason: null, verificationStatus: 'VERIFIED' });

    expect((await result).verificationStatus).toBe('VERIFIED');
  });

  it('rejects with the code of Identity', async () => {
    const result = gateway.verify(99, null);
    http
      .expectOne(PROFILES_URL + '/99/ruc-verifications')
      .flush({ code: 'FORBIDDEN', message: 'Solo el dueño del negocio puede hacer esta operación.' }, { status: 403, statusText: 'Forbidden' });
    await expectAsync(result).toBeRejectedWith(jasmine.objectContaining<ApiError>({ code: 'FORBIDDEN' }));

    const read = gateway.find(99);
    http.expectOne(PROFILES_URL + '/99').flush({ code: 'BUSINESS_PROFILE_NOT_FOUND', message: 'no' }, { status: 404, statusText: 'Not Found' });
    await expectAsync(read).toBeRejectedWith(jasmine.objectContaining<ApiError>({ code: 'BUSINESS_PROFILE_NOT_FOUND' }));
  });
});
