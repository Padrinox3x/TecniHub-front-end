import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ChatService } from '../../core/services/chat';
import { SessionService } from '../../core/services/session';
import { ConversacionResumen, Mensaje } from '../../core/models/chat.models';
import { Navbar } from '../../core/components/navbar/navbar';

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
  mensajes: Mensaje[] = [];

  nuevoMensaje = '';
  cargandoConversaciones = true;
  cargandoMensajes = false;
  enviando = false;
  error = '';

  // Polling para mensajes en tiempo real
  private intervalId: any = null;

  // Contexto directo desde query params (si se abrió desde una publicación)
  tipoContextoDirecto: string | null = null;
  contextoIdDirecto: number | null = null;

  get usuarioIdActual(): number | null {
    return this.sessionService.obtenerSesion()?.usuarioId ?? null;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['tipo'] && params['id']) {
        this.tipoContextoDirecto = params['tipo'].toUpperCase();
        this.contextoIdDirecto = Number(params['id']);
      }
      this.cargarConversaciones();
    });

    // Iniciar sondeo suave cada 4 segundos
    this.intervalId = setInterval(() => {
      if (this.conversacionActiva || this.contextoIdDirecto) {
        this.cargarMensajes(true);
      }
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  cargarConversaciones(): void {
    this.cargandoConversaciones = true;
    this.chatService
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

          // Si venimos con query params, intentar encontrar la conversación
          if (this.contextoIdDirecto && this.tipoContextoDirecto) {
            const encontrada = this.conversaciones.find(
              (c) =>
                c.contextoId === this.contextoIdDirecto &&
                c.tipoContexto.toUpperCase() === this.tipoContextoDirecto
            );
            if (encontrada) {
              this.seleccionarConversacion(encontrada);
            } else {
              // Cargar mensajes directamente para este contexto
              this.cargarMensajesDirectos();
            }
          } else if (this.conversaciones.length > 0 && !this.conversacionActiva) {
            this.seleccionarConversacion(this.conversaciones[0]);
          }

          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'No fue posible cargar las conversaciones.';
          this.cdr.markForCheck();
        }
      });
  }

  seleccionarConversacion(c: ConversacionResumen): void {
    this.conversacionActiva = c;
    this.tipoContextoDirecto = c.tipoContexto.toUpperCase();
    this.contextoIdDirecto = c.contextoId;
    this.cargarMensajes();
  }

  cargarMensajes(esSondeo = false): void {
    if (!this.tipoContextoDirecto || !this.contextoIdDirecto) return;

    if (!esSondeo) {
      this.cargandoMensajes = true;
      this.cdr.markForCheck();
    }

    const peticion =
      this.tipoContextoDirecto === 'SERVICIO'
        ? this.chatService.obtenerMensajesServicio(this.contextoIdDirecto)
        : this.chatService.obtenerMensajesPieza(this.contextoIdDirecto);

    peticion
      .pipe(
        finalize(() => {
          if (!esSondeo) {
            this.cargandoMensajes = false;
            this.cdr.markForCheck();
            this.scrollToBottom();
          }
        })
      )
      .subscribe({
        next: (msgs) => {
          const anteriorTotal = this.mensajes.length;
          this.mensajes = msgs ?? [];
          this.cdr.markForCheck();
          if (this.mensajes.length > anteriorTotal) {
            this.scrollToBottom();
          }
        },
        error: () => {
          if (!esSondeo) {
            this.error = 'Error al obtener mensajes.';
            this.cdr.markForCheck();
          }
        }
      });
  }

  private cargarMensajesDirectos(): void {
    this.cargarMensajes(false);
  }

  enviar(): void {
    const texto = this.nuevoMensaje.trim();
    if (!texto || this.enviando) return;
    if (!this.tipoContextoDirecto || !this.contextoIdDirecto) return;

    this.enviando = true;
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
          this.nuevoMensaje = '';
          this.mensajes.push(msg);
          this.cdr.markForCheck();
          this.scrollToBottom();
          // Actualizar lista de conversaciones
          this.chatService.obtenerMisConversaciones().subscribe((res) => {
            this.conversaciones = res ?? [];
            this.cdr.markForCheck();
          });
        },
        error: (err) => {
          this.error = err.error?.mensaje || 'No fue posible enviar el mensaje.';
          this.cdr.markForCheck();
        }
      });
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

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
