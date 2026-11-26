
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PerfilService } from '../../core/services/perfil';
import { SessionService } from '../../core/services/session';
import { PerfilResponse } from '../../core/models/perfil.models';
import { finalize } from 'rxjs';

import { Navbar } from '../../core/components/navbar/navbar';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  private readonly perfilService = inject(PerfilService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  perfil: PerfilResponse | null = null;
  cargando = true;
  error = '';
  busquedaHero = '';

  get fechaHoy(): string {
    const ahora = new Date();
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return ahora.toLocaleDateString('es-MX', opciones).toUpperCase();
  }

  buscarAparato(): void {
    if (this.busquedaHero.trim()) {
      this.router.navigate(['/tablon'], { queryParams: { q: this.busquedaHero.trim() } });
    } else {
      this.router.navigate(['/tablon']);
    }
  }

  filtrarCategoria(nombre: string): void {
    this.router.navigate(['/tablon'], { queryParams: { q: nombre === 'Ver todas' ? '' : nombre } });
  }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.perfilService.obtenerPerfil()
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
          console.log('[PERFIL] Estado final:', this.cargando);
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.perfil = respuesta;
          console.log('[PERFIL] Perfil recibido:', this.perfil);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[PERFIL] Error:', err);

          if (err.status === 401) {
            this.sessionService.cerrarSesion();
            this.router.navigate(['/login']);
            return;
          }

          this.error = 'No fue posible cargar tu perfil. Intenta nuevamente.';
          this.cdr.detectChanges();
        }
      });
  }

  cerrarSesion(): void {
    this.sessionService.cerrarSesion();
    this.router.navigate(['/login']);
  }

  obtenerNombre(): string {
    if (this.perfil?.cliente) {
      return `${this.perfil.cliente.nombre} ${this.perfil.cliente.apellidos}`;
    }

    return this.perfil?.tecnico?.nombreCompleto ?? 'Usuario';
  }

  esTecnico(): boolean {
    const rolSesion = this.sessionService.obtenerRol()?.toUpperCase();
    const rolPerfil = this.perfil?.rol?.toUpperCase();
    return rolSesion === 'TECNICO' || rolPerfil === 'TECNICO';
  }
}
