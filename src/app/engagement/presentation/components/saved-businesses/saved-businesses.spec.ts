import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SavedBusinessRepository } from '../../../domain/ports/saved-business.repository';
import { SavedBusinesses } from './saved-businesses';
describe('SavedBusinesses', () => {
  it('lists and removes saved businesses', async () => {
    const repository = jasmine.createSpyObj('SavedBusinessRepository', ['findMine', 'remove']);
    repository.findMine.and.resolveTo([{ id: 1, businessId: 84, businessName: 'Don Pepe', savedAt: '' }]); repository.remove.and.resolveTo();
    TestBed.configureTestingModule({ providers: [provideTranslateService(), { provide: SavedBusinessRepository, useValue: repository }] });
    const fixture = TestBed.createComponent(SavedBusinesses); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Don Pepe');
    await fixture.componentInstance.remove(84); fixture.detectChanges();
    expect(repository.remove).toHaveBeenCalledWith(84); expect(fixture.nativeElement.textContent).toContain('savedBusinesses.empty');
  });
});
