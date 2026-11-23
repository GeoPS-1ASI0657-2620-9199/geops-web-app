import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import {
  OFFER_IMAGE_MAX_SOURCE_BYTES,
  OfferImageViolation,
  UploadedOfferImage,
  offerImageViolation,
} from '../domain/model/offer-image';
import { ImageCompressor } from '../domain/ports/image-compressor';
import { OfferImageUploader } from '../domain/ports/offer-image.uploader';

const MESSAGES: Record<OfferImageViolation, string> = {
  INVALID_IMAGE: 'La foto debe ser JPG, PNG o WebP.',
  IMAGE_TOO_LARGE: 'La foto pesa más de 2 MB. Elige una más liviana.',
};
const SOURCE_TOO_LARGE = 'La foto pesa más de 20 MB. Elige una más liviana.';

/**
 * Uploads the photo of an offer (replaces pasting a link). The browser makes it lighter first, so
 * a phone photo of several MB fits the 2 MB Catalog accepts and the cards load faster.
 */
@Injectable({ providedIn: 'root' })
export class UploadOfferImageUseCase {
  private readonly compressor = inject(ImageCompressor);
  private readonly uploader = inject(OfferImageUploader);

  async execute(file: File): Promise<UploadedOfferImage> {
    const chosen = offerImageViolation(file, OFFER_IMAGE_MAX_SOURCE_BYTES);
    if (chosen) {
      throw new ApiError(chosen, chosen === 'IMAGE_TOO_LARGE' ? SOURCE_TOO_LARGE : MESSAGES[chosen]);
    }
    const lighter = await this.compressor.compress(file);
    const violation = offerImageViolation(lighter);
    if (violation) {
      throw new ApiError(violation, MESSAGES[violation]);
    }
    return this.uploader.upload(lighter);
  }
}
