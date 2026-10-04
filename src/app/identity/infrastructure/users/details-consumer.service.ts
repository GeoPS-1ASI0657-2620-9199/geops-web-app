import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DetailsConsumer } from '../../domain/model/details-consumer.entity';
import { DetailsConsumerApiEndpoint } from './details-consumer-api-endpoint';
import { CreateDetailsConsumerResource } from './details-consumer-response';

@Injectable({
  providedIn: 'root'
})
/**
 * Service for managing consumer details operations.
 * Provides high-level business logic for consumer profile management.
 */
export class DetailsConsumerService {
  constructor(private detailsConsumerApi: DetailsConsumerApiEndpoint) {}

  /**
   * Gets consumer details for a specific user.
   * @param userId The user ID
   * @returns Observable with DetailsConsumer or null if not found
   */
  getByUserId(userId: number): Observable<DetailsConsumer | null> {
    return this.detailsConsumerApi.getByUserId(userId).pipe(
      catchError(error => {
        console.error('[DetailsConsumerService] Error getting consumer details:', error);
        if (error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates consumer details for a user.
   * The backend prevents duplicate creation by returning 400 if details already exist.
   * @param userId The user ID
   * @param details The consumer details to create
   * @returns Observable with the created DetailsConsumer
   */
  create(userId: number, details: CreateDetailsConsumerResource): Observable<DetailsConsumer> {
    return this.detailsConsumerApi.create(userId, details).pipe(
      catchError(error => {
        console.error('[DetailsConsumerService] Error creating consumer details:', error);
        if (error.status === 400) {
          console.warn('[DetailsConsumerService] Consumer details already exist for user:', userId);
        } else if (error.status === 404) {
          console.warn('[DetailsConsumerService] User not found:', userId);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Updates consumer details for a user.
   * @param userId The user ID
   * @param details The consumer details to update
   * @returns Observable with the updated DetailsConsumer
   */
  update(userId: number, details: CreateDetailsConsumerResource): Observable<DetailsConsumer> {
    return this.detailsConsumerApi.update(userId, details).pipe(
      catchError(error => {
        console.error('[DetailsConsumerService] Error updating consumer details:', error);
        if (error.status === 404) {
          console.warn('[DetailsConsumerService] Consumer details not found for user:', userId);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates or updates consumer details for a user.
   * First tries to get existing details. If not found (404), creates new details.
   * If details exist, updates them instead.
   * This approach is more efficient with the backend's validation logic.
   * @param userId The user ID
   * @param details The consumer details
   * @returns Observable with the created or updated DetailsConsumer
   */
  createOrUpdate(userId: number, details: CreateDetailsConsumerResource): Observable<DetailsConsumer> {
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

