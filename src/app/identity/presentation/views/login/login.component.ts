import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

/**
 * LoginComponent handles user authentication via email and password.
 * Displays error messages and manages loading state during login.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule, TranslateModule, LanguageSwitcher,
    MatButtonToggleModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  /** Model for login form fields */
  model: any = { email: '', password: '' };
  /** Indicates if login request is in progress */
  loading = false;
  /** Stores error messages for display */
  errorMessage = '';

  /**
   * Initializes LoginComponent with AuthService and Router.
   * @param authService Service for authentication operations
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
   * Handles login form submission.
   * Validates input, performs login, and navigates based on user role.
   */
  onSubmit() {
    // Validación de campos vacíos
    if (!this.model.email || !this.model.password) {
      this.errorMessage = 'Por favor completa email y contraseña';
      return;
    }

    // Validación de formato de email
    if (!this.isValidEmail(this.model.email)) {
      this.errorMessage = 'Email inválido. Por favor verifica el formato';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.model.email, this.model.password).subscribe({
      next: (user) => {
        if (user) {
          // Redirigir según el rol del usuario
          if (user.role === 'OWNER') {
            this.router.navigate(['/resumen']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.errorMessage = 'Email o contraseña incorrectos';
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('[Login] ❌ Error:', err);

        // Mensajes específicos según el código de error
        if (err?.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else if (err?.status === 400) {
          this.errorMessage = 'Datos inválidos. Por favor verifica email y contraseña';
        } else if (err?.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. ¿Está ejecutándose el backend?';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta nuevamente';
        }

        this.loading = false;
      }
    });
  }
}
