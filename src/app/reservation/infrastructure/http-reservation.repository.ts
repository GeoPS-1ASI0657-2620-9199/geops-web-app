import { HttpClient, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { PlacedReservation, Reservation, ReservationStatus } from '../domain/model/reservation';
import { ReservationRepository } from '../domain/ports/reservation.repository';
import {
  CreateReservationRequest,
  CreatedReservationResponse,
  ReservationResponse,
  toPlacedReservation,
  toReservation,
} from './reservation.mapper';

/** ReservationRepository over the gateway route of reservation-service; the interceptor adds the token. */
@Injectable()
export class HttpReservationRepository implements ReservationRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/reservations`;

  async reserve(offerId: number): Promise<PlacedReservation> {
    const body: CreateReservationRequest = { offerId };
    try {
      const response = await firstValueFrom(
        this.http.post<CreatedReservationResponse>(this.url, body, { observe: 'response' }),
      );
      return toPlacedReservation(response.body!, response.status === HttpStatusCode.Created);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async findById(reservationId: number): Promise<Reservation> {
    try {
      const response = await firstValueFrom(
        this.http.get<ReservationResponse>(`${this.url}/${reservationId}`),
      );
      return toReservation(response);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async findMine(status: ReservationStatus | null): Promise<Reservation[]> {
    const params = status ? new HttpParams().set('status', status) : new HttpParams();
    try {
      const response = await firstValueFrom(this.http.get<ReservationResponse[]>(this.url, { params }));
      return response.map(toReservation);
    } catch (error) {
      throw toApiError(error);
    }
  }
}
