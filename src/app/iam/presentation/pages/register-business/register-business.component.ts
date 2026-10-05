import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoPoint } from '../../../../shared/domain/geo-point';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoLocationPicker } from '../../../../shared/ui/geo-location-picker/geo-location-picker';
import { GeoSteps } from '../../../../shared/ui/geo-steps/geo-steps';
import { GeoTopBar } from '../../../../core/layout/geo-top-bar/geo-top-bar';
import {
  INVALID_LOCATION,
  RegisterBusinessUseCase,
} from '../../../application/register-business.use-case';
import {
  ADDRESS_MAX_LENGTH,
  BUSINESS_NAME_MAX_LENGTH,
  BUSINESS_TYPE_MAX_LENGTH,
  OPENING_HOURS_MAX_LENGTH,
  RUC_PATTERN,
} from '../../../domain/model/register-business';
import {
  EMAIL_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_PATTERN,
} from '../../../domain/model/register-consumer';

const STEP_BUSINESS = 0;
const STEP_LOCATION = 1;

type RejectableField = 'email' | 'phone' | 'ruc' | 'address';

/** Errors that belong to a field of the first step: the wizard goes back and marks it. */
const FIELD_BY_CODE: Record<string, Exclude<RejectableField, 'address'>> = {
  EMAIL_ALREADY_REGISTERED: 'email',
  PHONE_ALREADY_REGISTERED: 'phone',
  RUC_ALREADY_REGISTERED: 'ruc',
  INVALID_RUC: 'ruc',
};

interface WizardAlert {
  kind: 'success' | 'error';
  titleKey: string;
  descriptionKey?: string;
  description?: string;
}

/**
 * Business owner registration (US22, Figma screens 18, 20 and 21). Two steps in the Sprint 1:
 * account and business, then the location; one request at the end, nothing kept in storage.
 * The SUNAT check (US38) and the baseline (US45) join with their stories.
 */
@Component({
  selector: 'app-register-business',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslateModule,
    GeoAlert,
    GeoLocationPicker,
    GeoSteps,
    GeoTopBar,
  ],
  templateUrl: './register-business.component.html',
  styleUrl: './register-business.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterBusinessComponent {
  private readonly registerBusiness = inject(RegisterBusinessUseCase);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly stepBusiness = STEP_BUSINESS;
  protected readonly stepLocation = STEP_LOCATION;
  protected readonly stepLabelKeys = ['registerBusinessPage.steps.business', 'registerBusinessPage.steps.location'];
  protected readonly passwordLimits = { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH };

  protected readonly step = signal(STEP_BUSINESS);
  protected readonly location = signal<GeoPoint | null>(null);
  protected readonly alert = signal<WizardAlert | null>(null);
  protected readonly submitting = signal(false);
  protected readonly showPassword = signal(false);
  /**
   * Field the server rejected. Kept in a signal and read by a validator, because Angular revalidates
   * the controls when a step is drawn again and errors set by hand would be lost.
   */
  private readonly rejected = signal<RejectableField | null>(null);

  protected readonly business = this.fb.group({
    businessName: ['', [Validators.required, Validators.maxLength(BUSINESS_NAME_MAX_LENGTH)]],
    businessType: ['', Validators.maxLength(BUSINESS_TYPE_MAX_LENGTH)],
    ruc: ['', [Validators.required, Validators.pattern(RUC_PATTERN), this.rejectedBy('ruc')]],
    fullName: ['', [Validators.required, Validators.maxLength(FULL_NAME_MAX_LENGTH)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN), this.rejectedBy('phone')]],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(EMAIL_MAX_LENGTH), this.rejectedBy('email')],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), Validators.maxLength(PASSWORD_MAX_LENGTH)],
    ],
  });

  protected readonly place = this.fb.group({
    address: ['', [Validators.required, Validators.maxLength(ADDRESS_MAX_LENGTH), this.rejectedBy('address')]],
    openingHours: ['', Validators.maxLength(OPENING_HOURS_MAX_LENGTH)],
  });

  constructor() {
    // Once the owner edits the rejected field, the server error no longer applies.
    const destroyRef = inject(DestroyRef);
    this.business.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.clearRejected());
    this.place.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => this.clearRejected());
  }

  continue(): void {
    if (this.business.invalid) {
      this.business.markAllAsTouched();
      return;
    }
    this.alert.set(null);
    this.step.set(STEP_LOCATION);
  }

  back(): void {
    this.alert.set(null);
    this.step.set(STEP_BUSINESS);
  }

  onPointSelected(point: GeoPoint): void {
    this.location.set(point);
    this.clearRejected();
    this.alert.set({
      kind: 'success',
      titleKey: 'registerBusinessPage.location.marked',
      description: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`,
    });
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  async submit(): Promise<void> {
    if (this.place.invalid || this.submitting()) {
      this.place.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const account = this.business.getRawValue();
    const place = this.place.getRawValue();
    try {
      await this.registerBusiness.execute({
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        password: account.password,
        business: {
          businessName: account.businessName,
          businessType: account.businessType,
          ruc: account.ruc,
          address: place.address,
          location: this.location() as GeoPoint,
          openingHours: place.openingHours,
        },
      });
      await this.router.navigate(['/login'], { queryParams: { registered: 1 } });
    } catch (error) {
      this.showError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  private showError(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    const code = apiError?.code ?? '';
    if (code === INVALID_LOCATION) {
      // CA-22.2: an invalid location asks to correct it before creating the business. Without a
      // point on the map the address is not to blame, so only the alert shows.
      if (this.location()) {
        this.reject('address');
      }
      this.alert.set({
        kind: 'error',
        titleKey: 'registerBusinessPage.errors.location',
        description: apiError?.message,
      });
      return;
    }
    const field = FIELD_BY_CODE[code];
    if (field) {
      this.step.set(STEP_BUSINESS);
      this.reject(field);
    }
    this.alert.set({
      kind: 'error',
      titleKey: field ? `registerBusinessPage.errors.${field}` : 'registerBusinessPage.errors.generic',
      description: apiError?.message,
    });
  }

  private rejectedBy(field: RejectableField) {
    return (_control: AbstractControl): ValidationErrors | null =>
      this.rejected() === field ? { server: true } : null;
  }

  private controlOf(field: RejectableField): AbstractControl {
    return field === 'address' ? this.place.controls.address : this.business.controls[field];
  }

  private reject(field: RejectableField): void {
    this.rejected.set(field);
    const control = this.controlOf(field);
    control.updateValueAndValidity({ emitEvent: false });
    control.markAsTouched();
  }

  private clearRejected(): void {
    const field = this.rejected();
    if (!field) {
      return;
    }
    this.rejected.set(null);
    this.controlOf(field).updateValueAndValidity({ emitEvent: false });
  }
}
