import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { BuscarPiezasParams, Categoria, Pieza, PublicarPiezaRequest, Sprint3ApiService } from '../sprint3-api.service';

@Component({
  selector: 'app-piezas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './piezas.component.html',
  styleUrl: './piezas.component.css',
})
export class PiezasComponent implements OnInit {
  private readonly api = inject(Sprint3ApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  categories: Categoria[] = [];
  pieces: Pieza[] = [];
  mode: 'search' | 'publish' = 'search';
  loading = false;
  saving = false;
  error = '';
  notice = '';
  pieceId = '';
  filters: BuscarPiezasParams = {};
  model: PublicarPiezaRequest = {
    tecnicoId: '', categoriaId: 0, nombre: '', descripcion: '', condicion: 'NUEVO',
    modalidad: 'VENTA', precio: null, piezaIntercambioDeseada: '', medioContacto: '', ubicacionEntrega: '',
  };

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      this.loadCategories();
      this.search(true);
    });
  }

  search(initialLoad = false): void {
    if (!initialLoad) this.loading = true;
    this.error = '';
    this.api.buscarPiezas(this.filters).subscribe({
      next: (pieces) => {
        this.pieces = pieces;
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.api.mensajeError(err, 'No fue posible cargar las piezas.');
        this.changeDetector.markForCheck();
      },
      complete: () => {
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  submit(form: NgForm): void {
    this.error = '';
    this.notice = '';
    this.pieceId = '';
    if (form.invalid || !this.model.categoriaId) {
      form.control.markAllAsTouched();
      if (!this.model.categoriaId) this.error = 'Selecciona una categoría.';
      return;
    }
    if ((this.model.modalidad === 'VENTA' || this.model.modalidad === 'VENTA_E_INTERCAMBIO') && (!this.model.precio || this.model.precio <= 0)) {
      this.error = 'Esta modalidad requiere un precio mayor que cero.';
      return;
    }
    if ((this.model.modalidad === 'INTERCAMBIO' || this.model.modalidad === 'VENTA_E_INTERCAMBIO') && !this.model.piezaIntercambioDeseada?.trim()) {
      this.error = 'Describe la pieza que aceptarías a cambio.';
      return;
    }

    this.saving = true;
    this.api.publicarPieza(this.model).subscribe({
      next: (result) => {
        this.pieceId = result.id;
        this.notice = 'La pieza quedó publicada y ya puede aparecer en las búsquedas.';
        form.resetForm({ ...this.model, nombre: '', descripcion: '', precio: null, piezaIntercambioDeseada: '' });
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.error = this.api.mensajeError(err, 'No fue posible publicar la pieza.');
        this.changeDetector.markForCheck();
      },
      complete: () => {
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadCategories(): void {
    this.api.obtenerCategorias().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.changeDetector.markForCheck();
      },
      error: (err) => {
        this.error = this.api.mensajeError(err, 'No fue posible cargar las categorías.');
        this.changeDetector.markForCheck();
      },
    });
  }
}
