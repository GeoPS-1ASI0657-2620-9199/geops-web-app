import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApiError } from '../../../../shared/domain/api-error';
import { CreateCampaignUseCase } from '../../../application/create-campaign.use-case';
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

  const fill = () => {
    internals.form.patchValue({ name: 'Almuerzos de octubre', start: '2026-10-05', end: '2026-10-31', address: 'Av. Larco 345, Miraflores' });
    internals.form.controls.offers.at(0).setValue({
      title: '2x1 en almuerzos ejecutivos',
      conditions: 'Un cupón por mesa.',
      price: 15,
      validTo: '2026-10-15',
      category: 'Gastronomía',
    });
    page.onStorePoint({ latitude: -12.1211, longitude: -77.0297 });
    internals.zone.set({ type: 'RADIUS', center: { latitude: -12.1211, longitude: -77.0297 }, radiusMeters: 800 });
  };

  beforeEach(async () => {
    useCase = jasmine.createSpyObj<CreateCampaignUseCase>('CreateCampaignUseCase', ['execute']);
    await TestBed.configureTestingModule({
      imports: [CreateCampaignPage],
      providers: [
        provideRouter([]),
        { provide: CreateCampaignUseCase, useValue: useCase },
        { provide: DistrictDirectory, useValue: { all: () => [] } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateCampaignPage);
    page = fixture.componentInstance;
    internals = page as unknown as PageInternals;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('publishes and goes back to the panel with the confirmation (CA-05.1)', async () => {
    fill();
    useCase.execute.and.resolveTo({ campaignId: 31, name: 'Almuerzos de octubre', status: 'ACTIVE' });

    await page.submit();

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

  it('asks for the zone before calling Catalog', async () => {
    fill();
    internals.zone.set(null);

    await page.submit();
    fixture.detectChanges();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Falta la zona de la campaña');
  });
});
