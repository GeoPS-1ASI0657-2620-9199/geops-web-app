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
 * it is cleared and the user goes back to login. A token that already ran out on the clock ends the
 * session the same way before the call, instead of sending the call without it and leaving the top
 * bar saying the user is still logged in while every private call answers 401.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const baseUrl = inject(API_BASE_URL);
  if (!request.url.startsWith(baseUrl)) {
    return next(request);
  }
  const store = inject(SessionStore);
  const session = store.activeSession();
  if (!session) {
    if (store.session()) {
      endSession(inject(LogOutUseCase), inject(Router));
    }
    return next(request);
  }
  const logOut = inject(LogOutUseCase);
  const router = inject(Router);
  const authorized = request.clone({ setHeaders: { Authorization: `Bearer ${session.accessToken}` } });
  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === UNAUTHORIZED) {
        endSession(logOut, router);
      }
      return throwError(() => error);
    }),
  );
};

/** The token is no longer valid: no revocation call, so a 401 cannot loop into another 401. */
function endSession(logOut: LogOutUseCase, router: Router): void {
  logOut.execute({ revoke: false });
  void router.navigate(['/login'], { queryParams: { expired: 1 } });
}
