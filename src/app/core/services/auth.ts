
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface AuthResponse {
  token: string;
  expiracion: string;
  usuarioId: number;
  email: string;
  rol: string;
}

export interface RegistroClienteRequest {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  telefono: string;
  direccion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  // Sustituye este valor por la URL HTTPS real de Swagger.
  private readonly apiUrl = 'https://localhost:7013/api/Auth';

  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      datos
    );
  }

  registrar(
    datos: RegistroClienteRequest
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/registro`,
      datos
    );
  }
}
