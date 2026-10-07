import { Injectable } from '@angular/core';
import { LimaDistrict } from '../domain/model/lima-district';
import { DistrictDirectory } from '../domain/ports/district.directory';
import { LIMA_DISTRICTS } from './lima-districts.data';

/** DistrictDirectory over the fixed table of Lima districts. */
@Injectable()
export class StaticDistrictDirectory implements DistrictDirectory {
  all(): readonly LimaDistrict[] {
    return LIMA_DISTRICTS;
  }
}
