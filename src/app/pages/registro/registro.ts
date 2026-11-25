import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import {
  RegistroClienteRequest,
  RegistroTecnicoRequest
} from '../../core/models/auth.models';
import { OnlyLettersDirective } from '../../core/directives/only-letters.directive';
import { OnlyNumbersDirective } from '../../core/directives/only-numbers.directive';
import { DecimalNumberDirective } from '../../core/directives/decimal-number.directive';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    OnlyLettersDirective,
    OnlyNumbersDirective,
    DecimalNumberDirective
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  tipoCuenta: 'CLIENTE' | 'TECNICO' = 'CLIENTE';

  // Campos compartidos / Cliente
  nombre = '';
  apellidos = '';
  email = '';
  password = '';
  telefono = '';
  direccion = '';

  // Campos específicos Técnico
  nombreCompleto = '';
  tieneNegocioFisico = false;
  telefonoNegocio = '';
  ubicacionEstablecimiento = '';
  fotoIdentificacion = '';
  redesSociales = '';
  costoCotizacion: number | null = null;
  evidenciaTrabajos = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  // Validaciones en tiempo real (Getters)
  get emailValido(): boolean {
    if (!this.email) return true;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.email.trim());
  }

  get telefonoCompleto(): boolean {
    return this.telefono.length === 10;
  }

  get telefonoNegocioCompleto(): boolean {
    if (!this.telefonoNegocio) return true;
    return this.telefonoNegocio.length === 10;
  }

  get passwordSegura(): boolean {
    return this.password.length >= 8 && this.password.length <= 100;
  }

  get clienteFormValido(): boolean {
    return (
      this.nombre.trim().length > 0 &&
      this.apellidos.trim().length > 0 &&
      this.email.trim().length > 0 &&
      this.emailValido &&
      this.passwordSegura &&
      this.telefonoCompleto
    );
  }

  get tecnicoFormValido(): boolean {
    const baseValido =
      this.nombreCompleto.trim().length > 0 &&
      this.email.trim().length > 0 &&
      this.emailValido &&
      this.passwordSegura &&
      this.telefonoCompleto &&
      this.telefonoNegocioCompleto;

    if (this.tieneNegocioFisico && !this.ubicacionEstablecimiento.trim()) {
      return false;
    }

    if (this.costoCotizacion != null && this.costoCotizacion < 0) {
      return false;
    }

    return baseValido;
  }

  cambiarTipo(tipo: 'CLIENTE' | 'TECNICO'): void {
    this.tipoCuenta = tipo;
    this.errorMessage = '';
    this.successMessage = '';
  }

  registrar(): void {
    if (this.loading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (this.tipoCuenta === 'CLIENTE') {
      this.registrarCliente();
    } else {
      this.registrarTecnico();
    }
  }

  private registrarCliente(): void {
    if (!this.clienteFormValido) {
      this.errorMessage = 'Revisa los campos obligatorios y sus formatos en tiempo real.';
      return;
    }

    const datos: RegistroClienteRequest = {
      nombre: this.nombre.trim(),
      apellidos: this.apellidos.trim(),
      email: this.email.trim(),
      contrasena: this.password,
      telefono: this.telefono.trim(),
      direccion: this.direccion.trim() || undefined
    };

    this.loading = true;

    this.authService.registrarCliente(datos).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = '¡Cuenta de cliente creada exitosamente! Redirigiendo...';
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { registrado: 'true' } });
        }, 1200);
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.';
        } else {
          this.errorMessage = error.error?.mensaje || 'Ocurrió un error al crear la cuenta.';
        }
      }
    });
  }

  private registrarTecnico(): void {
    if (!this.tecnicoFormValido) {
      this.errorMessage = 'Revisa los campos del perfil técnico y sus requisitos.';
      return;
    }

    const datos: RegistroTecnicoRequest = {
      nombreCompleto: this.nombreCompleto.trim(),
      email: this.email.trim(),
      contrasena: this.password,
      telefono: this.telefono.trim(),
      tieneNegocioFisico: this.tieneNegocioFisico,
      telefonoNegocio: this.telefonoNegocio.trim() || undefined,
      ubicacionEstablecimiento: this.ubicacionEstablecimiento.trim() || undefined,
      fotoIdentificacion: this.fotoIdentificacion.trim() || undefined,
      redesSociales: this.redesSociales.trim() || undefined,
      costoCotizacion: this.costoCotizacion != null ? Number(this.costoCotizacion) : undefined,
      evidenciaTrabajos: this.evidenciaTrabajos.trim() || undefined
    };

    this.loading = true;

    this.authService.registrarTecnico(datos).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = '¡Cuenta de técnico especialista registrada exitosamente! Redirigiendo...';
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { registrado: 'true' } });
        }, 1200);
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.';
        } else {
          this.errorMessage = error.error?.mensaje || 'Ocurrió un error al registrar el perfil técnico.';
        }
      }
    });
  }
}
