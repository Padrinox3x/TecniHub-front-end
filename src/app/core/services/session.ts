
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { AuthResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'tecnihub_session';

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Guarda los datos devueltos por el backend.
   */
  guardarSesion(response: AuthResponse): void {
    if (!this.isBrowser) {
      return;
    }

    const session: AuthResponse = {
      token: response.token,
      expiracion: response.expiracion,
      usuarioId: response.usuarioId,
      email: response.email,
      rol: response.rol.toUpperCase()
    };

    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify(session)
    );
  }

  /**
   * Recupera la sesión activa.
   */
  obtenerSesion(): AuthResponse | null {
    if (!this.isBrowser) {
      return null;
    }

    const storedSession = sessionStorage.getItem(this.storageKey);

    if (!storedSession) {
      return null;
    }

    try {
      const session = JSON.parse(storedSession) as AuthResponse;

      if (!session.token || !session.expiracion) {
        this.cerrarSesion();
        return null;
      }

      const expirationTime = new Date(session.expiracion).getTime();

      if (
        !Number.isFinite(expirationTime) ||
        expirationTime <= Date.now()
      ) {
        this.cerrarSesion();
        return null;
      }

      return session;
    } catch {
      this.cerrarSesion();
      return null;
    }
  }

  /**
   * Obtiene únicamente el JWT.
   */
  obtenerToken(): string | null {
    return this.obtenerSesion()?.token ?? null;
  }

  /**
   * Obtiene el rol del usuario autenticado.
   */
  obtenerRol(): string | null {
    return this.obtenerSesion()?.rol ?? null;
  }

  /**
   * Comprueba si existe una sesión vigente.
   */
  estaAutenticado(): boolean {
    return this.obtenerSesion() !== null;
  }

  /**
   * Elimina la sesión local.
   */
  cerrarSesion(): void {
    if (!this.isBrowser) {
      return;
    }

    sessionStorage.removeItem(this.storageKey);
  }
}
