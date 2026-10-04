import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ReviewsStore } from '../../../application/reviews.store';
import { Review } from '../../../domain/model/review.entity';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';

/**
 * ReviewsListComponent
 *
 * Component for displaying and managing reviews for offers.
 * Supports creating, filtering, sorting, and deleting reviews.
 */
@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './reviews-list.component.html',
  styleUrls: ['./reviews-list.component.css'],
})
export class ReviewsListComponent implements OnInit, OnDestroy {
  readonly store = inject(ReviewsStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Local UI state signals
  sortBy = signal<'date' | 'rating' | 'likes'>('date');
  filterRating = signal<number>(0);
  showForm = signal<boolean>(false);

  // Computed signals for filtered and sorted reviews
  filteredReviews = computed(() => {
    let reviews = this.store.reviews();

    // Apply rating filter
    if (this.filterRating() > 0) {
      reviews = this.store.filterByRating(this.filterRating());
    }

    // Apply sorting
    return this.store.sortReviews(reviews, this.sortBy());
  });

  reviewForm: FormGroup;
  offerId: number | null = null;
  userId: number | null = null;

  constructor() {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      text: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    });
  }

  ngOnInit(): void {
    // Get filters from route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.offerId = params['offerId'] ? +params['offerId'] : null;
      this.loadReviews();
    });

    // Get current user
    this.userId = this.authService.getCurrentUserId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReviews(): void {
    if (this.offerId) {
      // Load reviews for specific offer
      this.store.loadReviewsByOfferId(this.offerId);
    } else {
      // Load all reviews (already filtered by user's campaigns in the API)
      this.store.loadAllReviews();
    }
  }

  onSubmitReview(): void {
    if (this.reviewForm.invalid) {
      return;
    }

    if (!this.offerId) {
      this.snackBar.open('Debe especificar una oferta para crear una reseña', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const currentUserId = this.getUserId();
    const userName = this.getUserName();

    const review: Omit<Review, 'id'> = {
      offerId: this.offerId!,
      userId: currentUserId,
      userName: userName,
      rating: this.reviewForm.value.rating,
      text: this.reviewForm.value.text,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.createReview(review);

    // Check for error after creation
    if (!this.store.error()) {
      this.snackBar.open('Reseña creada exitosamente', 'Cerrar', { duration: 3000 });
      this.reviewForm.reset({ rating: 5, text: '' });
      this.showForm.set(false);
    } else {
      this.snackBar.open('Error al crear reseña: ' + this.store.error(), 'Cerrar', { duration: 5000 });
    }
  }

  onLike(reviewId: number): void {
    // Simplified: just reload reviews after like
    this.snackBar.open('Funcionalidad de likes no disponible', 'Cerrar', { duration: 2000 });
  }

  onDelete(reviewId: number): void {
    this.snackBar.open('Funcionalidad de eliminar no disponible', 'Cerrar', { duration: 2000 });
  }

  onSortChange(): void {
    // Sorting is handled by computed signal, just update the signal
  }

  onFilterChange(): void {
    // Filtering is handled by computed signal, just update the signal
  }

  toggleForm(): void {
    this.showForm.update(current => !current);
  }

  private applyFiltersAndSort(): void {
    // No longer needed - computed signal handles this
  }

  getUserId(): number {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return userId;
  }

  getUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.name || 'Usuario';
  }

  getRatingArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStarsArray(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }

  canCreateReview(): boolean {
    return this.offerId !== null;
  }
}
