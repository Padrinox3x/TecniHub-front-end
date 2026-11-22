import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { finalize } from 'rxjs';

import { TablonService } from '../../core/services/tablon';
import {
  TablonItem,
  TablonFiltro
} from '../../core/models/tablon.models';

import { Navbar } from '../../core/components/navbar/navbar';

@Component({
  selector: 'app-tablon',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar],
  templateUrl: './tablon.html',
  styleUrl: './tablon.css'
})
export class Tablon implements OnInit {

  private readonly tablonService = inject(TablonService);
  private readonly cdr = inject(ChangeDetectorRef);

  publicaciones: TablonItem[] = [];

  cargando = false;
  error = '';

  tipoSeleccionado = 'TODOS';
  incluirCompletados = false;

  ngOnInit(): void {
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.cargando = true;
    this.error = '';

    this.cdr.markForCheck();

    const filtro: TablonFiltro = {
      tipo: this.tipoSeleccionado,
      incluirCompletados: this.incluirCompletados
    };

    this.tablonService.obtenerPublicaciones(filtro)
      .pipe(
        finalize(() => {
          this.cargando = false;

          console.log(
            '[TABLON] Finalizó la petición. Cargando:',
            this.cargando
          );

          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.publicaciones = respuesta ?? [];

          console.log('[TABLON] Respuesta completa:', respuesta);
          console.log('[TABLON] Cantidad:', this.publicaciones.length);

          if (this.publicaciones.length > 0) {
            console.log(
              '[TABLON] Primera publicación:',
              this.publicaciones[0]
            );

            console.log(
              '[TABLON] Propiedades:',
              Object.keys(this.publicaciones[0])
            );
          }

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('[TABLON] Error:', err);

          this.error =
            'No fue posible cargar las publicaciones. Intenta nuevamente.';

          this.cdr.markForCheck();
        }
      });
  }

  cambiarTipo(tipo: string): void {
    this.tipoSeleccionado = tipo;
    this.cargarPublicaciones();
  }

  cambiarCompletados(event: Event): void {
    const elemento = event.target as HTMLInputElement;

    this.incluirCompletados = elemento.checked;
    this.cargarPublicaciones();
  }

  obtenerEtiquetaTipo(tipo: string): string {
    return tipo === 'SERVICIO' ? 'Servicio' : 'Pieza';
  }

  obtenerColorTexto(color: string): string {
    return color || 'Sin clasificación';
  }

  obtenerRutaPerfilAutor(publicacion: TablonItem): string[] {
    const esTecnico =
      publicacion.autorRol?.toUpperCase() === 'TECNICO' ||
      publicacion.tipoPublicacion?.toUpperCase() === 'PIEZA';
    const tipo = esTecnico ? 'tecnico' : 'cliente';
    return ['/perfil', tipo, String(publicacion.autorId)];
  }

  obtenerRutaPerfilTecnicoAsignado(tecnicoId: number): string[] {
    return ['/perfil', 'tecnico', String(tecnicoId)];
  }
}
