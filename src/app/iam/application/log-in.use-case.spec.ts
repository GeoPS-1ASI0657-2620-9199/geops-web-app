import { TestBed } from '@angular/core/testing';
import { RegisterConsumer, RegisteredUser } from '../domain/model/register-consumer';
import { Credentials, IssuedToken, Session, isActive } from '../domain/model/session';
import { IdentityGateway } from '../domain/ports/identity.gateway';
import { SessionStorage } from '../domain/ports/session.storage';
import { LogInUseCase } from './log-in.use-case';
import { LogOutUseCase } from './log-out.use-case';
import { SessionStore } from './session.store';

const NOW = Date.UTC(2026, 9, 4, 15, 0, 0);
const ONE_HOUR_SECONDS = 3600;

class FakeIdentityGateway extends IdentityGateway {
  received?: Credentials;

  override registerConsumer(_person: RegisterConsumer): Promise<RegisteredUser> {
    throw new Error('not used');
  }

  override async logIn(credentials: Credentials): Promise<IssuedToken> {
    this.received = credentials;
    return {
      accessToken: 'header.payload.signature',
      expiresInSeconds: ONE_HOUR_SECONDS,
      userId: 42,
      role: 'BUSINESS_OWNER',
      businessId: 7,
      businessName: 'Bodega Doña Rosa',
    };
  }
}

class MemorySessionStorage extends SessionStorage {
  stored: Session | null = null;
  override read(): Session | null {
    return this.stored;
  }
  override write(session: Session): void {
    this.stored = session;
  }
  override clear(): void {
    this.stored = null;
  }
}

describe('LogInUseCase and LogOutUseCase', () => {
  let gateway: FakeIdentityGateway;
  let storage: MemorySessionStorage;

  beforeEach(() => {
    gateway = new FakeIdentityGateway();
    storage = new MemorySessionStorage();
    TestBed.configureTestingModule({
      providers: [
        { provide: IdentityGateway, useValue: gateway },
        { provide: SessionStorage, useValue: storage },
      ],
    });
  });

  it('logs in with the normalized email and keeps the token until it expires', async () => {
    const session = await TestBed.inject(LogInUseCase).execute(
      { email: ' Rosa.Quispe@Ejemplo.PE ', password: 'Bodega#2026' },
      () => NOW,
    );

    expect(gateway.received).toEqual({ email: 'rosa.quispe@ejemplo.pe', password: 'Bodega#2026' });
    expect(session.expiresAt).toBe(NOW + ONE_HOUR_SECONDS * 1000);
    expect(session.businessId).toBe(7);
    expect(storage.stored).toEqual(session);
    expect(TestBed.inject(SessionStore).displayName()).toBe('Bodega Doña Rosa');
  });

  it('treats the session as over once the token expired', async () => {
    const session = await TestBed.inject(LogInUseCase).execute(
      { email: 'rosa@ejemplo.pe', password: 'Bodega#2026' },
      () => NOW,
    );

    expect(isActive(session, NOW + ONE_HOUR_SECONDS * 1000 - 1)).toBeTrue();
    expect(isActive(session, NOW + ONE_HOUR_SECONDS * 1000)).toBeFalse();
    expect(TestBed.inject(SessionStore).activeSession(NOW + ONE_HOUR_SECONDS * 1000)).toBeNull();
  });

  it('forgets the session on log out', async () => {
    await TestBed.inject(LogInUseCase).execute({ email: 'rosa@ejemplo.pe', password: 'x' }, () => NOW);

    TestBed.inject(LogOutUseCase).execute();

    expect(storage.stored).toBeNull();
    expect(TestBed.inject(SessionStore).session()).toBeNull();
  });
});
