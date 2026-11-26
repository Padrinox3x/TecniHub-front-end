
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PerfilResponse } from '../models/perfil.models';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://d2c9vof7dxdez3.cloudfront.net/api/Perfil';

  obtenerPerfil(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(this.apiUrl);
  }
}
