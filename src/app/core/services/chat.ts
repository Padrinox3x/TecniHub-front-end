import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConversacionResumen, Mensaje, EnviarMensajeRequest } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://localhost:7013/api/chat';

  obtenerMisConversaciones(): Observable<ConversacionResumen[]> {
    return this.http.get<ConversacionResumen[]>(`${this.apiUrl}/mis-conversaciones`);
  }

  obtenerMensajesServicio(servicioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/servicios/${servicioId}/mensajes`);
  }

  enviarMensajeServicio(servicioId: number, contenido: string): Observable<Mensaje> {
    const payload: EnviarMensajeRequest = { contenido };
    return this.http.post<Mensaje>(`${this.apiUrl}/servicios/${servicioId}/mensajes`, payload);
  }

  obtenerMensajesPieza(piezaId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/piezas/${piezaId}/mensajes`);
  }

  enviarMensajePieza(piezaId: number, contenido: string): Observable<Mensaje> {
    const payload: EnviarMensajeRequest = { contenido };
    return this.http.post<Mensaje>(`${this.apiUrl}/piezas/${piezaId}/mensajes`, payload);
  }
}
