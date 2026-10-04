import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Payment } from '../../../domain/model/payment.entity';
import { PaymentMethod } from '../../../domain/model/payment-method.enum';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './payment-confirmation.component.html',
  styleUrls: ['./payment-confirmation.component.css']
})
export class PaymentConfirmationComponent {
  @Input() payment!: Payment;
  @Output() closeConfirmation = new EventEmitter<void>();

  PaymentMethod = PaymentMethod;

  onClose(): void {
    this.closeConfirmation.emit();
  }

  getPaymentMethodText(): string {
    return this.payment.paymentMethod === PaymentMethod.YAPE
      ? 'payment.confirmation.yapePayment'
      : 'payment.confirmation.cardPayment';
  }
}
