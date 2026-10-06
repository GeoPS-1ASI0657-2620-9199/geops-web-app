import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../application/session.store';
import { UserRole } from '../domain/model/user-role';

/**
 * Opens the route only for the given roles. Without a session it goes to login and comes back;
 * with a session of another role it shows the forbidden page (CA-24.3, Figma screen 41).
 */
export function roleGuard(...allowed: UserRole[]): CanActivateFn {
  return (_route, state) => {
    const router = inject(Router);
    const session = inject(SessionStore).activeSession();
    if (!session) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    return allowed.includes(session.role) ? true : router.createUrlTree(['/forbidden']);
  };
}
