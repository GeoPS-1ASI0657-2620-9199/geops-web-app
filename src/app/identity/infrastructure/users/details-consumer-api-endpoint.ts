import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DetailsConsumer } from '../../domain/model/details-consumer.entity';
import {
  DetailsConsumerResource,
  CreateDetailsConsumerResource
} from './details-consumer-response';
import { DetailsConsumerAssembler } from './details-consumer-assembler';

@Injectable({ providedIn: 'root' })
/**
 * API endpoint service for consumer details operations.
 * Handles HTTP requests for consumer-specific profile details.
 */
export class DetailsConsumerApiEndpoint {
  private readonly baseUrl: string;
  private readonly assembler: DetailsConsumerAssembler;

  /**
   * Initializes the DetailsConsumerApiEndpoint.
   * @param http Angular HttpClient for HTTP requests
   */
  constructor(private http: HttpClient) {
    this.baseUrl = `${environment.platformProviderApiBaseUrl}/users`;
    this.assembler = new DetailsConsumerAssembler();
  }

  /**
   * Gets consumer details by user ID.
   * @param userId The user ID
   * @returns Observable with DetailsConsumer entity
   */
  getByUserId(userId: number): Observable<DetailsConsumer | null> {
    return this.http
      .get<DetailsConsumerResource>(`${this.baseUrl}/${userId}/consumer-details`)
      .pipe(
        map(resource => this.assembler.toEntityFromResource(resource))
      );
  }

  /**
   * Creates consumer details for a user.
   * @param userId The user ID
   * @param details The consumer details to create
   * @returns Observable with the created DetailsConsumer entity
   */
  create(userId: number, details: CreateDetailsConsumerResource): Observable<DetailsConsumer> {
    return this.http
      .post<DetailsConsumerResource>(`${this.baseUrl}/${userId}/consumer-details`, details)
      .pipe(
        map(resource => this.assembler.toEntityFromResource(resource))
      );
  }

  /**
   * Updates consumer details for a user.
   * @param userId The user ID
   * @param details The consumer details to update
   * @returns Observable with the updated DetailsConsumer entity
   */
  update(userId: number, details: CreateDetailsConsumerResource): Observable<DetailsConsumer> {
    return this.http
      .put<DetailsConsumerResource>(`${this.baseUrl}/${userId}/consumer-details`, details)
      .pipe(
        map(resource => this.assembler.toEntityFromResource(resource))
      );
  }
}

