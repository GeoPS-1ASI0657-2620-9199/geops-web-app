import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Session } from '../../../iam/domain/model/session';
import { SessionStorage } from '../../../iam/domain/ports/session.storage';
import { Layout } from './layout';

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

const OWNER: Session = {
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 42,
  role: 'BUSINESS_OWNER',
  email: 'mirta@correo.pe',
  businessId: 4,
  businessName: 'Menús Doña Mirta',
};

describe('Layout', () => {
  let fixture: ComponentFixture<Layout>;
  let storage: MemorySessionStorage;

  const create = async (session: Session | null) => {
    storage = new MemorySessionStorage(session);
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideRouter([]), { provide: SessionStorage, useValue: storage }],
    }).compileComponents();
    fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
  };
  const tabs = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.tab')).map((a) => a.textContent?.trim());

  it('shows the campaign tabs and the business name to an owner', async () => {
    await create(OWNER);

    expect(tabs()).toEqual(['Mis campañas', 'Publicar campaña']);
    expect(fixture.nativeElement.textContent).toContain('Menús Doña Mirta');
  });

  it('shows only the offers tab and the login link to a visitor', async () => {
    await create(null);

    expect(tabs()).toEqual(['Ofertas cercanas']);
    expect(fixture.nativeElement.textContent).toContain('Iniciar sesión');
  });

  it('logs out and goes to login', async () => {
    await create(OWNER);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    (fixture.componentInstance as unknown as { logOut(): void }).logOut();

    expect(storage.stored).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
