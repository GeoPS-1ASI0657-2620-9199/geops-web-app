import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpRadiusPreferenceGateway } from './http-radius-preference.gateway';

const PROFILE_URL = 'http://gateway.test/api/v1/consumer-profiles/me';
const PROFILE = { consumerId: 41, searchRadiusMinutes: 15, locationPermission: false, defaultDistrict: null };

describe('HttpRadiusPreferenceGateway', () => {
  let gateway: HttpRadiusPreferenceGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://gateway.test/api/v1' },
        HttpRadiusPreferenceGateway,
      ],
    });
    gateway = TestBed.inject(HttpRadiusPreferenceGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the radius of the consumer profile', async () => {
    const result = gateway.fetch();

    http.expectOne(PROFILE_URL).flush(PROFILE);

    expect(await result).toBe(15);
  });

  it('saves the radius with PUT search-radius (E2-07)', async () => {
    const result = gateway.save(20);

    const request = http.expectOne(PROFILE_URL + '/search-radius');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ radiusMinutes: 20 });
    request.flush({ ...PROFILE, searchRadiusMinutes: 20 });

    await expectAsync(result).toBeResolved();
  });

  it('rejects with the code of Identity', async () => {
    const saving = gateway.save(25);
    http
      .expectOne(PROFILE_URL + '/search-radius')
      .flush({ code: 'RADIUS_OUT_OF_RANGE', message: 'Elige un radio entre 5 y 20 minutos a pie.' }, { status: 400, statusText: 'Bad Request' });
    await expectAsync(saving).toBeRejectedWith(jasmine.objectContaining<ApiError>({ code: 'RADIUS_OUT_OF_RANGE' }));

    const reading = gateway.fetch();
    http.expectOne(PROFILE_URL).flush({ code: 'CONSUMER_PROFILE_NOT_FOUND', message: 'no' }, { status: 404, statusText: 'Not Found' });
    await expectAsync(reading).toBeRejectedWith(jasmine.objectContaining<ApiError>({ code: 'CONSUMER_PROFILE_NOT_FOUND' }));
  });
});
