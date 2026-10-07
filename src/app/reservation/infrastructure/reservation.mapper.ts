import { PlacedReservation, Reservation, ReservationStatus } from '../domain/model/reservation';

/** Body of POST /api/v1/reservations. */
export interface CreateReservationRequest {
  offerId: number;
}

/** Body of the 201 and 200 answers of POST /api/v1/reservations (CreatedReservationResponse). */
export interface CreatedReservationResponse {
  reservationId: number;
  code: string;
  expiresAt: string;
}

/** Body of GET /api/v1/reservations/{id} and of each item of GET /api/v1/reservations. */
export interface ReservationResponse {
  reservationId: number;
  code: string;
  consumerId: number;
  offerId: number;
  businessId: number;
  offerTitle: string;
  status: ReservationStatus;
  reservedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
}

export function toPlacedReservation(response: CreatedReservationResponse, isNew: boolean): PlacedReservation {
  return {
    reservationId: response.reservationId,
    code: response.code,
    expiresAt: response.expiresAt,
    isNew,
  };
}

export function toReservation(response: ReservationResponse): Reservation {
  return {
    reservationId: response.reservationId,
    code: response.code,
    consumerId: response.consumerId,
    offerId: response.offerId,
    businessId: response.businessId,
    offerTitle: response.offerTitle,
    status: response.status,
    reservedAt: response.reservedAt,
    expiresAt: response.expiresAt,
    redeemedAt: response.redeemedAt ?? null,
  };
}
