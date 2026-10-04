import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DetailsOwner } from '../../domain/model/details-owner.entity';
import { DetailsOwnerApiEndpoint } from './details-owner-api-endpoint';
import { CreateDetailsOwnerResource } from './details-owner-response';

@Injectable({
  providedIn: 'root'
})
/**
 * Service for managing owner details operations.
 * Provides high-level business logic for owner profile management.
 */
export class DetailsOwnerService {
  constructor(private detailsOwnerApi: DetailsOwnerApiEndpoint) {}

  /**
   * Gets owner details for a specific user.
   * @param userId The user ID
   * @returns Observable with DetailsOwner or null if not found
   */
  getByUserId(userId: number): Observable<DetailsOwner | null> {
    return this.detailsOwnerApi.getByUserId(userId).pipe(
      catchError(error => {
        console.error('[DetailsOwnerService] Error getting owner details:', error);
        if (error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates owner details for a user.
   * The backend prevents duplicate creation by returning 400 if details already exist.
   * @param userId The user ID
   * @param details The owner details to create
   * @returns Observable with the created DetailsOwner
   */
  create(userId: number, details: CreateDetailsOwnerResource): Observable<DetailsOwner> {
    return this.detailsOwnerApi.create(userId, details).pipe(
      catchError(error => {
        console.error('[DetailsOwnerService] Error creating owner details:', error);
        if (error.status === 400) {
          console.warn('[DetailsOwnerService] Owner details already exist for user:', userId);
        } else if (error.status === 404) {
          console.warn('[DetailsOwnerService] User not found:', userId);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Updates owner details for a user.
   * @param userId The user ID
   * @param details The owner details to update
   * @returns Observable with the updated DetailsOwner
   */
  update(userId: number, details: CreateDetailsOwnerResource): Observable<DetailsOwner> {
    return this.detailsOwnerApi.update(userId, details).pipe(
      catchError(error => {
        console.error('[DetailsOwnerService] Error updating owner details:', error);
        if (error.status === 404) {
          console.warn('[DetailsOwnerService] Owner details not found for user:', userId);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates or updates owner details for a user.
   * First tries to get existing details. If not found (404), creates new details.
   * If details exist, updates them instead.
   * This approach is more efficient with the backend's validation logic.
   * @param userId The user ID
   * @param details The owner details
   * @returns Observable with the created or updated DetailsOwner
   */
  createOrUpdate(userId: number, details: CreateDetailsOwnerResource): Observable<DetailsOwner> {
    return new Observable(subscriber => {
      // First check if details already exist
      this.getByUserId(userId).subscribe({
        next: (existingDetails) => {
          if (existingDetails) {
            // Details exist, update them
            this.update(userId, details).subscribe({
              next: (updated) => {
                subscriber.next(updated);
                subscriber.complete();
              },
              error: (updateError) => {
                subscriber.error(updateError);
              }
            });
          } else {
            // Details don't exist, create them
            this.create(userId, details).subscribe({
              next: (created) => {
                subscriber.next(created);
                subscriber.complete();
              },
              error: (createError) => {
                subscriber.error(createError);
              }
            });
          }
        },
        error: (error) => {
          // If getByUserId fails with something other than 404, propagate error
          subscriber.error(error);
        }
      });
    });
  }
}

