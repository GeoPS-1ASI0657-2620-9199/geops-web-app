/** Same rules as POST /campaigns/images in catalog-service: JPEG, PNG or WebP up to 2 MB. */
export const OFFER_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
export const OFFER_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
/** A phone photo may be heavier when chosen: the browser makes it lighter before uploading. */
export const OFFER_IMAGE_MAX_SOURCE_BYTES = 20 * 1024 * 1024;

/** Same codes catalog-service answers, so the screen handles both alike. */
export type OfferImageViolation = 'INVALID_IMAGE' | 'IMAGE_TOO_LARGE';

/** A photo already stored by Catalog, with the absolute address the offer saves as imageUrl. */
export interface UploadedOfferImage {
  readonly imageId: string;
  readonly url: string;
}

/** Checked before uploading so the owner does not wait for a rejection. */
export function offerImageViolation(
  file: Pick<File, 'type' | 'size'>,
  maxBytes: number = OFFER_IMAGE_MAX_BYTES,
): OfferImageViolation | null {
  if (!OFFER_IMAGE_TYPES.includes(file.type)) {
    return 'INVALID_IMAGE';
  }
  return file.size > maxBytes ? 'IMAGE_TOO_LARGE' : null;
}
