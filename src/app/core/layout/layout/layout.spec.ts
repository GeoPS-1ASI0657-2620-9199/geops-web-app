import { IdentityGateway } from '../../../iam/domain/ports/identity.gateway';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Routes, provideRouter } from '@angular/router';
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

@Component({ template: '' })
class BlankPage {}

const ROUTES: Routes = [
  { path: 'inicio', component: BlankPage },
  { path: 'offers', component: BlankPage },
  { path: 'offers/:id', component: BlankPage },
];

describe('Layout', () => {
  let fixture: ComponentFixture<Layout>;
  let storage: MemorySessionStorage;

  const create = async (session: Session | null, routes: Routes = []) => {
    storage = new MemorySessionStorage(session);
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [
        provideRouter(routes),
        provideTranslateService(),
        { provide: SessionStorage, useValue: storage },
        { provide: IdentityGateway, useValue: { logOut: () => Promise.resolve() } },
      ],
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

  it('shows the buyer tabs and follows to a consumer', async () => {
    await create({ ...OWNER, role: 'CONSUMER', businessId: undefined, businessName: undefined, consumerId: 2001 });

    expect(tabs()).toEqual([
      'nav.home',
      'nav.offers',
      'nav.categories',
      'nav.favorites',
      'nav.coupons',
    ]);
  });

  it('shows the buyer tabs and the login link to a visitor', async () => {
    await create(null);

    expect(tabs()).toEqual(['nav.home', 'nav.offers', 'nav.categories', 'nav.favorites', 'nav.coupons']);
    expect(fixture.nativeElement.textContent).toContain('header.logIn');
  });

  it('writes the brand as GeoPS in the top bar', async () => {
    await create(null);

    expect((fixture.nativeElement as HTMLElement).querySelector('.logo')?.textContent?.trim()).toBe('GeoPS');
  });

  it('hides the notices bell from a visitor and keeps it for a signed in user', async () => {
    const bell = () => (fixture.nativeElement as HTMLElement).querySelector('[aria-label="header.notifications"]');

    await create(null);
    expect(bell()).toBeNull();

    TestBed.resetTestingModule();
    await create(OWNER);
    expect(bell()).not.toBeNull();
  });

  it('logs out and goes to login', async () => {
    await create(OWNER);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    (fixture.componentInstance as unknown as { logOut(): void }).logOut();

    expect(storage.stored).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  describe('search box of the top bar', () => {
    const box = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="search"]')!;
    const go = async (url: string) => {
      await TestBed.inject(Router).navigateByUrl(url);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const submit = async (text: string) => {
      box().value = text;
      box().dispatchEvent(new Event('input'));
      box().form!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
      fixture.detectChanges();
    };

    it('shows the text of an Ofertas address opened directly, and nothing on other tabs', async () => {
      await create(null, ROUTES);

      await go('/offers?q=helado');
      expect(box().value).toBe('helado');

      await go('/inicio');
      expect(box().value).toBe('');
    });

    it('empties the box when the search is cleared from the page, keeping the category', async () => {
      await create(null, ROUTES);
      await go('/offers?q=helado&categoria=Postres');

      await go('/offers?categoria=Postres');

      expect(box().value).toBe('');
    });

    it('clears the search keeping the category when the box is emptied and sent', async () => {
      await create(null, ROUTES);
      await go('/offers?q=helado&categoria=Postres');

      await submit('   ');

      expect(TestBed.inject(Router).url).toBe('/offers?categoria=Postres');
    });

    it('adds the text to the category already chosen on Ofertas', async () => {
      await create(null, ROUTES);
      await go('/offers?categoria=Postres');

      await submit(' cafe ');

      expect(TestBed.inject(Router).url).toBe('/offers?categoria=Postres&q=cafe');
    });

    it('opens Ofertas with only the text from another tab', async () => {
      await create(null, ROUTES);
      await go('/offers/12?x=1');

      await submit('cafe');

      expect(TestBed.inject(Router).url).toBe('/offers?q=cafe');
    });
  });
});
