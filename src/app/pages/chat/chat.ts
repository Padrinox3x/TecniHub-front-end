import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  isDevMode,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';

import { ChatService } from '../../core/services/chat';
import { SessionService } from '../../core/services/session';
import { ConversacionResumen, Mensaje } from '../../core/models/chat.models';
import { Navbar } from '../../core/components/navbar/navbar';

export interface MensajeConSeparador extends Mensaje {
  separadorFecha?: string | null;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  private readonly chatService = inject(ChatService);
  private readonly sessionService = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  conversaciones: ConversacionResumen[] = [];
  conversacionActiva: ConversacionResumen | null = null;
  mensajes: MensajeConSeparador[] = [];

  nuevoMensaje = '';
  cargandoConversaciones = true;
  cargandoMensajes = false;
  enviando = false;
  error = '';
  errorEnvio = '';

  // Vista en móvil: permite alternar entre lista de conversaciones y sala activa
  mostrarListaEnMovil = true;

  // Polling para mensajes y conversaciones
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private queryParamsSub?: Subscription;
  private mensajesSub?: Subscription;
  private conversacionesSub?: Subscription;
  private cargandoSondeo = false;

  // Contexto directo desde query params (si se abrió desde una publicación o notificación)
  tipoContextoDirecto: string | null = null;
  contextoIdDirecto: number | null = null;

  get usuarioIdActual(): number | null {
    return this.sessionService.obtenerSesion()?.usuarioId ?? null;
  }

  get rolUsuarioActual(): string {
    return this.sessionService.obtenerRol()?.toUpperCase() ?? '';
  }

  private get claveContextoActual(): string {
    return `${this.tipoContextoDirecto ?? ''}_${this.contextoIdDirecto ?? ''}`;
  }

