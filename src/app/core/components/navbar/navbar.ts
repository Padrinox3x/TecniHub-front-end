import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../services/session';
import { NotificacionesService } from '../../services/notificaciones';
import { Notificacion } from '../../models/notificacion.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {
  private readonly sessionService = inject(SessionService);
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  menuAbierto = false;
  panelNotificacionesAbierto = false;
  notificaciones: Notificacion[] = [];
  noLeidasCount = 0;
  private intervalId: any = null;

  get rol(): string {
    return this.sessionService.obtenerRol() ?? '';
  }

  get esTecnico(): boolean {
    return this.rol.toUpperCase() === 'TECNICO';
  }

  get email(): string {
    return this.sessionService.obtenerSesion()?.email ?? '';
  }

  get inicial(): string {
    return this.email.charAt(0).toUpperCase() || 'U';
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
    // Sondeo de notificaciones cada 20 segundos de forma ligera
    this.intervalId = setInterval(() => {
      this.cargarNotificaciones();
    }, 20000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarNotificaciones(): void {
    if (!this.sessionService.estaAutenticado()) return;

    this.notificacionesService.obtenerNotificaciones().subscribe({
      next: (data) => {
        this.notificaciones = data ?? [];
        this.noLeidasCount = this.notificaciones.filter((n) => !n.leida).length;
        this.cdr.markForCheck();
      },
      error: () => {
        // En caso de que el backend no tenga notificaciones aún, se silencia
      }
    });
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
    if (this.menuAbierto) {
      this.panelNotificacionesAbierto = false;
    }
  }

  toggleNotificaciones(): void {
    this.panelNotificacionesAbierto = !this.panelNotificacionesAbierto;
    if (this.panelNotificacionesAbierto) {
      this.menuAbierto = false;
    }
  }

  marcarLeida(notificacion: Notificacion, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (notificacion.leida) return;

    this.notificacionesService.marcarLeida(notificacion.id).subscribe({
      next: () => {
        notificacion.leida = true;
        this.noLeidasCount = Math.max(0, this.noLeidasCount - 1);
        this.cdr.markForCheck();
      }
    });
  }

  irANotificacion(notificacion: Notificacion): void {
    this.marcarLeida(notificacion);
    this.panelNotificacionesAbierto = false;

    if (notificacion.tipoReferencia?.toLowerCase() === 'servicio' && notificacion.referenciaId) {
      this.router.navigate(['/detalle-publicacion/servicio', notificacion.referenciaId]);
    } else if (notificacion.tipoReferencia?.toLowerCase() === 'pieza' && notificacion.referenciaId) {
      this.router.navigate(['/detalle-publicacion/pieza', notificacion.referenciaId]);
    } else if (notificacion.tipoReferencia?.toLowerCase() === 'chat') {
      this.router.navigate(['/chat']);
    }
  }

  cerrarSesion(): void {
    this.sessionService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
