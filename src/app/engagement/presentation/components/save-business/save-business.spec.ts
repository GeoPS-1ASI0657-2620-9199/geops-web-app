import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SavedBusinessRepository } from '../../../domain/ports/saved-business.repository';
import { SaveBusiness } from './save-business';

describe('SaveBusiness', () => {
  const saved = (businessId: number) => ({ id: 1, businessId, businessName: 'Don Pepe', savedAt: '', activeOffersCount: 0, activeOffers: [] });
  let repository: jasmine.SpyObj<SavedBusinessRepository>;

  beforeEach(() => {
    repository = jasmine.createSpyObj<SavedBusinessRepository>('SavedBusinessRepository', ['findMine', 'save', 'remove']);
    repository.save.and.resolveTo();
    repository.remove.and.resolveTo();
    TestBed.configureTestingModule({ providers: [provideTranslateService(), { provide: SavedBusinessRepository, useValue: repository }] });
  });

  async function render(businessId: number) {
    const fixture = TestBed.createComponent(SaveBusiness);
    fixture.componentRef.setInput('businessId', businessId);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('shows as saved on any offer of a business the consumer already saved', async () => {
    repository.findMine.and.resolveTo([saved(84)]);

    const fixture = await render(84);

    expect(fixture.componentInstance.saved()).toBeTrue();
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('removes the business with a second tap', async () => {
    repository.findMine.and.resolveTo([saved(84)]);
    const fixture = await render(84);

    await fixture.componentInstance.toggle();

    expect(repository.remove).toHaveBeenCalledWith(84);
    expect(fixture.componentInstance.saved()).toBeFalse();
  });

  it('asks again and forgets the old state when the offer belongs to another business', async () => {
    repository.findMine.and.resolveTo([saved(84)]);
    const fixture = await render(84);

    repository.findMine.and.resolveTo([saved(84)]);
    fixture.componentRef.setInput('businessId', 85);
    fixture.detectChanges();
    expect(fixture.componentInstance.saved()).toBeFalse();
    await fixture.whenStable();

    expect(repository.findMine).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.saved()).toBeFalse();
  });
});
