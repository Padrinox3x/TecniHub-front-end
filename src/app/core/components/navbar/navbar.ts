import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../../services/session';
import { NotificacionesService } from '../../services/notificaciones';
import { Notificacion } from '../../models/notificacion.models';
import { Breadcrumb } from '../breadcrumb/breadcrumb';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, Breadcrumb],
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
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private cargandoNotificaciones = false;

  terminoBusqueda = '';

  get usuarioId(): number | null {
    return this.sessionService.obtenerSesion()?.usuarioId ?? null;
  }

  get nombreUsuario(): string {
    const ses = this.sessionService.obtenerSesion();
    return ses?.email ? ses.email.split('@')[0] : 'Usuario';
  }

  buscar(): void {
    if (this.terminoBusqueda.trim()) {
      this.router.navigate(['/tablon'], { queryParams: { q: this.terminoBusqueda.trim() } });
    }
  }

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
    const raw = this.email || this.nombreUsuario || 'U';
    const limpio = raw.replace(/^@+/, '').trim();
    return (limpio.charAt(0) || 'U').toUpperCase();
  }

  get rutaPerfil(): string[] {
    if (!this.usuarioId) {
      return ['/inicio'];
    }
    const tipo = this.esTecnico ? 'tecnico' : 'cliente';
    return ['/perfil', tipo, String(this.usuarioId)];
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
    // Sondeo de notificaciones cada 6 segundos de forma ligera
    this.intervalId = setInterval(() => {
      this.cargarNotificaciones();
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  cargarNotificaciones(): void {
    if (!this.sessionService.estaAutenticado() || this.cargandoNotificaciones) return;

    this.cargandoNotificaciones = true;
    this.notificacionesService.obtenerNotificaciones().subscribe({
      next: (data) => {
        this.notificaciones = data ?? [];
        this.noLeidasCount = this.notificaciones.filter((n) => !n.leida).length;
        this.cargandoNotificaciones = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoNotificaciones = false;
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
      this.cargarNotificaciones();
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

    const esMensajeChat =
      notificacion.tipo?.toLowerCase() === 'nuevomensaje' ||
      notificacion.tipoReferencia?.toLowerCase() === 'chat';

    if (esMensajeChat) {
      const refTipo = notificacion.tipoReferencia?.toLowerCase();
      if ((refTipo === 'servicio' || refTipo === 'pieza') && notificacion.referenciaId) {
        this.router.navigate(['/chat'], {
          queryParams: { tipo: refTipo, id: notificacion.referenciaId }
        });
      } else {
        this.router.navigate(['/chat']);
      }
      return;
    }

    if (notificacion.tipoReferencia?.toLowerCase() === 'servicio' && notificacion.referenciaId) {
      this.router.navigate(['/detalle-publicacion/servicio', notificacion.referenciaId]);
    } else if (notificacion.tipoReferencia?.toLowerCase() === 'pieza' && notificacion.referenciaId) {
      this.router.navigate(['/detalle-publicacion/pieza', notificacion.referenciaId]);
    }
  }

  cerrarSesion(): void {
    this.sessionService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
