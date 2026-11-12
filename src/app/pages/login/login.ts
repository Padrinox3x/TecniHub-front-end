
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService = inject(AuthService);

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
        this.loading = false;
        this.successMessage = 'Inicio de sesión exitoso.';

        console.log('Usuario autenticado:', {
          usuarioId: response.usuarioId,
          email: response.email,
          rol: response.rol,
          expiracion: response.expiracion
        });

        // Pendiente: guardar el token de forma adecuada
        // y redirigir según el flujo de autenticación.
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

        console.error('Error de autenticación:', error);
      }
    });
  }
}
