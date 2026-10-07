import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpIdentityGateway } from './http-identity.gateway';

const BASE_URL = 'http://gateway.test/api/v1';
const PERSON = {
  givenNames: 'Ariana',
  surnames: 'Torres',
  email: 'ariana@correo.pe',
  phone: '987654321',
  password: 'Ofertas#2026',
};

describe('HttpIdentityGateway', () => {
  let gateway: HttpIdentityGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpIdentityGateway,
      ],
    });
    gateway = TestBed.inject(HttpIdentityGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the consumer to the gateway and returns the created account', async () => {
    const result = gateway.registerConsumer(PERSON);

    const request = http.expectOne(`${BASE_URL}/auth/register`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      role: 'CONSUMER',
      fullName: 'Ariana Torres',
      email: 'ariana@correo.pe',
      phone: '987654321',
      password: 'Ofertas#2026',
    });
    request.flush(
      { userId: 41, fullName: 'Ariana Torres', email: 'ariana@correo.pe', role: 'CONSUMER', consumerProfileId: 15 },
      { status: 201, statusText: 'Created' },
    );

    expect(await result).toEqual({
      userId: 41,
      fullName: 'Ariana Torres',
      email: 'ariana@correo.pe',
      role: 'CONSUMER',
    });
  });

  it('rejects with the code of a repeated email', async () => {
    const result = gateway.registerConsumer(PERSON);

    http
      .expectOne(`${BASE_URL}/auth/register`)
      .flush(
        { code: 'EMAIL_ALREADY_REGISTERED', message: 'Ese correo ya tiene una cuenta.' },
        { status: 409, statusText: 'Conflict' },
      );

    await expectAsync(result).toBeRejectedWith(
      new ApiError('EMAIL_ALREADY_REGISTERED', 'Ese correo ya tiene una cuenta.'),
    );
  });

  it('logs in through the gateway and maps the token answer', async () => {
    const result = gateway.logIn({ email: 'rosa.quispe@ejemplo.pe', password: 'Bodega#2026' });

    const request = http.expectOne(`${BASE_URL}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'rosa.quispe@ejemplo.pe', password: 'Bodega#2026' });
    request.flush({
      accessToken: 'header.payload.signature',
      tokenType: 'Bearer',
      expiresIn: 3600,
      userId: 42,
      role: 'BUSINESS_OWNER',
      businessId: 7,
      businessName: 'Bodega Doña Rosa',
    });

    expect(await result).toEqual({
      accessToken: 'header.payload.signature',
      expiresInSeconds: 3600,
      userId: 42,
      role: 'BUSINESS_OWNER',
      consumerId: undefined,
      businessId: 7,
      businessName: 'Bodega Doña Rosa',
    });
  });

  it('rejects wrong credentials with INVALID_CREDENTIALS', async () => {
    const result = gateway.logIn({ email: 'rosa.quispe@ejemplo.pe', password: 'mala' });

    http
      .expectOne(`${BASE_URL}/auth/login`)
      .flush(
        { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos.' },
        { status: 401, statusText: 'Unauthorized' },
      );

    await expectAsync(result).toBeRejectedWith(
      new ApiError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.'),
    );
  });
});
