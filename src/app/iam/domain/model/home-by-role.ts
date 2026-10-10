import { UserRole } from './user-role';

/** Page each role lands on after login and when it asks for a page of another role. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  CONSUMER: '/inicio',
  BUSINESS_OWNER: '/business',
  ADMIN: '/inicio',
};
