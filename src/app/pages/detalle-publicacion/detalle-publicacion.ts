import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { TablonService } from '../../core/services/tablon';
import { SessionService } from '../../core/services/session';
import { ResenaService } from '../../core/services/resena';
import { ItinerarioService } from '../../core/services/itinerario';
import { BreadcrumbService } from '../../core/services/breadcrumb';
import { ImagenStorageService } from '../../core/services/imagen-storage';
import { TablonItem } from '../../core/models/tablon.models';
import { ResenaTecnico } from '../../core/models/resena.models';
import { ProgramarItinerarioRequest } from '../../core/models/itinerario.models';

import { Navbar } from '../../core/components/navbar/navbar';

@Component({
  selector: 'app-detalle-publicacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.css'
})
export class DetallePublicacion implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tablonService = inject(TablonService);
  private readonly sessionService = inject(SessionService);
  private readonly resenaService = inject(ResenaService);
  private readonly itinerarioService = inject(ItinerarioService);
  private readonly breadcrumbService = inject(BreadcrumbService, { optional: true });
  private readonly imagenStorage = inject(ImagenStorageService);
  private readonly cdr = inject(ChangeDetectorRef);

  publicacion: TablonItem | null = null;
  resenaExistente: ResenaTecnico | null = null;

  cargando = false;
  accionEnProgreso = false;
  error = '';
  mensajeExito = '';

  // Modal Agendar en Itinerario
  modalAgendarAbierto = false;
  guardandoCita = false;
  errorModalCita = '';
  advertenciaModalCita = '';
  formFecha = '';
  formHoraInicio = '09:00';
  formHoraFin = '11:00';
  formNotas = '';
  hoy = '';

  // Modal Calificación
  modalCalificarAbierto = false;
  calificacionSeleccionada = 5;
  comentarioCalificacion = '';
  enviandoCalificacion = false;
  errorCalificacion = '';

  get esAutenticado(): boolean {
    return this.sessionService.estaAutenticado();
  }

  get rolUsuario(): string {
    return this.sessionService.obtenerRol()?.toUpperCase() ?? '';
  }

  get esTecnico(): boolean {
    return this.rolUsuario === 'TECNICO';
  }

  get esCliente(): boolean {
    return this.rolUsuario === 'CLIENTE';
  }

  get usuarioIdActual(): number | null {
    return this.sessionService.obtenerSesion()?.usuarioId ?? null;
  }

  get puedeAceptarServicio(): boolean {
    if (!this.publicacion || !this.esServicio()) return false;
    const estado = this.publicacion.estado.toUpperCase();
    return this.esTecnico && (estado === 'PENDIENTE' || estado === 'ABIERTO');
  }

  get puedeSolicitarCierre(): boolean {
    if (!this.publicacion || !this.esServicio()) return false;
    const estado = this.publicacion.estado.toUpperCase();
    return this.esTecnico && (estado === 'ENPROCESO' || estado === 'EN_PROCESO');
  }

  get puedeConfirmarCierre(): boolean {
    if (!this.publicacion || !this.esServicio()) return false;
    const estado = this.publicacion.estado.toUpperCase();
    return (
      this.esCliente &&
      (estado.includes('CIERRE') ||
        estado.includes('CONFIRMACION') ||
        estado === 'ENPROCESO' ||
        estado === 'EN_PROCESO')
    );
  }

  get puedeFinalizarPieza(): boolean {
    if (!this.publicacion || this.esServicio()) return false;
    const estado = this.publicacion.estado.toUpperCase();
    return this.esTecnico && !this.publicacion.esCompletado && estado === 'DISPONIBLE';
  }

  get horarioValido(): boolean {
    if (!this.formHoraInicio || !this.formHoraFin) return true;
    return this.formHoraFin > this.formHoraInicio;
  }

  get formCitaValido(): boolean {
    return (
      this.formFecha.length > 0 &&
      this.formHoraInicio.length > 0 &&
      this.formHoraFin.length > 0 &&
      this.horarioValido
    );
  }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.hoy = today;
    this.formFecha = today;
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    const tipo = this.route.snapshot.paramMap.get('tipo')?.toUpperCase();
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.error = '';
    this.mensajeExito = '';
    this.publicacion = null;
    this.resenaExistente = null;

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

    const peticion =
      tipo === 'SERVICIO'
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
          if (respuesta.titulo) {
            this.breadcrumbService?.setUltimoLabel(respuesta.titulo);
          }
          if (this.esServicio() && (respuesta.esCompletado || respuesta.estado.toUpperCase() === 'COMPLETADO')) {
            this.cargarResena(respuesta.id);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error =
            err.status === 404
              ? 'La publicación que buscas no existe o ya no está disponible.'
              : 'No fue posible cargar el detalle de la publicación.';
          this.cdr.markForCheck();
        }
      });
  }

  cargarResena(servicioId: number): void {
    this.resenaService.obtenerResenaServicio(servicioId).subscribe({
      next: (res) => {
        this.resenaExistente = res;
        this.cdr.markForCheck();
      },
      error: () => {
        // Sin reseña registrada aún
      }
    });
  }

  aceptarServicio(): void {
    if (!this.publicacion || this.accionEnProgreso) return;

    this.accionEnProgreso = true;
    this.mensajeExito = '';
    this.error = '';

    this.tablonService
      .aceptarServicio(this.publicacion.id)
      .pipe(finalize(() => {
        this.accionEnProgreso = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (actualizado) => {
          this.publicacion = actualizado;
          this.mensajeExito = '¡Has aceptado este servicio! Se ha asignado a tu perfil.';
          this.abrirModalAgendar();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.mensaje || 'No fue posible aceptar el servicio.';
          this.cdr.markForCheck();
        }
      });
  }

  abrirModalAgendar(): void {
    if (!this.formFecha) {
      this.formFecha = this.hoy || new Date().toISOString().split('T')[0];
    }
    this.modalAgendarAbierto = true;
    this.errorModalCita = '';
    this.advertenciaModalCita = '';
    this.cdr.markForCheck();
  }

  cerrarModalAgendar(): void {
    this.modalAgendarAbierto = false;
    this.cdr.markForCheck();
  }

  guardarCita(): void {
    if (!this.publicacion || !this.formCitaValido) {
      this.errorModalCita = 'Por favor completa todos los campos requeridos con un horario válido.';
      return;
    }

    this.guardandoCita = true;
    this.errorModalCita = '';
    this.advertenciaModalCita = '';

    const payload: ProgramarItinerarioRequest = {
      servicioId: String(this.publicacion.id),
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
          this.guardandoCita = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.cerrarModalAgendar();
          this.mensajeExito = '¡Cita agendada correctamente en tu itinerario técnico!';
          if (res.advertencia) {
            this.mensajeExito += ` (Nota: ${res.advertencia})`;
          }
          this.cargarDetalle();
        },
        error: (err) => {
          this.errorModalCita = err.error?.mensaje || 'No fue posible registrar la cita en tu itinerario.';
          this.cdr.markForCheck();
        }
      });
  }

  solicitarCierre(): void {
    if (!this.publicacion || this.accionEnProgreso) return;

    this.accionEnProgreso = true;
    this.mensajeExito = '';
    this.error = '';

    this.resenaService
      .solicitarCierreServicio(this.publicacion.id, 'Trabajo completado en sitio por el técnico.')
      .pipe(finalize(() => (this.accionEnProgreso = false)))
      .subscribe({
        next: (res) => {
          this.mensajeExito = 'Se ha solicitado el cierre del servicio. El cliente recibirá una notificación para evaluar tu trabajo.';
          this.cargarDetalle();
        },
        error: (err) => {
          this.error = err.error?.mensaje || 'No fue posible solicitar el cierre.';
          this.cdr.markForCheck();
        }
      });
  }

  abrirModalCalificar(): void {
    this.modalCalificarAbierto = true;
    this.errorCalificacion = '';
  }

  cerrarModalCalificar(): void {
    this.modalCalificarAbierto = false;
  }

  seleccionarEstrella(estrellas: number): void {
    this.calificacionSeleccionada = estrellas;
  }

  confirmarCierreYCalificar(): void {
    if (!this.publicacion || this.enviandoCalificacion) return;

    this.enviandoCalificacion = true;
    this.errorCalificacion = '';

    this.resenaService
      .confirmarCierreYCalificar(
        this.publicacion.id,
        this.calificacionSeleccionada,
        this.comentarioCalificacion
      )
      .pipe(finalize(() => (this.enviandoCalificacion = false)))
      .subscribe({
        next: () => {
          this.modalCalificarAbierto = false;
          this.mensajeExito = '¡Servicio confirmado y evaluado exitosamente! Tu calificación ha sido registrada.';
          this.cargarDetalle();
        },
        error: (err) => {
          this.errorCalificacion = err.error?.mensaje || 'Ocurrió un error al registrar la calificación.';
          this.cdr.markForCheck();
        }
      });
  }

  finalizarPieza(): void {
    if (!this.publicacion || this.accionEnProgreso) return;

    this.accionEnProgreso = true;
    this.mensajeExito = '';
    this.error = '';

    this.tablonService
      .finalizarPieza(this.publicacion.id)
      .pipe(finalize(() => (this.accionEnProgreso = false)))
      .subscribe({
        next: (actualizada) => {
          this.publicacion = actualizada;
          this.mensajeExito = 'La refacción se ha marcado como completada / vendida.';
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.mensaje || 'No fue posible finalizar la publicación de pieza.';
          this.cdr.markForCheck();
        }
      });
  }

  abrirChat(): void {
    if (!this.publicacion) return;
    const tipo = this.esServicio() ? 'servicio' : 'pieza';
    this.router.navigate(['/chat'], {
      queryParams: { tipo, id: this.publicacion.id }
    });
  }

  agendarCita(): void {
    if (!this.publicacion) return;
    this.abrirModalAgendar();
  }

  esServicio(): boolean {
    return this.publicacion?.tipoPublicacion === 'SERVICIO';
  }

  obtenerEtiquetaTipo(): string {
    return this.esServicio() ? 'Servicio de reparación' : 'Pieza o refacción';
  }

  obtenerEtiquetaEstado(): string {
    return (
      this.publicacion?.textoIndicador ||
      this.publicacion?.estado ||
      'Sin estado'
    );
  }

  obtenerImagenDetalle(): string {
    if (!this.publicacion) return '';
    return this.imagenStorage.obtenerImagen(
      this.publicacion.tipoPublicacion,
      this.publicacion.imagenUrl,
      this.publicacion.id,
      this.publicacion.titulo
    );
  }

  onImagenError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.esServicio()
        ? 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=85'
        : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=85';
    }
  }
}
