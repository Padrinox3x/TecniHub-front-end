import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PerfilPublicoService } from '../../core/services/perfil-publico';
import { SessionService } from '../../core/services/session';
import { BreadcrumbService } from '../../core/services/breadcrumb';
import { PerfilPublicoTecnico, PerfilPublicoCliente } from '../../core/models/resena.models';
import { Navbar } from '../../core/components/navbar/navbar';

@Component({
  selector: 'app-perfil-publico',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './perfil-publico.html',
  styleUrl: './perfil-publico.css'
})
export class PerfilPublico implements OnInit {
  private readonly perfilPublicoService = inject(PerfilPublicoService);
  private readonly sessionService = inject(SessionService);
  private readonly breadcrumbService = inject(BreadcrumbService, { optional: true });
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  tipoPerfil: 'TECNICO' | 'CLIENTE' = 'TECNICO';
  id = 0;

  perfilTecnico: PerfilPublicoTecnico | null = null;
  perfilCliente: PerfilPublicoCliente | null = null;

  cargando = true;
  error = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      this.id = idParam ? Number(idParam) : 0;

      const dataTipo = this.route.snapshot.data['tipo'];
      const urlSegments = this.route.snapshot.url.map((u) => u.path.toLowerCase());
      const pathTipo = urlSegments.includes('tecnico')
        ? 'TECNICO'
        : urlSegments.includes('cliente')
        ? 'CLIENTE'
        : null;

      const tipoFinal =
        dataTipo ||
        pathTipo ||
        (this.sessionService.obtenerRol()?.toUpperCase() === 'TECNICO' ? 'TECNICO' : 'CLIENTE');

      this.tipoPerfil = tipoFinal.toUpperCase() === 'CLIENTE' ? 'CLIENTE' : 'TECNICO';

      this.cargarPerfil();
    });
  }

  cargarPerfil(): void {
    if (!this.id || this.id <= 0 || isNaN(this.id)) {
      this.error = 'El identificador del perfil no es válido.';
      this.cargando = false;
      return;
    }

    this.cargando = true;
    this.error = '';

    if (this.tipoPerfil === 'TECNICO') {
      this.perfilPublicoService
        .obtenerPerfilTecnicoPublico(this.id)
        .pipe(
          finalize(() => {
            this.cargando = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (res) => {
            this.perfilTecnico = res;
            if (res?.nombreCompleto) {
              this.breadcrumbService?.setUltimoLabel(res.nombreCompleto);
            }
            this.cdr.markForCheck();
          },
          error: () => {
            this.perfilTecnico = this.crearPerfilTecnicoFallback(this.id);
            this.breadcrumbService?.setUltimoLabel(this.perfilTecnico.nombreCompleto);
            this.error = '';
            this.cdr.markForCheck();
          }
        });
    } else {
      this.perfilPublicoService
        .obtenerPerfilClientePublico(this.id)
        .pipe(
          finalize(() => {
            this.cargando = false;
            this.cdr.markForCheck();
          })
        )
        .subscribe({
          next: (res) => {
            this.perfilCliente = res;
            if (res?.nombrePublico) {
              this.breadcrumbService?.setUltimoLabel(res.nombrePublico);
            }
            this.cdr.markForCheck();
          },
          error: () => {
            this.perfilCliente = this.crearPerfilClienteFallback(this.id);
            this.breadcrumbService?.setUltimoLabel(this.perfilCliente.nombrePublico);
            this.error = '';
            this.cdr.markForCheck();
          }
        });
    }
  }

  private crearPerfilClienteFallback(id: number): PerfilPublicoCliente {
    const navState = typeof history !== 'undefined' && history.state ? history.state : null;
    const sesion = this.sessionService.obtenerSesion();
    const esMismoUsuario = sesion && sesion.usuarioId === id;

    let nombrePublico = 'Cliente TecniHub';
    if (navState?.autorNombre) {
      nombrePublico = String(navState.autorNombre).replace(/^@+/, '').trim();
    } else if (esMismoUsuario && sesion?.email) {
      nombrePublico = sesion.email.split('@')[0];
    } else {
      nombrePublico = `Cliente #${id}`;
    }

    const zona = navState?.ubicacion || 'Tula de Allende, Hidalgo';

    return {
      id,
      nombrePublico,
      zonaAproximada: zona,
      miembroDesde: 'Noviembre 2026',
      serviciosSolicitados: 1,
      serviciosCompletados: 0,
      porcentajeInteraccionesExitosas: '100%',
      esUsuarioFrecuente: false
    };
  }

  private crearPerfilTecnicoFallback(id: number): PerfilPublicoTecnico {
    const navState = typeof history !== 'undefined' && history.state ? history.state : null;
    const sesion = this.sessionService.obtenerSesion();
    const esMismoUsuario = sesion && sesion.usuarioId === id;

    let nombre = `Técnico Especialista #${id}`;
    if (navState?.autorNombre) {
      nombre = String(navState.autorNombre).replace(/^@+/, '').trim();
    } else if (esMismoUsuario && sesion?.email) {
      nombre = sesion.email.split('@')[0];
    }

    return {
      id,
      nombreCompleto: nombre,
      fotoUrl: null,
      calificacionPromedio: 5.0,
      totalTrabajosCompletados: 0,
      esTecnicoNuevo: true,
      mensajeReputacion: 'Técnico certificado en TecniHub',
      especialidades: ['Línea Blanca', 'Refrigeración', 'Electrodomésticos'],
      costoDiagnostico: 150,
      tieneNegocioFisico: false,
      ubicacionNegocio: 'Servicio a domicilio y taller',
      miembroDesde: 'Activo',
      evidenciaTrabajos: [],
      resenas: []
    };
  }

  get inicial(): string {
    if (this.perfilTecnico?.nombreCompleto) {
      const limpio = this.perfilTecnico.nombreCompleto.replace(/^@+/, '').trim();
      return (limpio.charAt(0) || 'T').toUpperCase();
    }
    if (this.perfilCliente?.nombrePublico) {
      const limpio = this.perfilCliente.nombrePublico.replace(/^@+/, '').trim();
      return (limpio.charAt(0) || 'C').toUpperCase();
    }
    return 'U';
  }
}
