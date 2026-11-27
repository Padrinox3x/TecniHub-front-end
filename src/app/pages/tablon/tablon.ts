import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { finalize } from 'rxjs';

import { TablonService } from '../../core/services/tablon';
import { SessionService } from '../../core/services/session';
import { ImagenStorageService } from '../../core/services/imagen-storage';
import {
  TablonItem,
  TablonFiltro
} from '../../core/models/tablon.models';

import { Navbar } from '../../core/components/navbar/navbar';

@Component({
  selector: 'app-tablon',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar],
  templateUrl: './tablon.html',
  styleUrl: './tablon.css'
})
export class Tablon implements OnInit {

  private readonly tablonService = inject(TablonService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly sessionService = inject(SessionService, { optional: true });
  private readonly imagenStorage = inject(ImagenStorageService);

  publicaciones: TablonItem[] = [];

  cargando = false;
  error = '';

  tipoSeleccionado = 'TODOS';
  incluirCompletados = false;
  terminoBusqueda = '';
  filtroModalidad = 'TODAS';

  // Paginación: 6 publicaciones por página (2 filas de 3)
  paginaActual = 1;
  readonly elementosPorPagina = 6;

  get esTecnico(): boolean {
    return this.sessionService?.obtenerRol()?.toUpperCase() === 'TECNICO';
  }

  get conteoTodos(): number {
    return this.publicaciones.length;
  }

  get conteoServicios(): number {
    return this.publicaciones.filter(p => p.tipoPublicacion?.toUpperCase() === 'SERVICIO').length;
  }

  get conteoPiezas(): number {
    return this.publicaciones.filter(p => p.tipoPublicacion?.toUpperCase() === 'PIEZA').length;
  }

  get publicacionesFiltradas(): TablonItem[] {
    return this.publicaciones.filter(item => {
      if (this.tipoSeleccionado === 'SERVICIOS' && item.tipoPublicacion?.toUpperCase() !== 'SERVICIO') {
        return false;
      }
      if (this.tipoSeleccionado === 'PIEZAS' && item.tipoPublicacion?.toUpperCase() !== 'PIEZA') {
        return false;
      }

      if (this.terminoBusqueda.trim()) {
        const query = this.terminoBusqueda.toLowerCase();
        const coincideTitulo = item.titulo?.toLowerCase().includes(query) ?? false;
        const coincideDesc = item.descripcion?.toLowerCase().includes(query) ?? false;
        const coincideAutor = item.autorNombre?.toLowerCase().includes(query) ?? false;
        const coincideUbicacion = item.ubicacion?.toLowerCase().includes(query) ?? false;
        if (!coincideTitulo && !coincideDesc && !coincideAutor && !coincideUbicacion) {
          return false;
        }
      }

      if (this.filtroModalidad !== 'TODAS' && item.modalidad) {
        if (!item.modalidad.toLowerCase().includes(this.filtroModalidad.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.publicacionesFiltradas.length / this.elementosPorPagina));
  }

  get publicacionesPaginadas(): TablonItem[] {
    const paginaSegura = Math.min(Math.max(1, this.paginaActual), this.totalPaginas);
    const inicio = (paginaSegura - 1) * this.elementosPorPagina;
    return this.publicacionesFiltradas.slice(inicio, inicio + this.elementosPorPagina);
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  get indiceInicio(): number {
    if (this.publicacionesFiltradas.length === 0) return 0;
    const paginaSegura = Math.min(Math.max(1, this.paginaActual), this.totalPaginas);
    return (paginaSegura - 1) * this.elementosPorPagina + 1;
  }

  get indiceFin(): number {
    if (this.publicacionesFiltradas.length === 0) return 0;
    const paginaSegura = Math.min(Math.max(1, this.paginaActual), this.totalPaginas);
    return Math.min(paginaSegura * this.elementosPorPagina, this.publicacionesFiltradas.length);
  }

  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.paginaActual) {
      return;
    }
    this.paginaActual = pagina;
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    this.cdr.markForCheck();
  }

  alCambiarFiltros(): void {
    this.paginaActual = 1;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.route?.queryParams.subscribe(params => {
      if (params['q']) {
        this.terminoBusqueda = params['q'];
      }
      if (params['tipo']) {
        const t = params['tipo'].toUpperCase();
        if (t === 'SERVICIO' || t === 'SERVICIOS') this.tipoSeleccionado = 'SERVICIOS';
        else if (t === 'PIEZA' || t === 'PIEZAS') this.tipoSeleccionado = 'PIEZAS';
      }
    });

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
          console.log('[TABLON] Finalizó la petición. Cargando:', this.cargando);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (respuesta) => {
          this.publicaciones = respuesta ?? [];
          console.log('[TABLON] Respuesta completa:', respuesta);
          console.log('[TABLON] Cantidad:', this.publicaciones.length);

          if (this.publicaciones.length > 0) {
            console.log('[TABLON] Primera publicación:', this.publicaciones[0]);
            console.log('[TABLON] Propiedades:', Object.keys(this.publicaciones[0]));
          }

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error('[TABLON] Error:', err);
          this.error = 'No fue posible cargar las publicaciones. Intenta nuevamente.';
          this.cdr.markForCheck();
        }
      });
  }

  cambiarTipo(tipo: string): void {
    this.tipoSeleccionado = tipo;
    this.paginaActual = 1;
    this.cargarPublicaciones();
  }

  cambiarCompletados(event: Event): void {
    const elemento = event.target as HTMLInputElement;
    this.incluirCompletados = elemento.checked;
    this.paginaActual = 1;
    this.cargarPublicaciones();
  }

  obtenerEtiquetaTipo(tipo: string): string {
    return tipo === 'SERVICIO' ? 'SOLICITUD DE SERVICIO' : 'REFACCIÓN';
  }

  obtenerColorTexto(color: string): string {
    return color || 'Sin clasificación';
  }

  obtenerImagenPublicacion(item: TablonItem): string {
    return this.imagenStorage.obtenerImagen(
      item.tipoPublicacion,
      item.imagenUrl,
      item.id,
      item.titulo
    );
  }

  onImagenError(event: Event, item: TablonItem): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    const fallback =
      item.tipoPublicacion?.toUpperCase() === 'SERVICIO'
        ? 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
    if (img.src !== fallback) {
      img.src = fallback;
    }
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

  obtenerInicialAutor(nombre?: string | null): string {
    if (!nombre) return 'U';
    const limpio = nombre.replace(/^@+/, '').trim();
    return limpio ? limpio.charAt(0).toUpperCase() : 'U';
  }
}