  ngOnInit(): void {
    this.queryParamsSub = this.route.queryParams.subscribe((params) => {
      this.error = '';
      this.errorEnvio = '';

      if (params['tipo'] && params['id']) {
        const nuevoTipo = String(params['tipo']).toUpperCase();
        const nuevoId = Number(params['id']);
        const cambioContexto =
          nuevoTipo !== this.tipoContextoDirecto || nuevoId !== this.contextoIdDirecto;

        this.tipoContextoDirecto = nuevoTipo;
        this.contextoIdDirecto = nuevoId;
        this.mostrarListaEnMovil = false;

        if (cambioContexto) {
          this.mensajes = [];
          this.conversacionActiva = null;
        }
      } else {
        this.tipoContextoDirecto = null;
        this.contextoIdDirecto = null;
      }

      this.cargarConversaciones();
    });

    // Sondeo cada 4 segundos para mensajes nuevos y lista de conversaciones
    this.intervalId = setInterval(() => {
      this.refrescarConversacionesSilencioso();
      if ((this.conversacionActiva || this.contextoIdDirecto) && !this.enviando) {
        this.cargarMensajes(true);
      }
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.queryParamsSub?.unsubscribe();
    this.mensajesSub?.unsubscribe();
    this.conversacionesSub?.unsubscribe();
  }

  cargarConversaciones(): void {
    this.cargandoConversaciones = true;
    this.conversacionesSub?.unsubscribe();
    this.conversacionesSub = this.chatService
      .obtenerMisConversaciones()
      .pipe(
        finalize(() => {
          this.cargandoConversaciones = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.conversaciones = res ?? [];

          if (isDevMode()) {
            console.debug('[CHAT] Conversaciones cargadas', {
              usuarioIdActual: this.usuarioIdActual,
              rolUsuarioActual: this.rolUsuarioActual,
              conversaciones: this.conversaciones.map((c) => ({
                id: c.id,
                tipoContexto: c.tipoContexto,
                contextoId: c.contextoId,
                clienteUsuarioId: c.clienteUsuarioId,
                tecnicoUsuarioId: c.tecnicoUsuarioId,
                totalMensajes: c.totalMensajes
              }))
            });
          }

          if (this.contextoIdDirecto && this.tipoContextoDirecto) {
            const encontrada = this.conversaciones.find(
              (c) =>
                c.contextoId === this.contextoIdDirecto &&
                c.tipoContexto.toUpperCase() === this.tipoContextoDirecto
            );
            if (encontrada) {
              this.seleccionarConversacion(encontrada);
            } else {
              this.cargarMensajes(false);
            }
          } else if (this.conversaciones.length > 0 && !this.conversacionActiva) {
            this.seleccionarConversacion(this.conversaciones[0], false);
          }

          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'No fue posible cargar las conversaciones.';
          this.cdr.markForCheck();
        }
      });
  }

  seleccionarConversacion(c: ConversacionResumen, abrirEnMovil = true): void {
    const cambio =
      this.conversacionActiva?.id !== c.id ||
      this.contextoIdDirecto !== c.contextoId ||
      this.tipoContextoDirecto !== c.tipoContexto.toUpperCase();

    this.conversacionActiva = c;
    this.tipoContextoDirecto = c.tipoContexto.toUpperCase();
    this.contextoIdDirecto = c.contextoId;
    this.error = '';
    this.errorEnvio = '';

    if (abrirEnMovil) {
      this.mostrarListaEnMovil = false;
    }

    if (cambio || this.mensajes.length === 0) {
      this.mensajes = [];
      this.cargarMensajes(false);
    }
  }

  volverAListaMovil(): void {
    this.mostrarListaEnMovil = true;
    this.cdr.markForCheck();
  }

  cargarMensajes(esSondeo = false): void {
    if (!this.tipoContextoDirecto || !this.contextoIdDirecto) return;
    if (esSondeo && (this.cargandoSondeo || this.enviando)) return;

    const clavePeticion = this.claveContextoActual;

    if (esSondeo) {
      this.cargandoSondeo = true;
    } else {
      this.mensajesSub?.unsubscribe();
      this.cargandoMensajes = true;
      this.cdr.markForCheck();
    }

    const estabaCercaDelFinal = this.estaCercaDelFinal();

    const peticion =
      this.tipoContextoDirecto === 'SERVICIO'
        ? this.chatService.obtenerMensajesServicio(this.contextoIdDirecto)
        : this.chatService.obtenerMensajesPieza(this.contextoIdDirecto);

    this.mensajesSub = peticion
      .pipe(
        finalize(() => {
          if (esSondeo) {
            this.cargandoSondeo = false;
          } else {
            this.cargandoMensajes = false;
            this.cdr.markForCheck();
          }
        })
      )
      .subscribe({
        next: (msgs) => {
          // Evitar mezclar mensajes si el usuario cambió de conversación durante la petición
          if (clavePeticion !== this.claveContextoActual) {
            return;
          }

          const listaSegura = Array.isArray(msgs) ? msgs : [];
          if (isDevMode() && !esSondeo) {
            console.debug('[CHAT] Historial recuperado', {
              usuarioId: this.usuarioIdActual,
              rolUsuario: this.rolUsuarioActual,
              conversacionSeleccionadaId: this.conversacionActiva?.id ?? null,
              contexto: clavePeticion,
              totalMensajes: listaSegura.length,
              mensajes: listaSegura.map((m) => ({
                id: m.id,
                conversacionId: m.conversacionId,
                emisorId: m.emisorId,
                emisorRol: m.emisorRol,
                esMio: m.esMio
              }))
            });
          }

          const anteriorTotal = this.mensajes.length;
          const ordenados = this.ordenarYFormatearMensajes(listaSegura);
          this.mensajes = ordenados;
          this.cdr.markForCheck();

          if (!esSondeo) {
            this.scrollToBottom();
          } else if (ordenados.length > anteriorTotal && estabaCercaDelFinal) {
            this.scrollToBottom();
          }
        },
        error: () => {
          if (!esSondeo && clavePeticion === this.claveContextoActual) {
            this.error = 'No fue posible obtener los mensajes de esta conversación.';
            this.cdr.markForCheck();
          }
        }
      });
  }

  private refrescarConversacionesSilencioso(): void {
    this.chatService.obtenerMisConversaciones().subscribe({
      next: (res) => {
        this.conversaciones = res ?? [];
        if (this.contextoIdDirecto && this.tipoContextoDirecto) {
          const encontrada = this.conversaciones.find(
            (c) =>
              c.contextoId === this.contextoIdDirecto &&
              c.tipoContexto.toUpperCase() === this.tipoContextoDirecto
          );
          if (encontrada) {
            this.conversacionActiva = encontrada;
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        // Silenciar errores transitorios durante el sondeo
      }
    });
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) {
      return;
    }
    keyboardEvent.preventDefault();
    this.enviar();
  }

  enviar(): void {
    const texto = this.nuevoMensaje.trim();
    if (!texto || this.enviando) return;
    if (!this.tipoContextoDirecto || !this.contextoIdDirecto) return;

    this.enviando = true;
    this.errorEnvio = '';
    const claveEnvio = this.claveContextoActual;

    const peticion =
      this.tipoContextoDirecto === 'SERVICIO'
        ? this.chatService.enviarMensajeServicio(this.contextoIdDirecto, texto)
        : this.chatService.enviarMensajePieza(this.contextoIdDirecto, texto);

    peticion
      .pipe(
        finalize(() => {
          this.enviando = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (msg) => {
          if (claveEnvio !== this.claveContextoActual) return;

          this.nuevoMensaje = '';
          const sinDuplicado = this.mensajes.filter((m) => m.id !== msg.id);
          this.mensajes = this.ordenarYFormatearMensajes([...sinDuplicado, msg]);
          this.cdr.markForCheck();
          this.scrollToBottom();
          this.refrescarConversacionesSilencioso();
        },
        error: (err) => {
          this.errorEnvio = err.error?.mensaje || 'No fue posible enviar el mensaje. Intenta nuevamente.';
          this.cdr.markForCheck();
        }
      });
  }

  esMensajeMio(msg: Mensaje): boolean {
    if (this.usuarioIdActual !== null) {
      return msg.emisorId === this.usuarioIdActual;
    }
    return Boolean(msg.esMio);
  }

  obtenerRolVisualMensaje(msg: Mensaje): string {
    if (this.esMensajeMio(msg) && this.rolUsuarioActual) {
      return this.rolUsuarioActual;
    }
    return msg.emisorRol;
  }

  obtenerNombreContraparte(c: ConversacionResumen): string {
    const miId = this.usuarioIdActual;
    if (c.clienteUsuarioId === miId) {
      return c.tecnicoNombre || 'Técnico asignado';
    }
    return c.clienteNombre || 'Cliente';
  }

  obtenerRolContraparte(c: ConversacionResumen): string {
    const miId = this.usuarioIdActual;
    return c.clienteUsuarioId === miId ? 'Técnico' : 'Cliente';
  }

  obtenerInicialContraparte(c: ConversacionResumen): string {
    const nombre = this.obtenerNombreContraparte(c).replace(/^@+/, '').trim();
    return nombre ? nombre.charAt(0).toUpperCase() : 'U';
  }

  private ordenarYFormatearMensajes(lista: Mensaje[]): MensajeConSeparador[] {
    const unicos = new Map<number, Mensaje>();
    for (const item of lista) {
      unicos.set(item.id, item);
    }

    const ordenados = Array.from(unicos.values()).sort((a, b) => {
      const timeA = new Date(a.enviadoAt).getTime();
      const timeB = new Date(b.enviadoAt).getTime();
      if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) {
        return timeA - timeB;
      }
      return a.id - b.id;
    });

    let ultimaFechaClave = '';
    return ordenados.map((msg) => {
      const claveFecha = this.obtenerClaveFecha(msg.enviadoAt);
      let separadorFecha: string | null = null;
      if (claveFecha && claveFecha !== ultimaFechaClave) {
        separadorFecha = this.formatearSeparadorFecha(msg.enviadoAt);
        ultimaFechaClave = claveFecha;
      }
      return { ...msg, separadorFecha };
    });
  }

  private obtenerClaveFecha(fechaIso?: string): string {
    if (!fechaIso) return '';
    const d = new Date(fechaIso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  private formatearSeparadorFecha(fechaIso: string): string {
    const d = new Date(fechaIso);
    if (Number.isNaN(d.getTime())) return '';
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    if (this.obtenerClaveFecha(fechaIso) === `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`) {
      return 'Hoy';
    }
    if (this.obtenerClaveFecha(fechaIso) === `${ayer.getFullYear()}-${ayer.getMonth()}-${ayer.getDate()}`) {
      return 'Ayer';
    }
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private estaCercaDelFinal(): boolean {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 90;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 60);
  }
}
