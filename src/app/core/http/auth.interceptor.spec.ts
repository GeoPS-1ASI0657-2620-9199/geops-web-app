import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../iam/application/session.store';
import { Session } from '../../iam/domain/model/session';
import { SessionStorage } from '../../iam/domain/ports/session.storage';
import { API_BASE_URL } from '../config/api-base-url';
import { authInterceptor } from './auth.interceptor';

const BASE_URL = 'http://gateway.test/api/v1';
const ACTIVE: Session = {
  accessToken: 'token-123',
  expiresAt: Date.now() + 60_000,
  userId: 1,
  role: 'CONSUMER',
  email: 'ariana@correo.pe',
};

class MemorySessionStorage extends SessionStorage {
  constructor(public stored: Session | null) {
    super();
  }
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

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let storage: MemorySessionStorage;
  let router: Router;

  const setUp = (session: Session | null) => {
    storage = new MemorySessionStorage(session);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: SessionStorage, useValue: storage },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  };

  afterEach(() => backend.verify());

  it('adds the Bearer token to calls to the gateway', () => {
    setUp(ACTIVE);

    void firstValueFrom(http.get(`${BASE_URL}/offers/nearby`));

    expect(backend.expectOne(`${BASE_URL}/offers/nearby`).request.headers.get('Authorization')).toBe(
      'Bearer token-123',
    );
  });

  it('never sends the token to other hosts such as the map tiles', () => {
    setUp(ACTIVE);

    void firstValueFrom(http.get('https://tile.openstreetmap.org/15/1/1.png'));

    expect(backend.expectOne('https://tile.openstreetmap.org/15/1/1.png').request.headers.has('Authorization')).toBeFalse();
  });

  it('does not send an expired token', () => {
    setUp({ ...ACTIVE, expiresAt: Date.now() - 1 });

    void firstValueFrom(http.get(`${BASE_URL}/campaigns`));

    expect(backend.expectOne(`${BASE_URL}/campaigns`).request.headers.has('Authorization')).toBeFalse();
  });

  it('ends the session and goes to login when the gateway answers 401', async () => {
    setUp(ACTIVE);

    const call = firstValueFrom(http.get(`${BASE_URL}/campaigns`));
    backend.expectOne(`${BASE_URL}/campaigns`).flush(null, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(call).toBeRejected();
    expect(TestBed.inject(SessionStore).session()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expired: 1 } });
  });
});
