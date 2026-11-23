import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BusinessOffers, shortDay } from './business-offers';

describe('BusinessOffers', () => {
  const offers = [
    { offerId: 1052, title: 'Menu del dia', validTo: '2026-11-30' },
    { offerId: 1053, title: '2x1 en gaseosas', validTo: '2026-12-05' },
    { offerId: 1054, title: 'Jalea para dos', validTo: '2026-12-10' },
  ];

  function render(list = offers) {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService()] });
    const fixture = TestBed.createComponent(BusinessOffers);
    fixture.componentRef.setInput('offers', list);
    fixture.componentRef.setInput('businessName', 'Don Pepe');
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('opens every offer of the business, each one a link to its own detail', () => {
    const { fixture, element } = render();
    const toggle = element.querySelector('button.toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.offers')).toBeNull();

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const links = Array.from(element.querySelectorAll('.offers a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/offers/1052', '/offers/1053', '/offers/1054']);
    expect(element.textContent).toContain('2x1 en gaseosas');
  });

  it('closes again with the same button', () => {
    const { fixture, element } = render();
    const toggle = element.querySelector('button.toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    toggle.click();
    fixture.detectChanges();

    expect(element.querySelector('.offers')).toBeNull();
  });

  it('shows nothing to open when the business has no offer today', () => {
    const { element } = render([]);

    expect(element.querySelector('button')).toBeNull();
  });

  it('writes the last day as dd/mm/yyyy without moving it a day back', () => {
    expect(shortDay('2026-12-05')).toBe('05/12/2026');
  });
});
