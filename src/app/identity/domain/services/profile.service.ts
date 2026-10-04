import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../../infrastructure/auth/auth.service';
import { DetailsConsumerService } from '../../infrastructure/users/details-consumer.service';
import { DetailsOwnerService } from '../../infrastructure/users/details-owner.service';
import { CreateDetailsConsumerResource } from '../../infrastructure/users/details-consumer-response';
import { CreateDetailsOwnerResource } from '../../infrastructure/users/details-owner-response';
import { DetailsConsumer } from '../model/details-consumer.entity';
import { DetailsOwner } from '../model/details-owner.entity';

@Injectable({
  providedIn: 'root'
})
/**
 * Service for managing user profile operations.
 * Provides high-level operations for managing consumer and owner profiles.
 */
export class ProfileService {
  constructor(
    private authService: AuthService,
    private consumerDetailsService: DetailsConsumerService,
    private ownerDetailsService: DetailsOwnerService
  ) {}

  /**
   * Gets consumer details for the current authenticated user.
   * @returns Observable with DetailsConsumer or null if not found
   */
  getCurrentUserConsumerDetails(): Observable<DetailsConsumer | null> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return this.consumerDetailsService.getByUserId(userId);
  }

  /**
   * Gets owner details for the current authenticated user.
   * @returns Observable with DetailsOwner or null if not found
   */
  getCurrentUserOwnerDetails(): Observable<DetailsOwner | null> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return this.ownerDetailsService.getByUserId(userId);
  }

  /**
   * Creates or updates consumer details for the current authenticated user.
   * @param details The consumer details to create or update
   * @returns Observable with the created or updated DetailsConsumer
   */
  saveConsumerDetails(details: CreateDetailsConsumerResource): Observable<DetailsConsumer> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return this.consumerDetailsService.createOrUpdate(userId, details);
  }

  /**
   * Creates or updates owner details for the current authenticated user.
   * @param details The owner details to create or update
   * @returns Observable with the created or updated DetailsOwner
   */
  saveOwnerDetails(details: CreateDetailsOwnerResource): Observable<DetailsOwner> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return this.ownerDetailsService.createOrUpdate(userId, details);
  }

  /**
   * Updates consumer profile details.
   * Ensures details exist before updating.
   * @param details The consumer details to update
   * @returns Observable with the updated DetailsConsumer
   */
  updateConsumerDetails(details: CreateDetailsConsumerResource): Observable<DetailsConsumer> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return this.consumerDetailsService.update(userId, details);
  }

  /**
   * Updates owner profile details.
   * Ensures details exist before updating.
   * @param details The owner details to update
   * @returns Observable with the updated DetailsOwner
   */
  updateOwnerDetails(details: CreateDetailsOwnerResource): Observable<DetailsOwner> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return this.ownerDetailsService.update(userId, details);
  }

  /**
   * Creates consumer details for the current user.
   * This will fail if details already exist (400 error from backend).
   * Use saveConsumerDetails() for create-or-update logic.
   * @param details The consumer details to create
   * @returns Observable with the created DetailsConsumer
   */
  createConsumerDetails(details: CreateDetailsConsumerResource): Observable<DetailsConsumer> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return this.consumerDetailsService.create(userId, details);
  }

  /**
   * Creates owner details for the current user.
   * This will fail if details already exist (400 error from backend).
   * Use saveOwnerDetails() for create-or-update logic.
   * @param details The owner details to create
   * @returns Observable with the created DetailsOwner
   */
  createOwnerDetails(details: CreateDetailsOwnerResource): Observable<DetailsOwner> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return this.ownerDetailsService.create(userId, details);
  }
}

