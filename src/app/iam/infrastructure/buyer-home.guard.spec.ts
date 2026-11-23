import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Session } from '../domain/model/session';
import { SessionStorage } from '../domain/ports/session.storage';
import { buyerHomeGuard } from './buyer-home.guard';

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

describe('buyerHomeGuard', () => {
  const run = (session: Session | null) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionStorage, useValue: new MemorySessionStorage(session) }],
    });
    const result = TestBed.runInInjectionContext(() =>
      buyerHomeGuard({} as ActivatedRouteSnapshot, { url: '/inicio' } as RouterStateSnapshot),
    );
    const router = TestBed.inject(Router);
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  };

  it('sends a business owner to the business summary', () => {
    expect(run(sessionOf('BUSINESS_OWNER'))).toBe('/business');
  });

  it('opens the buyer home to a consumer', () => {
    expect(run(sessionOf('CONSUMER'))).toBeTrue();
  });

  it('opens the buyer home to a visitor', () => {
    expect(run(null)).toBeTrue();
  });

  it('treats an expired owner session as a visitor', () => {
    expect(run({ ...sessionOf('BUSINESS_OWNER'), expiresAt: Date.now() - 1 })).toBeTrue();
  });
});
