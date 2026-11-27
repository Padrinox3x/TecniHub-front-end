import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
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

  archivoSeleccionado: File | null = null;
  imagenPreviewUrl: string | null = null;
  errorArchivo = '';

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
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.errorArchivo = '';

    if (!file.type.startsWith('image/')) {
      this.errorArchivo = 'Solo se permiten imágenes (PNG, JPG, JPEG, WEBP).';
      this.eliminarArchivo(input);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorArchivo = 'La imagen no debe superar los 5 MB.';
      this.eliminarArchivo(input);
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
        reader.onload = () => {
          this.imagenPreviewUrl = reader.result as string;
          this.imagenStorage.guardarImagenLocal('pieza', this.imagenPreviewUrl, file.name);
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      });
  }

  eliminarArchivo(input?: HTMLInputElement): void {
    this.archivoSeleccionado = null;
    this.imagenPreviewUrl = null;
    this.errorArchivo = '';
    this.formulario.controls.fotografia.setValue('');
    if (input) {
      input.value = '';
    }
    this.cdr.markForCheck();
  }

  formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  publicar(): void {
    this.error = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const imagenDataParaGuardar = this.imagenPreviewUrl;

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
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.publicado = true;
          this.formulario.disable();
          if (imagenDataParaGuardar) {
            const id = res?.id ?? res?.Id ?? res?.ID;
            this.imagenStorage.guardarImagenLocal(
              'pieza',
              imagenDataParaGuardar,
              valores.fotografia,
              id,
              valores.nombrePieza
            );
          }
          this.cdr.markForCheck();
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