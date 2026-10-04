import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Represents the consumer-specific details associated with a user.
 * This entity manages consumer preferences such as favorite categories,
 * notification settings, location permissions, and saved addresses.
 */
export interface DetailsConsumer extends BaseEntity {
  id: number;
  userId: number;
  categoriasFavoritas?: string;
  recibirNotificaciones: boolean;
  permisoUbicacion: boolean;
  direccionCasa?: string;
  direccionTrabajo?: string;
  direccionUniversidad?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

