import { Provider } from '@angular/core';
import { ReservationRepository } from '../domain/ports/reservation.repository';
import { HttpReservationRepository } from './http-reservation.repository';

/** Adapters of the reservation context, registered once in app.config.ts. */
export const reservationProviders: Provider[] = [
  { provide: ReservationRepository, useClass: HttpReservationRepository },
];
