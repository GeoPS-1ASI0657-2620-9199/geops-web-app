import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Session } from '../../../iam/domain/model/session';
import { SessionStorage } from '../../../iam/domain/ports/session.storage';
import { Forbidden } from './forbidden';

const CONSUMER: Session = {
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 7,
  role: 'CONSUMER',
  email: 'ariana@correo.pe',
};

describe('Forbidden', () => {
  it('titles the page with an h1 and takes the user back to the home of their role', async () => {
    await TestBed.configureTestingModule({
      imports: [Forbidden],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStorage, useValue: { read: () => CONSUMER, write: () => undefined, clear: () => undefined } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Forbidden);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent?.trim()).toBe('forbiddenPage.title');
    expect(page.querySelector('a')!.getAttribute('href')).toBe('/inicio');
  });
});
