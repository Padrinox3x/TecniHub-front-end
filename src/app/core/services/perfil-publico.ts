import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PerfilPublicoTecnico, PerfilPublicoCliente } from '../models/resena.models';

@Injectable({
  providedIn: 'root'
})
export class PerfilPublicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://localhost:7013/api';

  obtenerPerfilTecnicoPublico(tecnicoId: number): Observable<PerfilPublicoTecnico> {
    return this.http.get<PerfilPublicoTecnico>(`${this.baseUrl}/tecnico/publico/${tecnicoId}`);
  }

  obtenerPerfilClientePublico(clienteId: number): Observable<PerfilPublicoCliente> {
    return this.http.get<PerfilPublicoCliente>(`${this.baseUrl}/cliente/publico/${clienteId}`);
  }
}
