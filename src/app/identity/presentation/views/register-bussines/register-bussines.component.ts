import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../infrastructure/auth/auth.service';

/**
 * RegisterBussinesComponent handles business profile registration for OWNER users.
 * Creates the user with owner role and business details after completion.
 */
@Component({
  selector: 'app-register-bussines',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LanguageSwitcher,
    MatButtonToggleModule],
  templateUrl: './register-bussines.component.html',
  styleUrls: ['./register-bussines.component.css']
})
export class RegisterBussinesComponent implements OnInit {
  /** Model for business registration form fields */
  business: any = {
    businessName: '',
    businessType: '',
    taxId: ''
  };
  /** Indicates if submission is in progress */
  submitting = false;
  /** Stores error messages for display */
  errorMessage = '';
  /** OWNER user data from localStorage */
  ownerData: any = null;

  /**
   * Initializes RegisterBussinesComponent with dependencies.
   * @param router Angular Router for navigation
   * @param http Angular HttpClient for HTTP requests
   * @param authService AuthService for user registration
   */
  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener datos del OWNER desde localStorage
    const storedData = localStorage.getItem('register-owner-data');
    if (!storedData) {
      console.error('[RegisterBussines] ❌ No hay datos de registro en localStorage');
      this.errorMessage = 'Error: Datos de registro no encontrados. Por favor vuelve a registrarte.';
      return;
    }

    try {
      this.ownerData = JSON.parse(storedData);
    } catch (e) {
      console.error('[RegisterBussines] ❌ Error al parsear datos:', e);
      this.errorMessage = 'Error: Datos inválidos. Por favor vuelve a registrarte.';
    }
  }

  /**
   * Validates business form data
   * @returns true if valid, false otherwise
   */
  private validateBusinessData(): boolean {
    if (!this.business.businessName || this.business.businessName.trim().length === 0) {
      this.errorMessage = 'El nombre del negocio es requerido';
      return false;
    }

    if (!this.business.businessType || this.business.businessType.trim().length === 0) {
      this.errorMessage = 'El tipo de negocio es requerido';
      return false;
    }

    if (!this.business.taxId || this.business.taxId.trim().length === 0) {
      this.errorMessage = 'El RUC/NIT es requerido';
      return false;
    }

    return true;
  }

  /**
   * Handles business registration form submission.
   * Creates the OWNER user with all data and business details.
   */
  onSubmit() {
    // Validar datos de negocio
    if (!this.validateBusinessData()) {
      return;
    }

    if (!this.ownerData) {
      this.errorMessage = 'Error: Datos de usuario no encontrados';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    // Paso 1: Crear el usuario OWNER con todos los datos
    const userPayload = {
      name: this.ownerData.name,
      email: this.ownerData.email,
      phone: this.ownerData.phone,
      password: this.ownerData.password,
      role: 'OWNER',
      plan: this.ownerData.plan || 'BASIC'
    };

    this.authService.register(userPayload).subscribe({
      next: (user: any) => {

        // Verificar que el backend creó el usuario con el rol correcto
        if (user.role !== 'OWNER') {
          console.error('[RegisterBussines] ⚠️ ERROR: Backend creó usuario con rol incorrecto!');
          console.error('[RegisterBussines] Esperado: OWNER, Recibido:', user.role);
          this.errorMessage = 'Error: Usuario creado con rol incorrecto. Por favor contacta soporte.';
          this.submitting = false;
          return;
        }

        // Continuar con la creación de owner-details
        this.createOwnerDetails(user.id);
      },
      error: (err: any) => {
        console.error('[RegisterBussines] ❌ Error creando usuario OWNER:', err);

        // Mensajes específicos según el código de error
        if (err?.status === 409) {
          this.errorMessage = 'El email o teléfono ya están registrados. Usa otros diferentes.';
        } else if (err?.status === 400) {
          this.errorMessage = 'Datos inválidos. Por favor verifica todos los campos.';
        } else if (err?.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. ¿Está ejecutándose el backend?';
        } else {
          this.errorMessage = 'Error al registrar usuario OWNER. Intenta nuevamente.';
        }

        this.submitting = false;
      }
    });
  }

  /**
   * Creates owner details for the user
   * @param userId The ID of the user to create details for
   */
  private createOwnerDetails(userId: number): void {

    const ownerDetailsPayload = {
      businessName: this.business.businessName,
      businessType: this.business.businessType,
      taxId: this.business.taxId,
      website: this.business.website || '',
      description: this.business.description || '',
      address: this.business.address || '',
      horarioAtencion: this.business.horarioAtencion || ''
    };

    this.http.post(
      `${environment.platformProviderApiBaseUrl}/users/${userId}/owner-details`,
      ownerDetailsPayload
    ).subscribe({
      next: () => {
        // Limpiar datos temporales del localStorage
        localStorage.removeItem('register-owner-data');

        this.submitting = false;

        // Redirigir al resumen
        this.router.navigate(['/resumen']);
      },
      error: (err: any) => {
        console.error('[RegisterBussines] ❌ Error creando detalles de propietario:', err);

        // Mensajes específicos según el código de error
        if (err?.status === 404) {
          this.errorMessage = 'Usuario no encontrado. Por favor intenta registrarse de nuevo.';
        } else if (err?.status === 400) {
          this.errorMessage = 'Datos de negocio inválidos. Por favor verifica todos los campos.';
        } else if (err?.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. ¿Está ejecutándose el backend?';
        } else {
          this.errorMessage = 'Error guardando detalles del negocio.';
        }

        this.submitting = false;
      }
    });
  }
}
