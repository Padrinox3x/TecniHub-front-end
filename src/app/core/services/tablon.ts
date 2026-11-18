
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  TablonItem,
  TablonFiltro
} from '../models/tablon.models';

@Injectable({
  providedIn: 'root'
})
export class TablonService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://localhost:7013/api/Tablon';

  obtenerPublicaciones(
    filtro?: TablonFiltro
  ): Observable<TablonItem[]> {

    let params = new HttpParams();

    if (filtro?.tipo && filtro.tipo !== 'TODOS') {
      params = params.set('Tipo', filtro.tipo);
    }

    if (filtro?.estado) {
      params = params.set('Estado', filtro.estado);
    }

    if (filtro?.color) {
      params = params.set('Color', filtro.color);
    }

    if (filtro?.incluirCompletados !== undefined) {
      params = params.set(
        'IncluirCompletados',
        filtro.incluirCompletados
      );
    }

    return this.http.get<TablonItem[]>(
      this.apiUrl,
      { params }
    );
  }

  obtenerServicio(id: number): Observable<TablonItem> {
    return this.http.get<TablonItem>(
      `${this.apiUrl}/servicios/${id}`
    );
  }

  obtenerPieza(id: number): Observable<TablonItem> {
    return this.http.get<TablonItem>(
      `${this.apiUrl}/piezas/${id}`
    );
  }
}
