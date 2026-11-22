import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PublicacionService } from '../../core/services/publicacion';
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
  private readonly router = inject(Router);

  enviando = false;
  publicado = false;
  error = '';

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
        next: () => {
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