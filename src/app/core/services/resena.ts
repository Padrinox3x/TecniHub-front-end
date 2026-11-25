import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ResenaTecnico,
  CrearResenaUniversalRequest,
  CierreServicioResponse,
  ConfirmarCierreYCalificarRequest
} from '../models/resena.models';

@Injectable({
  providedIn: 'root'
})
export class ResenaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrlResenas = 'https://localhost:7013/api/resenas';
  private readonly apiUrlServicios = 'https://localhost:7013/api/servicios';

  crearResena(datos: CrearResenaUniversalRequest): Observable<ResenaTecnico> {
    return this.http.post<ResenaTecnico>(this.apiUrlResenas, datos);
  }

  obtenerResenaServicio(servicioId: number): Observable<ResenaTecnico> {
    return this.http.get<ResenaTecnico>(`${this.apiUrlResenas}/servicio/${servicioId}`);
  }

  obtenerResenasTecnico(tecnicoId: number): Observable<ResenaTecnico[]> {
    return this.http.get<ResenaTecnico[]>(`${this.apiUrlResenas}/tecnico/${tecnicoId}`);
  }

  solicitarCierreServicio(servicioId: number, comentarioTecnico?: string): Observable<CierreServicioResponse> {
    return this.http.post<CierreServicioResponse>(
      `${this.apiUrlServicios}/${servicioId}/solicitar-cierre`,
      { comentarioTecnico }
    );
  }

  confirmarCierreYCalificar(
    servicioId: number,
    calificacion: number,
    comentario?: string
  ): Observable<CierreServicioResponse> {
    const payload: ConfirmarCierreYCalificarRequest = {
      servicioId,
      calificacion,
      comentario: comentario?.trim() || null
    };
    return this.http.post<CierreServicioResponse>(
      `${this.apiUrlServicios}/${servicioId}/confirmar-cierre`,
      payload
    );
  }
}
