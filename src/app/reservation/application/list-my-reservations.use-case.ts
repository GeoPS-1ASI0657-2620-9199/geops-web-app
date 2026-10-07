import { Injectable, inject } from '@angular/core';
import { Reservation, ReservationStatus } from '../domain/model/reservation';
import { ReservationRepository } from '../domain/ports/reservation.repository';

/** Reservations of the consumer in the session, newest first, optionally of one status. */
@Injectable({ providedIn: 'root' })
export class ListMyReservationsUseCase {
  private readonly reservations = inject(ReservationRepository);

  execute(status: ReservationStatus | null = null): Promise<Reservation[]> {
    return this.reservations.findMine(status);
  }
}
