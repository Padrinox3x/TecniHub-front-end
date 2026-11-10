import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  iconoUrl?: string | null;
}

export interface CrearServicioRequest {
  clienteId: string;
  categoriaId: number;
  tipoElectrodomestico: string;
  marca?: string;
  modelo?: string;
  descripcionFalla: string;
  ubicacionAproximada: string;
  municipio?: string;
  fechaSolicitud?: string;
  horarioPreferido?: string;
}

export interface ServicioCreado {
  id: string;
  codigoFolio: string;
  estado: string;
}

export interface PublicarPiezaRequest {
  tecnicoId: string;
  categoriaId: number;
  nombre: string;
  descripcion: string;
  condicion: string;
  modalidad: 'VENTA' | 'INTERCAMBIO' | 'VENTA_E_INTERCAMBIO';
  precio?: number | null;
  piezaIntercambioDeseada?: string | null;
  medioContacto: string;
  ubicacionEntrega: string;
}

export interface Pieza {
  id: string;
  codigoFolio: string;
  categoriaId: number;
  nombre: string;
  descripcion: string;
  condicion: string;
  modalidad: string;
  precio?: number | null;
  piezaIntercambioDeseada?: string | null;
  medioContacto: string;
  ubicacionEntrega: string;
}

export interface BuscarPiezasParams {
  texto?: string;
  categoriaId?: number;
  condicion?: string;
  modalidad?: string;
  precioMaximo?: number;
}

export interface ProgramarItinerarioRequest {
  servicioId: string;
  tecnicoId: string;
  actorId: string;
  fecha: string;
  horaInicio: string;
  horaFinEstimada: string;
  notas?: string;
}

export interface ItinerarioProgramado {
  servicioId: string;
  fecha: string;
  horaInicio: string;
  horaFinEstimada: string;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class Sprint3ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  obtenerCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/servicios/categorias`);
  }

  crearServicio(request: CrearServicioRequest): Observable<ServicioCreado> {
    return this.http.post<ServicioCreado>(`${this.baseUrl}/servicios`, request);
  }

  buscarPiezas(filters: BuscarPiezasParams): Observable<Pieza[]> {
    let params = new HttpParams();
    if (filters.texto) params = params.set('texto', filters.texto);
    if (filters.categoriaId) params = params.set('categoriaId', filters.categoriaId);
    if (filters.condicion) params = params.set('condicion', filters.condicion);
    if (filters.modalidad) params = params.set('modalidad', filters.modalidad);
    if (filters.precioMaximo !== undefined) params = params.set('precioMaximo', filters.precioMaximo);
    return this.http.get<Pieza[]>(`${this.baseUrl}/piezas`, { params });
  }

  publicarPieza(request: PublicarPiezaRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/piezas`, request);
  }

  programarItinerario(request: ProgramarItinerarioRequest): Observable<ItinerarioProgramado> {
    return this.http.post<ItinerarioProgramado>(`${this.baseUrl}/itinerarios`, request);
  }

  mensajeError(error: unknown, fallback: string): string {
    const response = error as { error?: { mensaje?: string; title?: string } };
    return response?.error?.mensaje ?? response?.error?.title ?? fallback;
  }
}
