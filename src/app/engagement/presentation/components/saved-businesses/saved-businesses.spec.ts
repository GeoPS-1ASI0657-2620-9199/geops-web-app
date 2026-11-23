import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SavedBusinessRepository } from '../../../domain/ports/saved-business.repository';
import { SavedBusinesses } from './saved-businesses';
describe('SavedBusinesses', () => {
  it('lists and removes saved businesses', async () => {
    const repository = jasmine.createSpyObj('SavedBusinessRepository', ['findMine', 'remove']);
    repository.findMine.and.resolveTo([{ id: 1, businessId: 84, businessName: 'Don Pepe', savedAt: '', activeOffersCount: 0, activeOffers: [] }]); repository.remove.and.resolveTo();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService(), { provide: SavedBusinessRepository, useValue: repository }] });
    const fixture = TestBed.createComponent(SavedBusinesses); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Don Pepe');
    await fixture.componentInstance.remove(84); fixture.detectChanges();
    expect(repository.remove).toHaveBeenCalledWith(84); expect(fixture.nativeElement.textContent).toContain('savedBusinesses.empty');
  });
});
describe('SavedBusinesses offers', () => {
  it('shows how many offers each saved business has and opens all of them to pick one', async () => {
    const repository = jasmine.createSpyObj('SavedBusinessRepository', ['findMine', 'remove']);
    repository.findMine.and.resolveTo([{ id: 1, businessId: 85, businessName: 'Bodega Rosa', savedAt: '', activeOffersCount: 2,
      activeOffers: [{ offerId: 1070, title: 'Menu del dia', validTo: '2026-11-30' }, { offerId: 1071, title: '2x1 en gaseosas', validTo: '2026-12-05' }] }]);
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService(), { provide: SavedBusinessRepository, useValue: repository }] });
    const fixture = TestBed.createComponent(SavedBusinesses); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('followsPage.count');
    expect(element.textContent).toContain('savedBusinesses.noNotices');
    (element.querySelector('button.toggle') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(Array.from(element.querySelectorAll('.offers a')).map(a => a.getAttribute('href'))).toEqual(['/offers/1070', '/offers/1071']);
  });
});
describe('SavedBusinesses states', () => {
  it('shows the same empty state as the other favorites tabs, with a way back to the offers', async () => {
    const repository = jasmine.createSpyObj('SavedBusinessRepository', ['findMine', 'remove']);
    repository.findMine.and.resolveTo([]);
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService(), { provide: SavedBusinessRepository, useValue: repository }] });
    const fixture = TestBed.createComponent(SavedBusinesses); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('geo-empty-state')).not.toBeNull();
    expect(element.querySelector('a[href="/offers"]')).not.toBeNull();
  });
});
