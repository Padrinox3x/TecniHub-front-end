
import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PublicacionService } from '../../core/services/publicacion';
import { ImagenStorageService } from '../../core/services/imagen-storage';
import { CrearPublicacionServicioRequest } from '../../core/models/publicacion.models';
const textoObligatorio = Validators.pattern(/\S/);

import { Navbar } from '../../core/components/navbar/navbar';

@Component({
  selector: 'app-publicar-servicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Navbar],
  templateUrl: './publicar-servicio.html',
  styleUrl: './publicar-servicio.css'
})
export class PublicarServicio {
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
    titulo: ['', [
      Validators.required,
      Validators.maxLength(150)
    ]],
    tipoElectrodomestico: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],
    descripcionFalla: ['', [
      Validators.required,
      Validators.maxLength(1000)
    ]],
    ubicacionAproximada: ['', [
      Validators.required,
      Validators.maxLength(255)
    ]],
    imagenReferencia: ['', [
      Validators.maxLength(500)
    ]]
  });

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
    this.formulario.controls.imagenReferencia.setValue(file.name);

    this.imagenStorage
      .comprimirImagen(file)
      .then((dataUrl) => {
        this.imagenPreviewUrl = dataUrl;
        this.imagenStorage.guardarImagenLocal('servicio', dataUrl, file.name);
        this.cdr.markForCheck();
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagenPreviewUrl = reader.result as string;
          this.imagenStorage.guardarImagenLocal('servicio', this.imagenPreviewUrl, file.name);
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      });
  }

  eliminarArchivo(input?: HTMLInputElement): void {
    this.archivoSeleccionado = null;
    this.imagenPreviewUrl = null;
    this.errorArchivo = '';
    this.formulario.controls.imagenReferencia.setValue('');
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

    const solicitud: CrearPublicacionServicioRequest = {
      titulo: valores.titulo.trim(),
      tipoElectrodomestico: valores.tipoElectrodomestico.trim(),
      descripcionFalla: valores.descripcionFalla.trim(),
      ubicacionAproximada: valores.ubicacionAproximada.trim(),
      imagenReferencia: valores.imagenReferencia.trim() || null
    };

    this.enviando = true;

    this.publicacionService.crearServicio(solicitud)
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
              'servicio',
              imagenDataParaGuardar,
              valores.imagenReferencia,
              id,
              valores.titulo
            );
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[PUBLICAR SERVICIO] Error:', err);

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
            : 'No fue posible publicar el servicio. Intenta nuevamente.';
        }
      });
  }
}
