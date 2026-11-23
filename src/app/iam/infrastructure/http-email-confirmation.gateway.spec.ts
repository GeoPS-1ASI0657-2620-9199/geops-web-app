import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError, NETWORK_ERROR } from '../../shared/domain/api-error';
import { HttpEmailConfirmationGateway } from './http-email-confirmation.gateway';

const BASE_URL = 'http://gateway.test/api/v1';

describe('HttpEmailConfirmationGateway', () => {
  let gateway: HttpEmailConfirmationGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpEmailConfirmationGateway,
      ],
    });
    gateway = TestBed.inject(HttpEmailConfirmationGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the token to the public confirmation route without a session header', async () => {
    const result = gateway.confirm('abc123');

    const request = http.expectOne(`${BASE_URL}/auth/email-confirmations`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ token: 'abc123' });
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expectAsync(result).toBeResolved();
  });

  it('rejects an unknown, used or expired link with INVALID_CONFIRMATION_LINK', async () => {
    const result = gateway.confirm('used');

    http
      .expectOne(`${BASE_URL}/auth/email-confirmations`)
      .flush(
        { code: 'INVALID_CONFIRMATION_LINK', message: 'El enlace no es válido o ya venció.' },
        { status: 400, statusText: 'Bad Request' },
      );

    await expectAsync(result).toBeRejectedWith(
      new ApiError('INVALID_CONFIRMATION_LINK', 'El enlace no es válido o ya venció.'),
    );
  });

  it('rejects with NETWORK_ERROR when the gateway cannot be reached', async () => {
    const result = gateway.confirm('abc123');

    http.expectOne(`${BASE_URL}/auth/email-confirmations`).error(new ProgressEvent('error'), { status: 0 });

    await expectAsync(result).toBeRejectedWith(jasmine.objectContaining({ code: NETWORK_ERROR }));
  });
});
