import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { ApiError } from '../../../../shared/domain/api-error';
import { CreateCampaignUseCase } from '../../../application/create-campaign.use-case';
import { ListOfferCategoriesUseCase } from '../../../application/list-offer-categories.use-case';
import { DistrictDirectory } from '../../../domain/ports/district.directory';
import { CreateCampaignPage } from './create-campaign.page';

interface PageInternals {
  form: {
    patchValue(v: object): void;
    controls: { end: { hasError(e: string): boolean }; offers: { at(i: number): { setValue(v: object): void } } };
  };
  zone: { set(z: unknown): void };
}

describe('CreateCampaignPage', () => {
  let fixture: ComponentFixture<CreateCampaignPage>;
  let page: CreateCampaignPage;
  let internals: PageInternals;
  let useCase: jasmine.SpyObj<CreateCampaignUseCase>;
  let router: Router;
  let categories: jasmine.SpyObj<ListOfferCategoriesUseCase>;

  const fill = () => {
    internals.form.patchValue({ name: 'Almuerzos de octubre', start: '2026-10-05', end: '2026-10-31', address: 'Av. Larco 345, Miraflores' });
    internals.form.controls.offers.at(0).setValue({
      title: '2x1 en almuerzos ejecutivos',
      conditions: 'Un cupón por mesa.',
      price: 15,
      validTo: '2026-10-15',
      category: 'Gastronomía',
      imageUrl: '',
    });
    page.onStorePoint({ latitude: -12.1211, longitude: -77.0297 });
    internals.zone.set({ type: 'RADIUS', center: { latitude: -12.1211, longitude: -77.0297 }, radiusMeters: 800 });
  };

  beforeEach(async () => {
    useCase = jasmine.createSpyObj<CreateCampaignUseCase>('CreateCampaignUseCase', ['execute']);
    categories = jasmine.createSpyObj<ListOfferCategoriesUseCase>('ListOfferCategoriesUseCase', ['execute']);
    categories.execute.and.resolveTo(['Gastronomía', 'Mascotas']);
    await TestBed.configureTestingModule({
      imports: [CreateCampaignPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ListOfferCategoriesUseCase, useValue: categories },
        { provide: CreateCampaignUseCase, useValue: useCase },
        { provide: DistrictDirectory, useValue: { all: () => [] } },
        { provide: SessionStore, useValue: { session: () => ({ businessName: 'Restaurante Don Pepe' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateCampaignPage);
    page = fixture.componentInstance;
    internals = page as unknown as PageInternals;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('publishes with the business name of the session and goes back to the panel (CA-05.1, DG-1)', async () => {
    fill();
    useCase.execute.and.resolveTo({ campaignId: 31, name: 'Almuerzos de octubre', status: 'ACTIVE' });

    await page.submit();

    expect(useCase.execute.calls.mostRecent().args[0].businessName).toBe('Restaurante Don Pepe');
    expect(useCase.execute.calls.mostRecent().args[0].zone).toEqual(
      jasmine.objectContaining({ type: 'RADIUS', radiusMeters: 800 }),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/campaigns'], { queryParams: { created: 1 } });
  });

  it('marks the end date when the validity already ended (CA-05.3, Figma 37)', async () => {
    fill();
    useCase.execute.and.rejectWith(new ApiError('CAMPAIGN_ALREADY_ENDED', 'La vigencia que elegiste ya pasó.'));

    await page.submit();
    fixture.detectChanges();

    expect(internals.form.controls.end.hasError('rule')).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('La vigencia que elegiste ya pasó');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('offers the closed list of Catalog as the category (US08, E2-06)', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect((page as unknown as { categories(): string[] }).categories()).toEqual(['Gastronomía', 'Mascotas']);
    expect(fixture.nativeElement.querySelector('mat-select[data-testid="offer-category"]')).not.toBeNull();
  });

  it('warns when the list of categories cannot be read', async () => {
    categories.execute.and.rejectWith(new ApiError('NETWORK_ERROR', 'no'));
    fixture = TestBed.createComponent(CreateCampaignPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('createCampaign.categoriesUnavailable');
  });

  it('asks for the zone before calling Catalog', async () => {
    fill();
    internals.zone.set(null);

    await page.submit();
    fixture.detectChanges();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Falta la zona de la campaña');
  });
});
