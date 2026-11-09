import { Provider } from '@angular/core';
import { ReservationRepository } from '../domain/ports/reservation.repository';
import { ReportRepository } from '../domain/ports/report.repository';
import { HttpReportRepository } from './http-report.repository';
import { HttpReservationRepository } from './http-reservation.repository';

/** Adapters of the reservation context, registered once in app.config.ts. */
export const reservationProviders: Provider[] = [
  { provide: ReservationRepository, useClass: HttpReservationRepository },
  { provide: ReportRepository, useClass: HttpReportRepository },
];
