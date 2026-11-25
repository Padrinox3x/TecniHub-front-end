import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PerfilPublicoService } from '../../core/services/perfil-publico';
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
      const tipo = this.route.snapshot.data['tipo'] || (this.route.snapshot.url[0]?.path === 'tecnico' ? 'TECNICO' : 'CLIENTE');
      this.tipoPerfil = tipo.toUpperCase() === 'CLIENTE' ? 'CLIENTE' : 'TECNICO';
      this.id = Number(params.get('id'));

      this.cargarPerfil();
    });
  }

  cargarPerfil(): void {
    if (!this.id || this.id <= 0) {
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
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.error = err.status === 404
              ? 'El perfil de técnico no fue encontrado.'
              : 'No fue posible cargar el perfil del técnico.';
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
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.error = err.status === 404
              ? 'El perfil de cliente no fue encontrado.'
              : 'No fue posible cargar el perfil del cliente.';
            this.cdr.markForCheck();
          }
        });
    }
  }

  get inicial(): string {
    if (this.perfilTecnico) {
      return this.perfilTecnico.nombreCompleto.charAt(0).toUpperCase();
    }
    if (this.perfilCliente) {
      return this.perfilCliente.nombrePublico.charAt(0).toUpperCase();
    }
    return 'U';
  }
}
