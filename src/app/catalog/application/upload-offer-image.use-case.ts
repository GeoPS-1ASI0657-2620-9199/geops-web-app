import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import { OfferImageViolation, UploadedOfferImage, offerImageViolation } from '../domain/model/offer-image';
import { OfferImageUploader } from '../domain/ports/offer-image.uploader';

const MESSAGES: Record<OfferImageViolation, string> = {
  INVALID_IMAGE: 'La foto debe ser JPG, PNG o WebP.',
  IMAGE_TOO_LARGE: 'La foto pesa más de 2 MB. Elige una más liviana.',
};

/** Uploads the photo of an offer (replaces pasting a link), checking its type and size first. */
@Injectable({ providedIn: 'root' })
export class UploadOfferImageUseCase {
  private readonly uploader = inject(OfferImageUploader);

  execute(file: File): Promise<UploadedOfferImage> {
    const violation = offerImageViolation(file);
    if (violation) {
      return Promise.reject(new ApiError(violation, MESSAGES[violation]));
    }
    return this.uploader.upload(file);
  }
}
