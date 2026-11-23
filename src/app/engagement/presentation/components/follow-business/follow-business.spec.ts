import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { FollowRepository } from '../../../domain/ports/follow.repository';
import { FollowBusiness } from './follow-business';

describe('FollowBusiness', () => {
  const followed = (businessId: number) => ({ businessId, businessName: 'Don Pepe', followedAt: '', activeOffersCount: 0, activeOffers: [] });
  let repository: jasmine.SpyObj<FollowRepository>;

  beforeEach(() => {
    repository = jasmine.createSpyObj<FollowRepository>('FollowRepository', ['findMine', 'follow', 'unfollow']);
    repository.follow.and.resolveTo();
    repository.unfollow.and.resolveTo();
    TestBed.configureTestingModule({ providers: [provideTranslateService(), { provide: FollowRepository, useValue: repository }] });
  });

  async function render(businessId: number) {
    const fixture = TestBed.createComponent(FollowBusiness);
    fixture.componentRef.setInput('businessId', businessId);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('says "Siguiendo" on any offer of a followed business', async () => {
    repository.findMine.and.resolveTo([followed(84)]);

    const fixture = await render(84);

    expect(fixture.componentInstance.following()).toBeTrue();
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('does not show the state of the previous business while it asks for the new one', async () => {
    repository.findMine.and.resolveTo([followed(84)]);
    const fixture = await render(84);
    let answer!: (list: ReturnType<typeof followed>[]) => void;
    repository.findMine.and.returnValue(new Promise((resolve) => (answer = resolve)));

    fixture.componentRef.setInput('businessId', 85);
    fixture.detectChanges();

    expect(fixture.componentInstance.following()).toBeFalse();
    expect(fixture.componentInstance.busy()).toBeTrue();
    answer([followed(84)]);
    await fixture.whenStable();
    expect(fixture.componentInstance.following()).toBeFalse();
    expect(fixture.componentInstance.busy()).toBeFalse();
  });

  it('ignores a late answer about the business of the previous offer', async () => {
    let first!: (list: ReturnType<typeof followed>[]) => void;
    repository.findMine.and.returnValue(new Promise((resolve) => (first = resolve)));
    const fixture = TestBed.createComponent(FollowBusiness);
    fixture.componentRef.setInput('businessId', 84);
    fixture.detectChanges();

    repository.findMine.and.resolveTo([]);
    fixture.componentRef.setInput('businessId', 85);
    fixture.detectChanges();
    await fixture.whenStable();
    first([followed(85)]);
    await fixture.whenStable();

    expect(fixture.componentInstance.following()).toBeFalse();
  });
});
