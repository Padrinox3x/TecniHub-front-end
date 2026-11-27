import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConversacionResumen, Mensaje, EnviarMensajeRequest } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://d2c9vof7dxdez3.cloudfront.net/api/chat';

  private noCacheParams(): HttpParams {
    return new HttpParams().set('_t', Date.now().toString());
  }

  obtenerMisConversaciones(): Observable<ConversacionResumen[]> {
    return this.http.get<ConversacionResumen[]>(`${this.apiUrl}/mis-conversaciones`, {
      params: this.noCacheParams()
    });
  }

  obtenerMensajesServicio(servicioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/servicios/${servicioId}/mensajes`, {
      params: this.noCacheParams()
    });
  }

  enviarMensajeServicio(servicioId: number, contenido: string): Observable<Mensaje> {
    const payload: EnviarMensajeRequest = { contenido };
    return this.http.post<Mensaje>(`${this.apiUrl}/servicios/${servicioId}/mensajes`, payload);
  }

  obtenerMensajesPieza(piezaId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/piezas/${piezaId}/mensajes`, {
      params: this.noCacheParams()
    });
  }

  enviarMensajePieza(piezaId: number, contenido: string): Observable<Mensaje> {
    const payload: EnviarMensajeRequest = { contenido };
    return this.http.post<Mensaje>(`${this.apiUrl}/piezas/${piezaId}/mensajes`, payload);
  }
}
