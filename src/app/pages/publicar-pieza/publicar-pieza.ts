import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PublicacionService } from '../../core/services/publicacion';
import { ImagenStorageService } from '../../core/services/imagen-storage';
import { CrearPublicacionPiezaRequest } from '../../core/models/publicacion.models';

import { Navbar } from '../../core/components/navbar/navbar';
import { DecimalNumberDirective } from '../../core/directives/decimal-number.directive';

@Component({
  selector: 'app-publicar-pieza',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Navbar, DecimalNumberDirective],
  templateUrl: './publicar-pieza.html',
  styleUrl: './publicar-pieza.css'
})
export class PublicarPieza {
  private readonly fb = inject(FormBuilder);
  private readonly publicacionService = inject(PublicacionService);
  private readonly imagenStorage = inject(ImagenStorageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  enviando = false;
  publicado = false;
  error = '';

  // Carga de imagen desde archivo
  archivoSeleccionado: File | null = null;
  imagenPreviewUrl: string | null = null;
  errorImagen = '';
  arrastrando = false;
  readonly tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];
  readonly maxTamanoBytes = 5 * 1024 * 1024; // 5 MB

  formulario = this.fb.nonNullable.group({
    nombrePieza: ['', [
      Validators.required,
      Validators.maxLength(150)
    ]],
    categoriaAparato: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],
    condicionPieza: ['', [
      Validators.required,
      Validators.maxLength(50)
    ]],
    tipoTransaccion: ['Venta', [
      Validators.required
    ]],
    precio: [null as number | null, [
      Validators.min(0),
      Validators.max(99999999.99)
    ]],
    datosContacto: ['', [
      Validators.required,
      Validators.maxLength(255)
    ]],
    descripcionDetalle: ['', [
      Validators.maxLength(1000)
    ]],
    fotografia: ['', [
      Validators.maxLength(500)
    ]]
  });

  get requierePrecio(): boolean {
    return this.formulario.controls.tipoTransaccion.value !== 'Intercambio';
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.procesarArchivo(file);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrando = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrando = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrando = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.procesarArchivo(file);
    }
  }

  procesarArchivo(file: File): void {
    this.errorImagen = '';

    if (!this.tiposPermitidos.includes(file.type)) {
      this.errorImagen = 'Formato no válido. Solo se permiten imágenes PNG, JPG, JPEG o WEBP.';
      this.cdr.markForCheck();
      return;
    }

    if (file.size > this.maxTamanoBytes) {
      this.errorImagen = 'La imagen supera el tamaño máximo permitido de 5 MB.';
      this.cdr.markForCheck();
      return;
    }

    this.archivoSeleccionado = file;
    this.formulario.controls.fotografia.setValue(file.name);

    this.imagenStorage
      .comprimirImagen(file)
      .then((dataUrl) => {
        this.imagenPreviewUrl = dataUrl;
        this.imagenStorage.guardarImagenLocal('pieza', dataUrl, file.name);
        this.cdr.markForCheck();
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagenPreviewUrl = (e.target?.result as string) ?? null;
          if (this.imagenPreviewUrl) {
            this.imagenStorage.guardarImagenLocal('pieza', this.imagenPreviewUrl, file.name);
          }
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      });
  }

  quitarImagen(): void {
    this.archivoSeleccionado = null;
    this.imagenPreviewUrl = null;
    this.errorImagen = '';
    this.formulario.controls.fotografia.setValue('');
    this.cdr.markForCheck();
  }

  formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  reiniciarFormulario(): void {
    this.publicado = false;
    this.error = '';
    this.formulario.enable();
    this.formulario.reset({
      nombrePieza: '',
      categoriaAparato: '',
      condicionPieza: '',
      tipoTransaccion: 'Venta',
      precio: null,
      datosContacto: '',
      descripcionDetalle: '',
      fotografia: ''
    });
    this.quitarImagen();
  }

  publicar(): void {
    this.error = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();

    const solicitud: CrearPublicacionPiezaRequest = {
      nombrePieza: valores.nombrePieza.trim(),
      categoriaAparato: valores.categoriaAparato.trim(),
      condicionPieza: valores.condicionPieza.trim(),
      tipoTransaccion: valores.tipoTransaccion,
      precio: this.requierePrecio ? valores.precio : null,
      datosContacto: valores.datosContacto.trim(),
      descripcionDetalle: valores.descripcionDetalle.trim() || null,
      fotografia: valores.fotografia.trim() || null
    };

    this.enviando = true;

    this.publicacionService.crearPieza(solicitud)
      .pipe(
        finalize(() => {
          this.enviando = false;
        })
      )
      .subscribe({
        next: (creada) => {
          if (this.imagenPreviewUrl) {
            this.imagenStorage.guardarImagenLocal(
              'pieza',
              this.imagenPreviewUrl,
              this.archivoSeleccionado?.name,
              creada?.id,
              creada?.titulo || valores.nombrePieza
            );
          }
          this.publicado = true;
          this.formulario.disable();
        },
        error: (err) => {
          console.error('[PUBLICAR PIEZA] Error:', err);

          if (err.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          if (err.status === 403) {
            this.router.navigate(['/acceso-denegado']);
            return;
          }

          this.error = err.status === 400
            ? 'Revisa los datos ingresados. El servidor rechazó la solicitud.'
            : 'No fue posible publicar la pieza. Intenta nuevamente.';
        }
      });
  }
}