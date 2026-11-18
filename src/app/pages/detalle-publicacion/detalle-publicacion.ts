
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { TablonService } from '../../core/services/tablon';
import { TablonItem } from '../../core/models/tablon.models';

@Component({
  selector: 'app-detalle-publicacion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.css'
})
export class DetallePublicacion implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly tablonService = inject(TablonService);
  private readonly cdr = inject(ChangeDetectorRef);

  publicacion: TablonItem | null = null;

  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    const tipo = this.route.snapshot.paramMap.get('tipo')?.toUpperCase();
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.error = '';
    this.publicacion = null;

    if (!tipo || !Number.isInteger(id) || id <= 0) {
      this.error = 'La publicación solicitada no es válida.';
      return;
    }

    if (tipo !== 'SERVICIO' && tipo !== 'PIEZA') {
      this.error = 'El tipo de publicación no es válido.';
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();

    const peticion = tipo === 'SERVICIO'
      ? this.tablonService.obtenerServicio(id)
      : this.tablonService.obtenerPieza(id);

    peticion
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.publicacion = respuesta;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[DETALLE PUBLICACION] Error:', err);

          this.error = err.status === 404
            ? 'La publicación que buscas no existe o ya no está disponible.'
            : 'No fue posible cargar el detalle de la publicación.';

          this.cdr.markForCheck();
        }
      });
  }

  esServicio(): boolean {
    return this.publicacion?.tipoPublicacion === 'SERVICIO';
  }

  obtenerEtiquetaTipo(): string {
    return this.esServicio() ? 'Servicio de reparación' : 'Pieza o refacción';
  }

  obtenerEtiquetaEstado(): string {
    return this.publicacion?.textoIndicador
      || this.publicacion?.estado
      || 'Sin estado';
  }
}
