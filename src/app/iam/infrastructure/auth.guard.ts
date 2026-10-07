import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../application/session.store';

/** Lets the route open only with an active session; otherwise goes to login and comes back after. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(SessionStore).activeSession()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
