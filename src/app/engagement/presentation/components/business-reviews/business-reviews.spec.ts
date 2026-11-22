import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Review } from '../../../domain/model/review';
import { ReviewRepository } from '../../../domain/ports/review.repository';
import { BusinessReviews } from './business-reviews';

const REVIEW: Review = {
  reviewId: 3,
  businessId: 84,
  authorName: 'Lucía F.',
  rating: 5,
  text: 'Respetaron el precio.',
  verifiedRedemption: true,
  createdAt: '2026-10-08T13:05:00Z',
  reply: null,
};

describe('BusinessReviews', () => {
  let repository: jasmine.SpyObj<ReviewRepository>;

  beforeEach(() => {
    repository = jasmine.createSpyObj('ReviewRepository', ['findByBusiness', 'reply']);
    TestBed.configureTestingModule({ providers: [provideTranslateService(), { provide: ReviewRepository, useValue: repository }] });
  });

  async function render(reviews: Review[]): Promise<HTMLElement> {
    repository.findByBusiness.and.resolveTo(reviews);
    const fixture = TestBed.createComponent(BusinessReviews);
    fixture.componentRef.setInput('businessId', 84);
    fixture.componentRef.setInput('canReply', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the name of the author and its initial in the avatar', async () => {
    const element = await render([REVIEW]);

    expect(element.querySelector('.author')?.textContent?.trim()).toBe('Lucía F.');
    expect(element.querySelector('.avatar')?.textContent?.trim()).toBe('L');
    expect(element.querySelector('.avatar mat-icon')).toBeNull();
    expect(element.querySelector('.when')?.textContent?.trim()).toBe('08/10/2026');
  });

  it('falls back to "Cliente" and the generic avatar when the review has no name', async () => {
    const element = await render([{ ...REVIEW, authorName: null }]);

    expect(element.querySelector('.author')?.textContent?.trim()).toBe('reviewsPage.anonymousAuthor');
    expect(element.querySelector('.avatar mat-icon')?.textContent?.trim()).toBe('person');
  });
});
