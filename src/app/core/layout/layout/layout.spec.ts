import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Session } from '../../../iam/domain/model/session';
import { SessionStorage } from '../../../iam/domain/ports/session.storage';
import { Layout } from './layout';
import { provideTranslateService } from '@ngx-translate/core';

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
      providers: [provideRouter([]), provideTranslateService(), { provide: SessionStorage, useValue: storage }],
    }).compileComponents();
    fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
  };
  const tabs = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.tab')).map((a) => a.textContent?.trim());

  it('shows the six business tabs of the Figma and the business name to an owner', async () => {
    await create(OWNER);

    expect(tabs()).toEqual(['nav.summary', 'nav.validate', 'nav.campaigns', 'nav.create', 'nav.reports', 'nav.comments']);
    expect(fixture.nativeElement.textContent).toContain('Menús Doña Mirta');
  });

  it('shows the five buyer tabs of the Figma to a consumer', async () => {
    await create({ ...OWNER, role: 'CONSUMER', businessId: undefined, businessName: undefined, consumerId: 2001 });

    expect(tabs()).toEqual(['nav.home', 'nav.offers', 'nav.categories', 'nav.favorites', 'nav.coupons']);
  });

  it('shows the buyer tabs and the login link to a visitor', async () => {
    await create(null);

    expect(tabs()).toEqual(['nav.home', 'nav.offers', 'nav.categories', 'nav.favorites', 'nav.coupons']);
    expect(fixture.nativeElement.textContent).toContain('header.logIn');
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
