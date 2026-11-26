import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { PerfilPublicoTecnico, PerfilPublicoCliente } from '../models/resena.models';

@Injectable({
  providedIn: 'root'
})
export class PerfilPublicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://d2c9vof7dxdez3.cloudfront.net/api';

  obtenerPerfilTecnicoPublico(tecnicoId: number): Observable<PerfilPublicoTecnico> {
    return this.http.get<PerfilPublicoTecnico>(`${this.baseUrl}/tecnico/publico/${tecnicoId}`).pipe(
      catchError(() => {
        return this.http.get<PerfilPublicoTecnico>(`${this.baseUrl}/Perfil/tecnico/publico/${tecnicoId}`);
      })
    );
  }

  obtenerPerfilClientePublico(clienteId: number): Observable<PerfilPublicoCliente> {
    return this.http.get<PerfilPublicoCliente>(`${this.baseUrl}/cliente/publico/${clienteId}`).pipe(
      catchError(() => {
        return this.http.get<PerfilPublicoCliente>(`${this.baseUrl}/Perfil/cliente/publico/${clienteId}`);
      })
    );
  }
}
