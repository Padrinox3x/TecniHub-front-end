
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PublicacionService } from '../../core/services/publicacion';
import { CrearPublicacionServicioRequest } from '../../core/models/publicacion.models';
const textoObligatorio = Validators.pattern(/\S/);

@Component({
  selector: 'app-publicar-servicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './publicar-servicio.html',
  styleUrl: './publicar-servicio.css'
})
export class PublicarServicio {
  private readonly fb = inject(FormBuilder);
  private readonly publicacionService = inject(PublicacionService);
  private readonly router = inject(Router);

  enviando = false;
  publicado = false;
  error = '';

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
  Validators.maxLength(500),
  Validators.pattern(/^https?:\/\/.+/i)
]]
  });

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
        next: () => {
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
