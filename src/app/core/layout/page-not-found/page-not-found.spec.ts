import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SessionStorage } from '../../../iam/domain/ports/session.storage';
import { PageNotFound } from './page-not-found';

describe('PageNotFound', () => {
  it('explains that the address does not exist and offers the way back to the start', async () => {
    await TestBed.configureTestingModule({
      imports: [PageNotFound],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStorage, useValue: { read: () => null, write: () => undefined, clear: () => undefined } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PageNotFound);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.textContent).toContain('notFoundPage.title');
    expect(page.querySelector('a')!.getAttribute('href')).toBe('/inicio');
  });
});
