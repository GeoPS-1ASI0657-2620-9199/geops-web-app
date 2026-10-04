import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

/**
 * RegisterComponent handles user registration.
 * Manages form state, validation, and navigation after registration.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule, TranslateModule, LanguageSwitcher,
    MatButtonToggleModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  /** Model for registration form fields */
  model: any = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CONSUMER',
    plan: 'BASIC',
    business: {}
  };
  /** Indicates if registration is in progress */
  registering = false;
  /** Stores error messages for display */
  errorMessage = '';

  /**
   * Initializes RegisterComponent with AuthService and Router.
   * @param authService Service for user registration
   * @param router Angular Router for navigation
   */
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Validates email format
   * @param email Email to validate
   * @returns true if email is valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validates phone format (simplificado)
   * @param phone Phone to validate
   * @returns true if phone is valid, false otherwise
   */
  private isValidPhone(phone: string): boolean {
    const regex = /^[0-9]{7,15}$/;
    return regex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Handles registration form submission.
   * For OWNER: saves data to localStorage and navigates to register-bussines
   * For CONSUMER: creates user immediately and navigates to home
   */
  onSubmit() {
    // Validación de campos vacíos
    if (!this.model.name || !this.model.email || !this.model.password || !this.model.phone) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      this.registering = false;
      return;
    }

    // Validación de formato de email
    if (!this.isValidEmail(this.model.email)) {
      this.errorMessage = 'Email inválido. Por favor verifica el formato';
      this.registering = false;
      return;
    }

    // Validación de formato de teléfono
    if (!this.isValidPhone(this.model.phone)) {
      this.errorMessage = 'Teléfono inválido. Debe tener entre 7 y 15 dígitos';
      this.registering = false;
      return;
    }

    // Validación de contraseña (mínimo 6 caracteres)
    if (this.model.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener mínimo 6 caracteres';
      this.registering = false;
      return;
    }

    this.registering = true;
    this.errorMessage = '';

    // Para OWNER: guardar datos en localStorage sin crear el usuario aún
    if (this.model.role === 'OWNER') {
      const ownerData = {
        name: this.model.name,
        email: this.model.email,
        phone: this.model.phone,
        password: this.model.password,
        role: this.model.role,
        plan: this.model.plan
      };

      localStorage.setItem('register-owner-data', JSON.stringify(ownerData));

      this.router.navigate(['/register-bussines']);
      this.registering = false;
      return;
    }

    // Para CONSUMER: crear el usuario inmediatamente
    const payload = {
      name: this.model.name,
      email: this.model.email,
      phone: this.model.phone,
      password: this.model.password,
      role: 'CONSUMER',
      plan: 'BASIC'
    };

    this.authService.register(payload).subscribe({
      next: (user: any) => {
        this.router.navigate(['/home']);
        this.registering = false;
      },
      error: (err: any) => {
        console.error('[Register] ❌ Error al registrar:', err);

        // Mensajes específicos según el código de error
        if (err?.status === 409) {
          this.errorMessage = 'El email o teléfono ya están registrados. Usa otros diferentes.';
        } else if (err?.status === 400) {
          this.errorMessage = 'Datos inválidos. Por favor verifica todos los campos.';
        } else if (err?.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. ¿Está ejecutándose el backend?';
        } else {
          this.errorMessage = 'Error al registrarse. Intenta nuevamente.';
        }

        this.registering = false;
      }
    });
  }
}
