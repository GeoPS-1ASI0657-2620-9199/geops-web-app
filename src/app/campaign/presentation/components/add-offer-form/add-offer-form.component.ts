import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CampaignOffer } from '../../../domain/model/offer.entity';

/**
 * AddOfferFormComponent
 *
 * Form component for adding or editing campaign offers.
 * Can be used in dialog or inline in edit campaign view.
 */
@Component({
  selector: 'app-add-offer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './add-offer-form.component.html',
  styleUrls: ['./add-offer-form.component.css']
})
export class AddOfferFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly categoryOptions: string[] = [
    'Entretenimiento',
    'Belleza',
    'Gastronomía',
    'Gift Card',
    'Educación',
    'Salud',
    'Tecnología',
    'Moda',
    'Hogar',
    'Deportes',
    'Viajes',
    'Automotriz',
    'Servicios',
    'Otros'
  ];

  @Input() campaignId!: number;
  @Input() offer?: CampaignOffer; // If editing existing offer
  @Input() showActions: boolean = true;

  @Output() saveOffer = new EventEmitter<Partial<CampaignOffer>>();
  @Output() cancel = new EventEmitter<void>();

  offerForm: FormGroup;
  isEditMode: boolean = false;

  constructor() {
    this.offerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      partner: ['', [Validators.required, Validators.minLength(3)]],
      price: [0, [Validators.required, Validators.min(0)]],
      originalPrice: [0, Validators.min(0)],
      description: [''],
      category: ['', Validators.required],
      location: ['', Validators.required],
      latitude: [null],
      longitude: [null],
      imageUrl: [''],
      validUntil: [null, Validators.required],
      codePrefix: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]]
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.offer;

    if (this.offer) {
      this.populateForm(this.offer);
    }
  }

  populateForm(offer: CampaignOffer): void {
    this.offerForm.patchValue({
      title: offer.title,
      partner: offer.partner,
      price: offer.price,
      originalPrice: offer.originalPrice,
      description: offer.description,
      category: offer.category,
      location: offer.location,
      latitude: offer.latitude,
      longitude: offer.longitude,
      imageUrl: offer.imageUrl,
      validUntil: offer.validUntil ? new Date(offer.validUntil) : null,
      codePrefix: offer.codePrefix
    });
  }

  onSubmit(): void {
    if (this.offerForm.valid) {
      const formValue = this.offerForm.value;
      const normalizedValidUntil = this.normalizeDateInput(formValue.validUntil);
      const offerData: Partial<CampaignOffer> = {
        ...formValue,
        category: formValue.category?.trim(),
        location: formValue.location?.trim(),
        validUntil: normalizedValidUntil || undefined,
        campaignId: this.campaignId
      };

      if (this.isEditMode && this.offer) {
        offerData.id = this.offer.id;
      }

      this.saveOffer.emit(offerData);

      if (!this.isEditMode) {
        this.resetForm();
      }
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }

  private normalizeDateInput(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  }

  private resetForm(): void {
    this.offerForm.reset({
      title: '',
      partner: '',
      price: 0,
      originalPrice: 0,
      description: '',
      category: '',
      location: '',
      latitude: null,
      longitude: null,
      imageUrl: '',
      validUntil: null,
      codePrefix: ''
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.offerForm.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return this.translate.instant('campaign.addOfferForm.errors.required');
    }
    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return this.translate.instant('campaign.addOfferForm.errors.minLength', { value: minLength });
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return this.translate.instant('campaign.addOfferForm.errors.maxLength', { value: maxLength });
    }
    if (control.hasError('min')) {
      return this.translate.instant('campaign.addOfferForm.errors.minValue');
    }

    return '';
  }
}
