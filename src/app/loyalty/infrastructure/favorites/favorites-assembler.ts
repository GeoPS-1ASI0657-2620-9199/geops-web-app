import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { FavoriteRowResource, FavoriteRowsResponse } from './favorites-response';

export type FavoriteRow = FavoriteRowResource;

export class FavoritesAssembler
  implements BaseAssembler<FavoriteRow, FavoriteRowResource, FavoriteRowsResponse>
{
  /**
   * converts a resource received from the API to a domain entity
   * @param r - resource received from the API
   */
  toEntityFromResource(r: FavoriteRowResource): FavoriteRow {
    return { ...r };
  }

  /**
   * converts a domain entity to the resource format expected by the API
   * @param e - domain entity
   */
  toResourceFromEntity(e: FavoriteRow): FavoriteRowResource {
    return { ...e };
  }

  /**
   * converts an API "wrapper" response to an array of entities
   * @param _r - API response
   */
  toEntitiesFromResponse(_r: FavoriteRowsResponse): FavoriteRow[] {
    return [];
  }
}
