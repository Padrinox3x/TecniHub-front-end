
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  LoginRequest,
  RegistroClienteRequest,
  RegistroTecnicoRequest,
  AuthResponse
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://localhost:7013/api/Auth';

  /**
   * Inicia sesión con las credenciales del usuario.
   */
  login(datos: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      datos
    );
  }

  /**
   * Registra una cuenta de cliente.
   */
  registrarCliente(
    datos: RegistroClienteRequest
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/registro`,
      datos
    );
  }

  /**
   * Registra una cuenta de técnico.
   */
  registrarTecnico(
    datos: RegistroTecnicoRequest
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/registro-tecnico`,
      datos
    );
  }
}
