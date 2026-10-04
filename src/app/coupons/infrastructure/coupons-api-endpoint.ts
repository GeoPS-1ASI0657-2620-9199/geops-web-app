import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Coupon } from '../domain/model/coupon.entity';
import { CouponResource, CouponsResponse } from './coupons-response';
import { CouponsAssembler } from './coupons-assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponsApiEndpoint extends BaseApiEndpoint<Coupon, CouponResource, CouponsResponse, CouponsAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}/coupons`, new CouponsAssembler());
  }
}
