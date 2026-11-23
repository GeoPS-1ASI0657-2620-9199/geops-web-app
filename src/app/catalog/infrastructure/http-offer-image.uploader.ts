import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { UploadedOfferImage } from '../domain/model/offer-image';
import { OfferImageUploader } from '../domain/ports/offer-image.uploader';

/** Multipart field catalog-service reads. */
const FILE_FIELD = 'file';

/** Body of the 201 answer of POST /api/v1/campaigns/images. */
export interface UploadedOfferImageResponse {
  imageId: string;
  /** Path on the gateway, e.g. /api/v1/offers/images/{imageId}. */
  path: string;
}

/**
 * OfferImageUploader over the gateway. The body is FormData, so the browser writes the multipart
 * Content-Type with its boundary; the interceptor only adds the token.
 */
@Injectable()
export class HttpOfferImageUploader implements OfferImageUploader {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async upload(file: File): Promise<UploadedOfferImage> {
    const body = new FormData();
    body.append(FILE_FIELD, file, file.name);
    try {
      const response = await firstValueFrom(
        this.http.post<UploadedOfferImageResponse>(`${this.baseUrl}/campaigns/images`, body),
      );
      return { imageId: response.imageId, url: new URL(response.path, this.baseUrl).href };
    } catch (error) {
      throw toApiError(error);
    }
  }
}
