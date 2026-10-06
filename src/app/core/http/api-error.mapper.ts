import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, NETWORK_ERROR, UNEXPECTED_ERROR } from '../../shared/domain/api-error';

const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor. Intenta de nuevo.';
const UNEXPECTED_ERROR_MESSAGE = 'No pudimos completar la operación. Inténtalo de nuevo.';

interface ErrorBody {
  code?: unknown;
  message?: unknown;
}

/** Turns whatever HttpClient rejected with into the ApiError the use cases understand. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (!(error instanceof HttpErrorResponse)) {
    return new ApiError(UNEXPECTED_ERROR, UNEXPECTED_ERROR_MESSAGE);
  }
  if (error.status === 0) {
    return new ApiError(NETWORK_ERROR, NETWORK_ERROR_MESSAGE);
  }
  const body = (error.error ?? {}) as ErrorBody;
  if (typeof body.code === 'string' && typeof body.message === 'string') {
    return new ApiError(body.code, body.message);
  }
  return new ApiError(UNEXPECTED_ERROR, UNEXPECTED_ERROR_MESSAGE);
}
