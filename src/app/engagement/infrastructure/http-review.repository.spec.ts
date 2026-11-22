import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { HttpReviewRepository } from './http-review.repository';

const BASE_URL = 'http://gateway.test/api/v1';
const REVIEW = {
  reviewId: 3,
  businessId: 84,
  authorName: 'Lucía F.',
  rating: 5,
  text: 'Respetaron el precio.',
  verifiedRedemption: true,
  createdAt: '2026-10-08T13:05:00Z',
  reply: null,
};

describe('HttpReviewRepository', () => {
  let repository: HttpReviewRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE_URL }, HttpReviewRepository],
    });
    repository = TestBed.inject(HttpReviewRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('keeps the name of the author of each review', async () => {
    const result = repository.findByBusiness(84);
    http.expectOne({ method: 'GET', url: `${BASE_URL}/reviews?businessId=84` }).flush([REVIEW]);
    expect(await result).toEqual([REVIEW]);
  });

  it('leaves the name empty when the response does not bring it', async () => {
    const { authorName, ...withoutName } = REVIEW;
    const result = repository.findByBusiness(84);
    http.expectOne(`${BASE_URL}/reviews?businessId=84`).flush([withoutName]);
    expect((await result)[0].authorName).toBeNull();
    expect(authorName).toBe('Lucía F.');
  });
});
