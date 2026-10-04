import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DetailsOwner } from '../../domain/model/details-owner.entity';
import {
  DetailsOwnerResource,
  CreateDetailsOwnerResource
} from './details-owner-response';
import { DetailsOwnerAssembler } from './details-owner-assembler';

@Injectable({ providedIn: 'root' })
/**
 * API endpoint service for owner details operations.
 * Handles HTTP requests for owner-specific profile details.
 */
export class DetailsOwnerApiEndpoint {
  private readonly baseUrl: string;
  private readonly assembler: DetailsOwnerAssembler;

  /**
   * Initializes the DetailsOwnerApiEndpoint.
   * @param http Angular HttpClient for HTTP requests
   */
  constructor(private http: HttpClient) {
    this.baseUrl = `${environment.platformProviderApiBaseUrl}/users`;
    this.assembler = new DetailsOwnerAssembler();
  }

  /**
   * Gets owner details by user ID.
   * @param userId The user ID
   * @returns Observable with DetailsOwner entity
   */
  getByUserId(userId: number): Observable<DetailsOwner | null> {
    return this.http
      .get<DetailsOwnerResource>(`${this.baseUrl}/${userId}/owner-details`)
      .pipe(
        map(resource => this.assembler.toEntityFromResource(resource))
      );
  }

  /**
   * Creates owner details for a user.
   * @param userId The user ID
   * @param details The owner details to create
   * @returns Observable with the created DetailsOwner entity
   */
  create(userId: number, details: CreateDetailsOwnerResource): Observable<DetailsOwner> {
    return this.http
      .post<DetailsOwnerResource>(`${this.baseUrl}/${userId}/owner-details`, details)
      .pipe(
        map(resource => this.assembler.toEntityFromResource(resource))
      );
  }

  /**
   * Updates owner details for a user.
   * @param userId The user ID
   * @param details The owner details to update
   * @returns Observable with the updated DetailsOwner entity
   */
  update(userId: number, details: CreateDetailsOwnerResource): Observable<DetailsOwner> {
    return this.http
      .put<DetailsOwnerResource>(`${this.baseUrl}/${userId}/owner-details`, details)
      .pipe(
        map(resource => this.assembler.toEntityFromResource(resource))
      );
  }
}

