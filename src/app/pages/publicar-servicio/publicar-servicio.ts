
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
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

  // Carga de imagen desde archivo
  archivoSeleccionado: File | null = null;
  imagenPreviewUrl: string | null = null;
  errorImagen = '';
  arrastrando = false;
  readonly tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];
  readonly maxTamanoBytes = 5 * 1024 * 1024; // 5 MB

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
        reader.onload = (e) => {
          this.imagenPreviewUrl = (e.target?.result as string) ?? null;
          if (this.imagenPreviewUrl) {
            this.imagenStorage.guardarImagenLocal('servicio', this.imagenPreviewUrl, file.name);
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
    this.formulario.controls.imagenReferencia.setValue('');
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
      titulo: '',
      tipoElectrodomestico: '',
      descripcionFalla: '',
      ubicacionAproximada: '',
      imagenReferencia: ''
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
        })
      )
      .subscribe({
        next: (creada) => {
          if (this.imagenPreviewUrl) {
            this.imagenStorage.guardarImagenLocal(
              'servicio',
              this.imagenPreviewUrl,
              this.archivoSeleccionado?.name,
              creada?.id,
              creada?.titulo || valores.titulo
            );
          }
          this.publicado = true;
          this.formulario.disable();
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
