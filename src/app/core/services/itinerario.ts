import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ItinerarioItem,
  ItinerarioProgramado,
  ProgramarItinerarioRequest
} from '../models/itinerario.models';

@Injectable({
  providedIn: 'root'
})
export class ItinerarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://d2c9vof7dxdez3.cloudfront.net/api/itinerarios';

  obtenerItinerario(
    incluirCompletados = false,
    tecnicoId?: number
  ): Observable<ItinerarioItem[]> {
    let params = new HttpParams().set('incluirCompletados', incluirCompletados);
    if (tecnicoId != null) {
      params = params.set('tecnicoId', tecnicoId);
    }
    return this.http.get<ItinerarioItem[]>(this.apiUrl, { params });
  }

  programarCita(datos: ProgramarItinerarioRequest): Observable<ItinerarioProgramado> {
    return this.http.post<ItinerarioProgramado>(this.apiUrl, datos);
  }

  finalizarServicioAgendado(id: number): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(
      `${this.apiUrl}/servicios/${id}/finalizar`,
      {}
    );
  }
}
