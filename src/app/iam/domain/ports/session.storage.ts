import { Session } from '../model/session';

/** Where the session survives a page reload. Implementations never keep it after the tab closes. */
export abstract class SessionStorage {
  abstract read(): Session | null;
  abstract write(session: Session): void;
  abstract clear(): void;
}
