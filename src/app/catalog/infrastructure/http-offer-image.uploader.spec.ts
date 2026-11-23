import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpOfferImageUploader } from './http-offer-image.uploader';

const BASE_URL = 'http://gateway.test/api/v1';
const PHOTO = new File([new Uint8Array(16)], 'menu.jpg', { type: 'image/jpeg' });

describe('HttpOfferImageUploader', () => {
  let uploader: HttpOfferImageUploader;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpOfferImageUploader,
      ],
    });
    uploader = TestBed.inject(HttpOfferImageUploader);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the photo as the multipart field file and answers its absolute address', async () => {
    const result = uploader.upload(PHOTO);

    const request = http.expectOne(`${BASE_URL}/campaigns/images`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    expect((request.request.body as FormData).get('file')).toEqual(jasmine.any(File));
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    request.flush(
      { imageId: '7f1c', path: '/api/v1/offers/images/7f1c' },
      { status: 201, statusText: 'Created' },
    );

    expect(await result).toEqual({ imageId: '7f1c', url: 'http://gateway.test/api/v1/offers/images/7f1c' });
  });

  it('rejects with the code and message of Catalog', async () => {
    const result = uploader.upload(PHOTO);

    http.expectOne(`${BASE_URL}/campaigns/images`).flush(
      { code: 'IMAGE_TOO_LARGE', message: 'La imagen supera los 2 MB.' },
      { status: 413, statusText: 'Payload Too Large' },
    );

    await expectAsync(result).toBeRejectedWith(new ApiError('IMAGE_TOO_LARGE', 'La imagen supera los 2 MB.'));
  });
});
