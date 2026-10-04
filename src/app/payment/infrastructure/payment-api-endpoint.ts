import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Payment } from '../domain/model/payment.entity';
import { PaymentResource, PaymentResponse } from './payment-response';
import { PaymentAssembler } from './payment-assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentApiEndpoint extends BaseApiEndpoint<Payment, PaymentResource, PaymentResponse, PaymentAssembler> {
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}${environment.platformProviderPaymentEndpointPath}`, new PaymentAssembler());
  }

  /**
   * Complete a payment (triggers notification creation in backend)
   * @param paymentId - The payment ID to complete
   * @returns Observable of the completed payment
   */
  completePayment(paymentId: number): Observable<Payment> {
    const url = `${this.endpointUrl}/${paymentId}/complete`;
    return this.http
      .put<PaymentResource>(url, {})
      .pipe(map(resource => this.assembler.toEntityFromResource(resource)));
  }
}
