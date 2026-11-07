import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ReviewRepository } from '../../../domain/ports/review.repository';
import { ReviewForm } from './review-form';
describe('ReviewForm', () => {
  let repository: jasmine.SpyObj<ReviewRepository>;
  beforeEach(() => { repository = jasmine.createSpyObj('ReviewRepository', ['create']); TestBed.configureTestingModule({ providers: [provideTranslateService(), { provide: ReviewRepository, useValue: repository }] }); });
  it('validates text and posts a rating for the redeemed business', async () => {
    repository.create.and.resolveTo();
    const fixture = TestBed.createComponent(ReviewForm); fixture.componentRef.setInput('businessId', 84);
    fixture.componentInstance.form.setValue({ rating: 5, text: 'Respetaron el precio.' });
    await fixture.componentInstance.submit(); fixture.detectChanges();
    expect(repository.create).toHaveBeenCalledWith({ businessId: 84, rating: 5, text: 'Respetaron el precio.' });
    expect(fixture.nativeElement.textContent).toContain('reviewsPage.published');
  });
  it('keeps the draft on API errors and rejects blank text', async () => {
    repository.create.and.rejectWith(new Error('offline'));
    const fixture = TestBed.createComponent(ReviewForm); fixture.componentRef.setInput('businessId', 84);
    fixture.componentInstance.form.setValue({ rating: 5, text: '   ' }); await fixture.componentInstance.submit();
    expect(repository.create).not.toHaveBeenCalled();
    fixture.componentInstance.form.controls.text.setValue('Good'); await fixture.componentInstance.submit();
    expect(fixture.componentInstance.sent()).toBeFalse(); expect(fixture.componentInstance.form.controls.text.value).toBe('Good');
  });
});
