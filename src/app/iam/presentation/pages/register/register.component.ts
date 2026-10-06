import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoTopBar } from '../../../../core/layout/geo-top-bar/geo-top-bar';
import { RegisterConsumerUseCase } from '../../../application/register-consumer.use-case';
import {
  EMAIL_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_PATTERN,
} from '../../../domain/model/register-consumer';

const EMAIL_TAKEN = 'EMAIL_ALREADY_REGISTERED';
const PHONE_TAKEN = 'PHONE_ALREADY_REGISTERED';
const INVALID_REQUEST = 'INVALID_REQUEST';
/** Given names and surnames share the 255 characters Identity allows for the full name. */
const NAME_PART_MAX_LENGTH = Math.floor((FULL_NAME_MAX_LENGTH - 1) / 2);

/** Error shown above the form: a fixed title by code and the detail for the user. */
interface FormAlert {
  titleKey: string;
  descriptionKey?: string;
  description?: string;
}

/** Consumer registration (US20, Figma screens 16 and 17). */
@Component({
  selector: 'app-register',
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
    GeoTopBar,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly registerConsumer = inject(RegisterConsumerUseCase);
  private readonly router = inject(Router);

  protected readonly passwordLimits = { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH };
  protected readonly submitting = signal(false);
  protected readonly alert = signal<FormAlert | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    givenNames: ['', [Validators.required, Validators.maxLength(NAME_PART_MAX_LENGTH)]],
    surnames: ['', [Validators.required, Validators.maxLength(NAME_PART_MAX_LENGTH)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(EMAIL_MAX_LENGTH)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(PASSWORD_MAX_LENGTH),
      ],
    ],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.alert.set(null);
    try {
      await this.registerConsumer.execute(this.form.getRawValue());
      await this.router.navigate(['/login'], { queryParams: { registered: 1 } });
    } catch (error) {
      this.showError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  private showError(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    switch (apiError?.code) {
      case EMAIL_TAKEN:
        this.form.controls.email.setErrors({ taken: true });
        this.form.controls.email.markAsTouched();
        this.alert.set({
          titleKey: 'registerPage.errors.emailTaken.title',
          descriptionKey: 'registerPage.errors.emailTaken.description',
        });
        break;
      case PHONE_TAKEN:
        this.form.controls.phone.setErrors({ taken: true });
        this.form.controls.phone.markAsTouched();
        this.alert.set({
          titleKey: 'registerPage.errors.phoneTaken.title',
          descriptionKey: 'registerPage.errors.phoneTaken.description',
        });
        break;
      case INVALID_REQUEST:
        this.alert.set({ titleKey: 'registerPage.errors.invalid', description: apiError.message });
        break;
      default:
        this.alert.set({ titleKey: 'registerPage.errors.generic', description: apiError?.message });
    }
  }
}
