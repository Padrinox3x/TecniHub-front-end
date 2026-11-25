
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CrearPublicacionServicioRequest,
  CrearPublicacionPiezaRequest,
  PublicacionCreada
} from '../models/publicacion.models';

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://localhost:7013/api/tablon';

  crearServicio(
    request: CrearPublicacionServicioRequest
  ): Observable<PublicacionCreada> {
    return this.http.post<PublicacionCreada>(
      `${this.apiUrl}/servicios`,
      request
    );
  }

  crearPieza(
    request: CrearPublicacionPiezaRequest
  ): Observable<PublicacionCreada> {
    return this.http.post<PublicacionCreada>(
      `${this.apiUrl}/piezas`,
      request
    );
  }
}
