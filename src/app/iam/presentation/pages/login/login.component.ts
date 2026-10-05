import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoTopBar } from '../../../../core/layout/geo-top-bar/geo-top-bar';
import { LogInUseCase } from '../../../application/log-in.use-case';
import { UserRole } from '../../../domain/model/user-role';

const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
/** Where each role lands after logging in (US21: consumer; US23: business owner). */
const HOME_BY_ROLE: Record<UserRole, string> = {
  CONSUMER: '/offers',
  BUSINESS_OWNER: '/campaigns',
  ADMIN: '/offers',
};

interface LoginAlert {
  kind: 'success' | 'info' | 'error';
  titleKey: string;
  descriptionKey?: string;
  description?: string;
}

/** Login for consumers and business owners (US21, US23, Figma screens 14 and 15). */
@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly logIn = inject(LogInUseCase);
  private readonly router = inject(Router);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly submitting = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly invalidCredentials = signal(false);
  protected readonly alert = signal<LoginAlert | null>(this.initialAlert());

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    // The "wrong credentials" mark belongs to the pair: editing either field clears it on both.
    this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
      if (!this.invalidCredentials()) {
        return;
      }
      this.invalidCredentials.set(false);
      this.form.controls.email.updateValueAndValidity({ emitEvent: false });
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.alert.set(null);
    this.invalidCredentials.set(false);
    try {
      const session = await this.logIn.execute(this.form.getRawValue());
      await this.router.navigateByUrl(this.query.get('returnUrl') ?? HOME_BY_ROLE[session.role]);
    } catch (error) {
      this.showError(error);
    } finally {
      this.submitting.set(false);
    }
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  private initialAlert(): LoginAlert | null {
    if (this.query.has('registered')) {
      return { kind: 'success', titleKey: 'loginPage.registered.title', descriptionKey: 'loginPage.registered.description' };
    }
    if (this.query.has('expired')) {
      return { kind: 'info', titleKey: 'loginPage.expired' };
    }
    return null;
  }

  private showError(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError?.code === INVALID_CREDENTIALS) {
      // US21: the access is rejected without saying which of the two was wrong.
      this.invalidCredentials.set(true);
      this.form.controls.email.setErrors({ credentials: true });
      this.form.controls.password.setErrors({ credentials: true });
      this.form.markAllAsTouched();
      this.alert.set({
        kind: 'error',
        titleKey: 'loginPage.errors.credentials.title',
        descriptionKey: 'loginPage.errors.credentials.description',
      });
      return;
    }
    this.alert.set({ kind: 'error', titleKey: 'loginPage.errors.generic', description: apiError?.message });
  }
}
