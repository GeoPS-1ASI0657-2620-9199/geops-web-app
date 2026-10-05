import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, NETWORK_ERROR, UNEXPECTED_ERROR } from '../../shared/domain/api-error';
import { toApiError } from './api-error.mapper';

describe('toApiError', () => {
  it('keeps the code and message of the GeoPS error body', () => {
    const error = toApiError(
      new HttpErrorResponse({
        status: 409,
        error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'Ese correo ya tiene una cuenta.' },
      }),
    );

    expect(error.code).toBe('EMAIL_ALREADY_REGISTERED');
    expect(error.message).toBe('Ese correo ya tiene una cuenta.');
  });

  it('reports a network error when the gateway cannot be reached', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 })).code).toBe(NETWORK_ERROR);
  });

  it('reports an unexpected error when the body is not a GeoPS error', () => {
    const error = toApiError(new HttpErrorResponse({ status: 502, error: '<html>Bad Gateway</html>' }));

    expect(error.code).toBe(UNEXPECTED_ERROR);
  });

  it('returns an ApiError unchanged', () => {
    const original = new ApiError('INVALID_REQUEST', 'Revisa estos datos: phone.');

    expect(toApiError(original)).toBe(original);
  });
});
