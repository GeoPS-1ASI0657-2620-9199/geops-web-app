import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { FollowRepository } from '../../../domain/ports/follow.repository';
import { FollowedBusinesses } from './followed-businesses';

describe('FollowedBusinesses', () => {
  const business = { businessId: 84, businessName: 'Don Pepe', followedAt: '', activeOffersCount: 2, activeOffers: [{ offerId: 1052, title: '2x1', validTo: '2026-11-15' }, { offerId: 1053, title: 'Menu del dia', validTo: '2026-11-20' }] };
  let repository: jasmine.SpyObj<FollowRepository>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('FollowRepository', ['findMine', 'follow', 'unfollow']);
    repository.findMine.and.resolveTo([business]);
    repository.unfollow.and.resolveTo();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideTranslateService(), { provide: FollowRepository, useValue: repository }] });
  });
  it('lists businesses with a link to each of their active offers, not only the first, and unfollows', async () => {
    const fixture = TestBed.createComponent(FollowedBusinesses);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Don Pepe');
    (element.querySelector('button.toggle') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(Array.from(element.querySelectorAll('.offers a')).map(a => a.getAttribute('href'))).toEqual(['/offers/1052', '/offers/1053']);
    await fixture.componentInstance.remove(84); fixture.detectChanges();
    expect(repository.unfollow).toHaveBeenCalledWith(84);
    expect(element.textContent).toContain('followsPage.empty');
  });
  it('preserves the list when removal fails and shows the API error', async () => {
    const fixture = TestBed.createComponent(FollowedBusinesses);
    fixture.detectChanges(); await fixture.whenStable();
    repository.unfollow.and.rejectWith(new Error('offline'));
    await fixture.componentInstance.remove(84); fixture.detectChanges();
    expect(fixture.componentInstance.businesses().length).toBe(1);
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
  });
});
