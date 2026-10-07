import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LogOutUseCase } from '../../iam/application/log-out.use-case';
import { SessionStore } from '../../iam/application/session.store';
import { API_BASE_URL } from '../config/api-base-url';

const UNAUTHORIZED = 401;

/**
 * Sends the token as a Bearer header only to the GeoPS gateway, never to third parties such as the
 * map tiles. When the gateway answers 401 to a request that carried the token, the session is over:
 * it is cleared and the user goes back to login.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);
  if (!request.url.startsWith(baseUrl)) {
    return next(request);
  }
  const session = inject(SessionStore).activeSession();
  if (!session) {
    return next(request);
  }
  const logOut = inject(LogOutUseCase);
  const router = inject(Router);
  const authorized = request.clone({ setHeaders: { Authorization: `Bearer ${session.accessToken}` } });
  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === UNAUTHORIZED) {
        logOut.execute();
        void router.navigate(['/login'], { queryParams: { expired: 1 } });
      }
      return throwError(() => error);
    }),
  );
};
