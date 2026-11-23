import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { GeoTicketCalculator, averageTicketOf } from './geo-ticket-calculator';

describe('GeoTicketCalculator', () => {
  it('divides the sales of a day by its customers and rounds to cents', () => {
    expect(averageTicketOf(600, 40)).toBe(15);
    expect(averageTicketOf(100, 3)).toBe(33.33);
    expect(averageTicketOf(600, null)).toBeNull();
    expect(averageTicketOf(0, 40)).toBeNull();
  });

  it('opens on demand and hands the average to the form once both figures are in', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(GeoTicketCalculator);
    const emitted: number[] = [];
    fixture.componentInstance.ticket.subscribe((value) => emitted.push(value));
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="day-sales"]')).toBeNull();

    (host.querySelector('button.toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const type = (id: string, value: string) => {
      const input = host.querySelector<HTMLInputElement>(`[data-testid="${id}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    type('day-sales', '600');
    await fixture.whenStable();
    expect(emitted).toEqual([]);

    type('day-customers', '40');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emitted).toEqual([15]);
    expect(host.querySelector('[data-testid="ticket-result"]')?.textContent).toContain('ticketCalculator.result');
  });
});
