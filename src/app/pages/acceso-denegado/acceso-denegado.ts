
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="access-denied">
      <h1>Acceso denegado</h1>

      <p>
        No tienes permisos para acceder a esta sección.
      </p>

      <a routerLink="/login">Volver al inicio de sesión</a>
    </main>
  `
})
export class AccesoDenegado {}
