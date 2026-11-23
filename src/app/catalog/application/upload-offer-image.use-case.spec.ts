import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../shared/domain/api-error';
import { OFFER_IMAGE_MAX_BYTES } from '../domain/model/offer-image';
import { OfferImageUploader } from '../domain/ports/offer-image.uploader';
import { UploadOfferImageUseCase } from './upload-offer-image.use-case';

const photo = (type: string, size = 1024) => new File([new Uint8Array(size)], 'menu', { type });

describe('UploadOfferImageUseCase', () => {
  let uploader: jasmine.SpyObj<OfferImageUploader>;
  let useCase: UploadOfferImageUseCase;

  beforeEach(() => {
    uploader = jasmine.createSpyObj<OfferImageUploader>('OfferImageUploader', ['upload']);
    TestBed.configureTestingModule({ providers: [{ provide: OfferImageUploader, useValue: uploader }] });
    useCase = TestBed.inject(UploadOfferImageUseCase);
  });

  it('uploads a JPEG, PNG or WebP of up to 2 MB', async () => {
    uploader.upload.and.resolveTo({ imageId: '7f1c', url: 'http://gateway.test/api/v1/offers/images/7f1c' });

    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      await useCase.execute(photo(type, OFFER_IMAGE_MAX_BYTES));
    }

    expect(uploader.upload).toHaveBeenCalledTimes(3);
  });

  it('rejects another type with INVALID_IMAGE before uploading', async () => {
    await expectAsync(useCase.execute(photo('image/gif'))).toBeRejectedWith(
      new ApiError('INVALID_IMAGE', 'La foto debe ser JPG, PNG o WebP.'),
    );
    expect(uploader.upload).not.toHaveBeenCalled();
  });

  it('rejects a photo over 2 MB with IMAGE_TOO_LARGE before uploading', async () => {
    await expectAsync(useCase.execute(photo('image/png', OFFER_IMAGE_MAX_BYTES + 1))).toBeRejectedWith(
      new ApiError('IMAGE_TOO_LARGE', 'La foto pesa más de 2 MB. Elige una más liviana.'),
    );
    expect(uploader.upload).not.toHaveBeenCalled();
  });
});
