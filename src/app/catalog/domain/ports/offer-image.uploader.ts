import { UploadedOfferImage } from '../model/offer-image';

/** Port to the photo store of Catalog. The business comes from the token the interceptor adds. */
export abstract class OfferImageUploader {
  abstract upload(file: File): Promise<UploadedOfferImage>;
}
