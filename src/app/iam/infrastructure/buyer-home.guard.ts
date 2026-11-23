import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../application/session.store';
import { HOME_BY_ROLE } from '../domain/model/home-by-role';

/**
 * Keeps the buyer home for visitors and consumers. A business owner who lands on it goes to the
 * home of their role instead of seeing the buyer page under the business tabs.
 */
export const buyerHomeGuard: CanActivateFn = () => {
  const session = inject(SessionStore).activeSession();
  if (session?.role === 'BUSINESS_OWNER') {
    return inject(Router).createUrlTree([HOME_BY_ROLE.BUSINESS_OWNER]);
  }
  return true;
};
