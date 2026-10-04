import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentApi, CreatePaymentRequest } from '../../../infrastructure/payment-api';
import { PaymentMethod } from '../../../domain/model/payment-method.enum';
import { Payment } from '../../../domain/model/payment.entity';

@Component({
  selector: 'app-checkout-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './checkout-form.component.html',
  styleUrls: ['./checkout-form.component.css']
})
export class CheckoutFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentApi = inject(PaymentApi);

  @Input() cartId = 0;
  @Input() userId = 0;
  @Input() totalAmount = 0;
  @Output() paymentCompleted = new EventEmitter<Payment>();
  @Output() backToCart = new EventEmitter<void>();

  isProcessing = signal(false);
  selectedPaymentMethod = signal<PaymentMethod | null>(null);
  PaymentMethod = PaymentMethod;

  checkoutForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: [''],
    cvv: ['']
  });

  constructor() {
    // Initialize without validators initially
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod.set(method);

    if (method === PaymentMethod.CARD) {
      this.setupCardValidators();
    } else {
      // For Yape and Plin, process payment immediately
      this.processInstantPayment(method);
    }
  }

  goBackToMethodSelection(): void {
    this.selectedPaymentMethod.set(null);
    this.checkoutForm.reset();
  }

  private setupCardValidators(): void {
    const cardNumberControl = this.checkoutForm.get('cardNumber');
    const cvvControl = this.checkoutForm.get('cvv');

    cardNumberControl?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
    cvvControl?.setValidators([Validators.required, Validators.pattern(/^\d{3}$/)]);

    cardNumberControl?.updateValueAndValidity();
    cvvControl?.updateValueAndValidity();
  }

  private processInstantPayment(method: PaymentMethod): void {
    this.isProcessing.set(true);

    const request: CreatePaymentRequest = {
      userId: this.userId,
      cartId: this.cartId,
      amount: this.totalAmount,
      paymentMethod: method,
      customerEmail: this.checkoutForm.get('email')?.value, // Use user-provided email
      customerFirstName: 'Usuario',
      customerLastName: 'Temporal'
    };

    this.paymentApi.createPayment(request).subscribe({
      next: (payment) => {
        this.isProcessing.set(false);
        this.paymentCompleted.emit(payment);
      },
      error: (error) => {
        this.isProcessing.set(false);
        console.error('Payment failed:', error);

      }
    });
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isProcessing.set(true);

    const formValue = this.checkoutForm.value;
    const request: CreatePaymentRequest = {
      userId: this.userId,
      cartId: this.cartId,
      amount: this.totalAmount,
      paymentMethod: this.selectedPaymentMethod()!,
      customerEmail: formValue.email,
      customerFirstName: formValue.firstName,
      customerLastName: formValue.lastName,
      cvv: formValue.cvv
    };

    this.paymentApi.createPayment(request).subscribe({
      next: (payment) => {
        this.isProcessing.set(false);
        this.paymentCompleted.emit(payment);
      },
      error: (error) => {
        this.isProcessing.set(false);
        console.error('Payment failed:', error);
      }
    });
  }

  onBack(): void {
    this.backToCart.emit();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.checkoutForm.controls).forEach(key => {
      this.checkoutForm.get(key)?.markAsTouched();
    });
  }

  // Helper methods for template
  getFieldError(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errors = field.errors;
    if (errors['required']) return `payment.form.errors.${fieldName}Required`;
    if (errors['email']) return 'payment.form.errors.emailInvalid';
    if (errors['minlength']) return `payment.form.errors.${fieldName}MinLength`;
    if (errors['pattern']) return `payment.form.errors.${fieldName}Pattern`;

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }
}
