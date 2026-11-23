import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { ApiError } from '../../../../shared/domain/api-error';
import { ListMyCampaignsUseCase } from '../../../application/list-my-campaigns.use-case';
import { CreateCampaignUseCase } from '../../../application/create-campaign.use-case';
import { ListOfferCategoriesUseCase } from '../../../application/list-offer-categories.use-case';
import { VerifyBusinessUseCase } from '../../../../iam/application/verify-business.use-case';
import { DistrictDirectory } from '../../../domain/ports/district.directory';
import { ImageCompressor } from '../../../domain/ports/image-compressor';
import { OfferImageUploader } from '../../../domain/ports/offer-image.uploader';
import { CreateCampaignPage } from './create-campaign.page';

interface PageInternals {
  form: {
    patchValue(v: object): void;
    controls: {
      end: { hasError(e: string): boolean; setValue(v: string): void };
      address: { value: string };
      offers: { at(i: number): AbstractControl; length: number };
    };
  };
  zone: { set(z: unknown): void };
  uploading(): boolean;
}

const PHOTO_URL = 'http://gateway.test/api/v1/offers/images/7f1c';

describe('CreateCampaignPage', () => {
  let fixture: ComponentFixture<CreateCampaignPage>;
  let page: CreateCampaignPage;
  let internals: PageInternals;
  let useCase: jasmine.SpyObj<CreateCampaignUseCase>;
  let router: Router;
  let categories: jasmine.SpyObj<ListOfferCategoriesUseCase>;
  let verification: { verificationStatus: () => string; profile: () => Promise<unknown> };
  let myCampaigns: { lastStorePoint: () => Promise<unknown> };
  let uploader: jasmine.SpyObj<OfferImageUploader>;
  const offer = (index = 0) => internals.form.controls.offers.at(index);
  const host = () => fixture.nativeElement as HTMLElement;
  const photo = (type = 'image/jpeg', size = 1024) =>
    new File([new Uint8Array(size)], 'menu.jpg', { type });

  const fill = () => {
    internals.form.patchValue({ name: 'Almuerzos de octubre', start: '2026-10-05', end: '2026-10-31', address: 'Av. Larco 345, Miraflores' });
    internals.form.controls.offers.at(0).setValue({
      title: '2x1 en almuerzos ejecutivos',
      conditions: 'Un cupón por mesa.',
      price: 15,
      regularPrice: null,
      validTo: '2026-10-15',
      category: 'Gastronomía',
      imageUrl: '',
      imageId: '',
    });
    page.onStorePoint({ latitude: -12.1211, longitude: -77.0297 });
    internals.zone.set({ type: 'RADIUS', center: { latitude: -12.1211, longitude: -77.0297 }, radiusMeters: 800 });
  };

  beforeEach(async () => {
    useCase = jasmine.createSpyObj<CreateCampaignUseCase>('CreateCampaignUseCase', ['execute']);
    verification = { verificationStatus: () => 'PENDING', profile: () => Promise.resolve() };
    myCampaigns = { lastStorePoint: () => Promise.resolve(null) };
    categories = jasmine.createSpyObj<ListOfferCategoriesUseCase>('ListOfferCategoriesUseCase', ['execute']);
    categories.execute.and.resolveTo(['Gastronomía', 'Mascotas']);
    uploader = jasmine.createSpyObj<OfferImageUploader>('OfferImageUploader', ['upload']);
    await TestBed.configureTestingModule({
      imports: [CreateCampaignPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ListOfferCategoriesUseCase, useValue: categories },
        { provide: VerifyBusinessUseCase, useValue: verification },
        { provide: CreateCampaignUseCase, useValue: useCase },
        { provide: ListMyCampaignsUseCase, useValue: myCampaigns },
        { provide: OfferImageUploader, useValue: uploader },
        // The page test keeps the chosen file as is; BrowserImageCompressor has its own test.
        { provide: ImageCompressor, useValue: { compress: (file: File) => Promise.resolve(file) } },
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

  it('shows the real status of the business instead of a fixed seal (E2-16)', async () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Restaurante Don Pepe');
    expect(fixture.nativeElement.querySelector('[data-testid="business-seal"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('verifyBusiness.status.PENDING');
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

  it('sends the regular price when it is above the price', async () => {
    fill();
    offer().patchValue({ regularPrice: 30 });
    useCase.execute.and.resolveTo({ campaignId: 31, name: 'Almuerzos de octubre', status: 'ACTIVE' });

    await page.submit();

    expect(useCase.execute.calls.mostRecent().args[0].offers[0]).toEqual(
      jasmine.objectContaining({ price: 15, regularPrice: 30 }),
    );
  });

  it('sends no regular price when the owner leaves it empty', async () => {
    fill();
    useCase.execute.and.resolveTo({ campaignId: 31, name: 'Almuerzos de octubre', status: 'ACTIVE' });

    await page.submit();

    expect(useCase.execute.calls.mostRecent().args[0].offers[0].regularPrice).toBeNull();
  });

  it('does not publish a regular price that is not above the price', async () => {
    fill();
    offer().patchValue({ regularPrice: 15 });

    await page.submit();

    expect(offer().get('regularPrice')?.hasError('notAbovePrice')).toBeTrue();
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('checks the regular price again when the price changes', () => {
    fill();
    offer().patchValue({ regularPrice: 20 });
    expect(offer().get('regularPrice')?.hasError('notAbovePrice')).toBeFalse();

    offer().get('price')?.setValue(25);

    expect(offer().get('regularPrice')?.hasError('notAbovePrice')).toBeTrue();
  });

  it('takes the end of the campaign as the "Vence" of an offer left empty', () => {
    internals.form.controls.end.setValue('2026-10-31');
    page.addOffer();

    expect(offer(0).get('validTo')?.value).toBe('2026-10-31');
    expect(offer(1).get('validTo')?.value).toBe('2026-10-31');
  });

  it('keeps "Vence" following the end until the owner picks a day', () => {
    internals.form.controls.end.setValue('2026-10-31');
    page.addOffer();
    offer(1).get('validTo')?.setValue('2026-10-15');

    internals.form.controls.end.setValue('2026-11-20');

    expect(offer(0).get('validTo')?.value).toBe('2026-11-20');
    expect(offer(1).get('validTo')?.value).toBe('2026-10-15');
  });

  it('shows the dates as dd/mm/yyyy and keeps them as ISO days in the form', async () => {
    internals.form.controls.end.setValue('2026-10-31');
    fixture.detectChanges();
    await fixture.whenStable();
    const end = host().querySelector<HTMLInputElement>('[data-testid="campaign-end"]')!;

    expect(end.value).toBe('31/10/2026');

    end.value = '05/11/2026';
    end.dispatchEvent(new Event('input'));

    expect(offer().get('validTo')?.value).toBe('2026-11-05');
    expect((internals.form as unknown as { value: { end: string } }).value.end).toBe('2026-11-05');
  });

  it('uploads the photo, keeps its address and hides the link field', async () => {
    uploader.upload.and.resolveTo({ imageId: '7f1c', url: PHOTO_URL });
    fixture.detectChanges();

    await page.uploadPhoto(offer(), photo());
    fixture.detectChanges();

    expect(uploader.upload).toHaveBeenCalledTimes(1);
    expect(offer().get('imageUrl')?.value).toBe(PHOTO_URL);
    expect(host().querySelector('[data-testid="offer-photo"] img')).not.toBeNull();
    expect(host().querySelector('[data-testid="offer-image-url"]')).toBeNull();
    expect(host().querySelector('[data-testid="upload-photo"]')).toBeNull();
  });

  it('publishes with the address of the uploaded photo', async () => {
    fill();
    uploader.upload.and.resolveTo({ imageId: '7f1c', url: PHOTO_URL });
    useCase.execute.and.resolveTo({ campaignId: 31, name: 'Almuerzos de octubre', status: 'ACTIVE' });
    await page.uploadPhoto(offer(), photo());

    await page.submit();

    expect(useCase.execute.calls.mostRecent().args[0].offers[0].imageUrl).toBe(PHOTO_URL);
  });

  it('waits for the photo before publishing', async () => {
    fill();
    let finish: (value: { imageId: string; url: string }) => void = () => undefined;
    uploader.upload.and.returnValue(new Promise((resolve) => (finish = resolve)));

    const upload = page.uploadPhoto(offer(), photo());
    expect(internals.uploading()).toBeTrue();
    await page.submit();
    expect(useCase.execute).not.toHaveBeenCalled();

    finish({ imageId: '7f1c', url: PHOTO_URL });
    await upload;
    expect(internals.uploading()).toBeFalse();
  });

  it('rejects a photo that is not JPG, PNG or WebP without uploading it', async () => {
    fixture.detectChanges();

    await page.uploadPhoto(offer(), photo('image/gif'));
    fixture.detectChanges();

    expect(uploader.upload).not.toHaveBeenCalled();
    expect(host().querySelector('[data-testid="photo-error"]')?.textContent).toContain('JPG, PNG o WebP');
    expect(host().querySelector('[data-testid="offer-image-url"]')).not.toBeNull();
  });

  it('rejects a photo over 2 MB without uploading it', async () => {
    await page.uploadPhoto(offer(), photo('image/png', 2 * 1024 * 1024 + 1));
    fixture.detectChanges();

    expect(uploader.upload).not.toHaveBeenCalled();
    expect(host().querySelector('[data-testid="photo-error"]')?.textContent).toContain('2 MB');
  });

  it('shows the message of Catalog when the upload fails', async () => {
    uploader.upload.and.rejectWith(new ApiError('INVALID_IMAGE', 'El archivo no es una imagen válida.'));

    await page.uploadPhoto(offer(), photo());
    fixture.detectChanges();

    expect(host().querySelector('[data-testid="photo-error"]')?.textContent).toContain('El archivo no es una imagen válida.');
    expect(offer().get('imageUrl')?.value).toBe('');
    expect(host().querySelector('[data-testid="offer-photo"]')).toBeNull();
  });

  it('removes the photo and brings back the link field', async () => {
    uploader.upload.and.resolveTo({ imageId: '7f1c', url: PHOTO_URL });
    await page.uploadPhoto(offer(), photo());
    fixture.detectChanges();

    (host().querySelector('[data-testid="remove-photo"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(offer().get('imageUrl')?.value).toBe('');
    expect(host().querySelector('[data-testid="offer-photo"]')).toBeNull();
    expect(host().querySelector('[data-testid="offer-image-url"]')).not.toBeNull();
    expect(host().querySelector('[data-testid="upload-photo"]')).not.toBeNull();
  });

  it('fills the store with the profile address and the point of the last campaign', async () => {
    verification.profile = () => Promise.resolve({ address: 'Av. Larco 345, Miraflores' });
    myCampaigns.lastStorePoint = () => Promise.resolve({ latitude: -12.1211, longitude: -77.0297 });
    fixture = TestBed.createComponent(CreateCampaignPage);
    internals = fixture.componentInstance as unknown as PageInternals;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(internals.form.controls.address.value).toBe('Av. Larco 345, Miraflores');
    expect((fixture.componentInstance as unknown as { storePoint: () => unknown }).storePoint()).toEqual({ latitude: -12.1211, longitude: -77.0297 });
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('geo-location-picker').length).toBe(1);
  });
});
