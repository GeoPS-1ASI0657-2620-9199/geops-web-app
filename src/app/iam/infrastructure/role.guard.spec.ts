import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Session } from '../domain/model/session';
import { SessionStorage } from '../domain/ports/session.storage';
import { roleGuard } from './role.guard';

class MemorySessionStorage extends SessionStorage {
  constructor(private readonly stored: Session | null) {
    super();
  }
  override read(): Session | null {
    return this.stored;
  }
  override write(): void {}
  override clear(): void {}
}

const sessionOf = (role: Session['role']): Session => ({
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 1,
  role,
  email: 'rosa@ejemplo.pe',
});

describe('roleGuard', () => {
  const run = (session: Session | null, url = '/campaigns') => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionStorage, useValue: new MemorySessionStorage(session) }],
    });
    const result = TestBed.runInInjectionContext(() =>
      roleGuard('BUSINESS_OWNER')({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
    const router = TestBed.inject(Router);
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  };

  it('opens the campaign panel to a business owner (US23)', () => {
    expect(run(sessionOf('BUSINESS_OWNER'))).toBeTrue();
  });

  it('shows the forbidden page to a consumer', () => {
    expect(run(sessionOf('CONSUMER'))).toBe('/forbidden');
  });

  it('sends a visitor to login and back to the page asked', () => {
    expect(run(null, '/campaigns/new')).toBe('/login?returnUrl=%2Fcampaigns%2Fnew');
  });

  it('treats an expired token as no session', () => {
    expect(run({ ...sessionOf('BUSINESS_OWNER'), expiresAt: Date.now() - 1 })).toBe('/login?returnUrl=%2Fcampaigns');
  });
});
