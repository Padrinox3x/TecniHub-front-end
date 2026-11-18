
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth';
import { SessionService } from '../../core/services/session';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  iniciarSesion(): void {
    if (this.loading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const credentials = {
      email: this.email.trim(),
      contrasena: this.password
    };

    if (!credentials.email || !credentials.contrasena) {
      this.errorMessage =
        'Ingresa tu correo electrónico y contraseña.';
      return;
    }

    this.loading = true;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        try {
          // Guardar token y datos de sesión.
          this.sessionService.guardarSesion(response);

          // Verificar que la sesión se haya guardado.
          if (!this.sessionService.estaAutenticado()) {
            throw new Error('No fue posible guardar la sesión.');
          }

          this.successMessage = 'Inicio de sesión exitoso.';

          // Mostrar información sin exponer el JWT.
          console.log('Usuario autenticado:', {
            usuarioId: response.usuarioId,
            email: response.email,
            rol: response.rol,
            expiracion: response.expiracion
          });

          console.log(
            'Sesión guardada:',
            this.sessionService.estaAutenticado()
          );

          // Redirigir al panel principal.
          this.router.navigate(['/inicio']);
        } catch (error) {
          this.sessionService.cerrarSesion();
          this.errorMessage =
            'No fue posible guardar tu sesión. Inténtalo nuevamente.';

          console.error('Error al guardar la sesión:', error);
        } finally {
          this.loading = false;
        }
      },

      error: (error) => {
        this.loading = false;

        if (error.status === 0) {
          this.errorMessage =
            'No se pudo conectar con el servidor. Verifica que la API esté ejecutándose y que CORS esté configurado.';
        } else if (error.status === 400 || error.status === 401) {
          this.errorMessage =
            error.error?.mensaje ||
            'El correo electrónico o la contraseña son incorrectos.';
        } else {
          this.errorMessage =
            error.error?.mensaje ||
            'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.';
        }

        console.error('Error de autenticación:', error.status);
      }
    });
  }
}
