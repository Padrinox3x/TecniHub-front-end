import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notificacion, SuscripcionPushRequest } from '../models/notificacion.models';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://d2c9vof7dxdez3.cloudfront.net/api/notificaciones';

  obtenerNotificaciones(soloNoLeidas = false): Observable<Notificacion[]> {
    let params = new HttpParams().set('_t', Date.now().toString());
    if (soloNoLeidas) {
      params = params.set('soloNoLeidas', true);
    }
    return this.http.get<Notificacion[]>(this.apiUrl, { params });
  }

  marcarLeida(id: string): Observable<{ mensaje: string; leida: boolean }> {
    return this.http.put<{ mensaje: string; leida: boolean }>(`${this.apiUrl}/${id}/leida`, {});
  }

  suscribirPush(datos: SuscripcionPushRequest): Observable<{ mensaje: string; exito: boolean }> {
    return this.http.post<{ mensaje: string; exito: boolean }>(`${this.apiUrl}/suscribir`, datos);
  }
}
