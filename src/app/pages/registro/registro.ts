import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  nombre = '';
  apellidos = '';
  email = '';
  password = '';
  telefono = '';
  direccion = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  registrar(): void {
    if (this.loading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const datos = {
      nombre: this.nombre.trim(),
      apellidos: this.apellidos.trim(),
      email: this.email.trim(),
      contrasena: this.password,
      telefono: this.telefono.trim(),
      direccion: this.direccion.trim() || undefined
    };

    if (
      !datos.nombre ||
      !datos.apellidos ||
      !datos.email ||
      !datos.contrasena ||
      !datos.telefono
    ) {
      this.errorMessage =
        'Completa todos los campos obligatorios.';
      return;
    }

    if (datos.contrasena.length < 8 ||
        datos.contrasena.length > 100) {
      this.errorMessage =
        'La contraseña debe tener entre 8 y 100 caracteres.';
      return;
    }

    if (!/^[0-9]{10}$/.test(datos.telefono)) {
      this.errorMessage =
        'El teléfono debe contener exactamente 10 dígitos.';
      return;
    }

    this.loading = true;

    console.log('Correo enviado al registro:', datos.email);
    this.authService.registrar(datos).subscribe({
      next: (response) => {
  this.loading = false;
  this.successMessage =
    '¡Cuenta creada correctamente! Redirigiendo al inicio de sesión...';

  console.log('Registro exitoso:', {
    usuarioId: response.usuarioId,
    email: response.email,
    rol: response.rol
  });

  this.router.navigate(['/login'], {
    queryParams: { registrado: 'true' }
  });



        // Dejamos que el usuario vea la confirmación
        // antes de navegar al login.
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 0) {
          this.errorMessage =
            'No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.';
        } else if (error.status === 409) {
          this.errorMessage =
            error.error?.mensaje ||
            'Ya existe un usuario con esos datos.';
        } else if (error.status === 400) {
          this.errorMessage =
            error.error?.mensaje ||
            'Revisa los datos ingresados.';
        } else {
          this.errorMessage =
            error.error?.mensaje ||
            'No fue posible crear la cuenta.';
        }

        console.error('Error de registro:', error);
      }
    });
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}
