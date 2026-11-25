import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ItinerarioService } from '../../core/services/itinerario';
import { SessionService } from '../../core/services/session';
import { ItinerarioItem, ProgramarItinerarioRequest } from '../../core/models/itinerario.models';
import { Navbar } from '../../core/components/navbar/navbar';

import { OnlyNumbersDirective } from '../../core/directives/only-numbers.directive';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, OnlyNumbersDirective],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css'
})
export class Agenda implements OnInit {
  private readonly itinerarioService = inject(ItinerarioService);
  private readonly sessionService = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  citas: ItinerarioItem[] = [];
  cargando = true;
  error = '';
  mensajeExito = '';
  incluirCompletadas = false;

  // Modal Programar
  modalAbierto = false;
  guardando = false;
  errorModal = '';
  advertenciaModal = '';

  // Formulario de Cita
  formServicioId = '';
  formFecha = '';
  formHoraInicio = '09:00';
  formHoraFin = '11:00';
  formNotas = '';
  hoy = '';

  get horarioValido(): boolean {
    if (!this.formHoraInicio || !this.formHoraFin) return true;
    return this.formHoraFin > this.formHoraInicio;
  }

  get formValido(): boolean {
    return (
      this.formServicioId.trim().length > 0 &&
      this.formFecha.length > 0 &&
      this.formHoraInicio.length > 0 &&
      this.formHoraFin.length > 0 &&
      this.horarioValido
    );
  }

  get usuarioIdActual(): number | null {
    return this.sessionService.obtenerSesion()?.usuarioId ?? null;
  }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.hoy = today;
    this.formFecha = today;

    this.route.queryParams.subscribe((params) => {
      if (params['servicioId']) {
        this.formServicioId = String(params['servicioId']);
        this.abrirModal();
      }
    });

    this.cargarItinerario();
  }

  cargarItinerario(): void {
    this.cargando = true;
    this.error = '';

    this.itinerarioService
      .obtenerItinerario(this.incluirCompletadas, this.usuarioIdActual ?? undefined)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (items) => {
          this.citas = items ?? [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = 'No fue posible cargar las citas del itinerario.';
          this.cdr.markForCheck();
        }
      });
  }

  cambiarFiltroCompletadas(): void {
    this.incluirCompletadas = !this.incluirCompletadas;
    this.cargarItinerario();
  }

  abrirModal(): void {
    this.modalAbierto = true;
    this.errorModal = '';
    this.advertenciaModal = '';
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarCita(): void {
    if (!this.formServicioId.trim() || !this.formFecha || !this.formHoraInicio || !this.formHoraFin) {
      this.errorModal = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    this.guardando = true;
    this.errorModal = '';
    this.advertenciaModal = '';

    const payload: ProgramarItinerarioRequest = {
      servicioId: this.formServicioId.trim(),
      tecnicoId: String(this.usuarioIdActual ?? 1),
      fecha: this.formFecha,
      horaInicio: this.formHoraInicio,
      horaFinEstimada: this.formHoraFin,
      notas: this.formNotas.trim() || null
    };

    this.itinerarioService
      .programarCita(payload)
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          if (res.advertencia) {
            this.advertenciaModal = res.advertencia;
          }
          this.mensajeExito = '¡Visita agendada correctamente en tu itinerario técnico!';
          this.cerrarModal();
          this.cargarItinerario();
        },
        error: (err) => {
          this.errorModal = err.error?.mensaje || 'No fue posible agendar la cita.';
          this.cdr.markForCheck();
        }
      });
  }

  finalizarCita(cita: ItinerarioItem): void {
    if (cita.esCompletado) return;

    this.itinerarioService.finalizarServicioAgendado(cita.servicioId).subscribe({
      next: () => {
        this.mensajeExito = `El servicio #${cita.servicioId} ha sido marcado como finalizado.`;
        this.cargarItinerario();
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'No fue posible finalizar el servicio.';
        this.cdr.markForCheck();
      }
    });
  }
}
