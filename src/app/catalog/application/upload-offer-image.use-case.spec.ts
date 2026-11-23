import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../shared/domain/api-error';
import { OFFER_IMAGE_MAX_BYTES, OFFER_IMAGE_MAX_SOURCE_BYTES } from '../domain/model/offer-image';
import { ImageCompressor } from '../domain/ports/image-compressor';
import { OfferImageUploader } from '../domain/ports/offer-image.uploader';
import { UploadOfferImageUseCase } from './upload-offer-image.use-case';

const photo = (type: string, size = 1024) => new File([new Uint8Array(size)], 'menu', { type });

describe('UploadOfferImageUseCase', () => {
  let uploader: jasmine.SpyObj<OfferImageUploader>;
  let compressor: jasmine.SpyObj<ImageCompressor>;
  let useCase: UploadOfferImageUseCase;

  beforeEach(() => {
    uploader = jasmine.createSpyObj<OfferImageUploader>('OfferImageUploader', ['upload']);
    uploader.upload.and.resolveTo({ imageId: '7f1c', url: 'http://gateway.test/api/v1/offers/images/7f1c' });
    compressor = jasmine.createSpyObj<ImageCompressor>('ImageCompressor', ['compress']);
    compressor.compress.and.callFake((file: File) => Promise.resolve(file));
    TestBed.configureTestingModule({
      providers: [
        { provide: OfferImageUploader, useValue: uploader },
        { provide: ImageCompressor, useValue: compressor },
      ],
    });
    useCase = TestBed.inject(UploadOfferImageUseCase);
  });

  it('uploads a JPEG, PNG or WebP of up to 2 MB', async () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      await useCase.execute(photo(type, OFFER_IMAGE_MAX_BYTES));
    }

    expect(uploader.upload).toHaveBeenCalledTimes(3);
  });

  it('uploads the lighter photo, not the one chosen', async () => {
    const heavy = photo('image/jpeg', 6 * 1024 * 1024);
    const light = photo('image/webp', 200 * 1024);
    compressor.compress.and.resolveTo(light);

    await useCase.execute(heavy);

    expect(compressor.compress).toHaveBeenCalledWith(heavy);
    expect(uploader.upload).toHaveBeenCalledWith(light);
  });

  it('rejects another type with INVALID_IMAGE before compressing', async () => {
    await expectAsync(useCase.execute(photo('image/gif'))).toBeRejectedWith(
      new ApiError('INVALID_IMAGE', 'La foto debe ser JPG, PNG o WebP.'),
    );
    expect(compressor.compress).not.toHaveBeenCalled();
    expect(uploader.upload).not.toHaveBeenCalled();
  });

  it('rejects a chosen photo over 20 MB before compressing', async () => {
    await expectAsync(useCase.execute(photo('image/jpeg', OFFER_IMAGE_MAX_SOURCE_BYTES + 1))).toBeRejectedWith(
      new ApiError('IMAGE_TOO_LARGE', 'La foto pesa más de 20 MB. Elige una más liviana.'),
    );
    expect(compressor.compress).not.toHaveBeenCalled();
  });

  it('rejects with IMAGE_TOO_LARGE when even the lighter photo passes 2 MB', async () => {
    await expectAsync(useCase.execute(photo('image/png', OFFER_IMAGE_MAX_BYTES + 1))).toBeRejectedWith(
      new ApiError('IMAGE_TOO_LARGE', 'La foto pesa más de 2 MB. Elige una más liviana.'),
    );
    expect(uploader.upload).not.toHaveBeenCalled();
  });
});
