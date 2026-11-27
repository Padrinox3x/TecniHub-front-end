import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Chat } from './chat';
import { ChatService } from '../../core/services/chat';
import { SessionService } from '../../core/services/session';
import { ConversacionResumen, Mensaje } from '../../core/models/chat.models';

describe('Chat Component', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;
  let chatServiceMock: {
    obtenerMisConversaciones: ReturnType<typeof vi.fn>;
    obtenerMensajesServicio: ReturnType<typeof vi.fn>;
    enviarMensajeServicio: ReturnType<typeof vi.fn>;
    obtenerMensajesPieza: ReturnType<typeof vi.fn>;
    enviarMensajePieza: ReturnType<typeof vi.fn>;
  };

  const conversacionesMock: ConversacionResumen[] = [
    {
      id: 'srv-10',
      tipoContexto: 'SERVICIO',
      contextoId: 10,
      tituloContexto: 'Reparación de refrigerador',
      estadoContexto: 'EnProceso',
      clienteUsuarioId: 1,
      clienteNombre: 'Carlos Cliente',
      tecnicoUsuarioId: 2,
      tecnicoNombre: 'Mario Técnico',
      ultimaActividad: '2026-11-27T10:00:00Z',
      ultimoMensaje: 'Hola, ¿a qué hora puedes pasar?',
      totalMensajes: 2
    },
    {
      id: 'srv-11',
      tipoContexto: 'SERVICIO',
      contextoId: 11,
      tituloContexto: 'Lavadora no centrifuga',
      estadoContexto: 'EnProceso',
      clienteUsuarioId: 1,
      clienteNombre: 'Carlos Cliente',
      tecnicoUsuarioId: 3,
      tecnicoNombre: 'Luis Técnico',
      ultimaActividad: '2026-11-27T09:00:00Z',
      ultimoMensaje: null,
      totalMensajes: 0
    }
  ];

  const mensajesSrv10: Mensaje[] = [
    {
      id: 2,
      conversacionId: 'srv-10',
      emisorId: 2,
      emisorNombre: 'Mario Técnico',
      emisorRol: 'TECNICO',
      contenido: 'Puedo pasar a las 4 PM',
      enviadoAt: '2026-11-27T10:05:00Z',
      horaFormateada: 'Hoy, 10:05 AM',
      esMio: false
    },
    {
      id: 1,
      conversacionId: 'srv-10',
      emisorId: 1,
      emisorNombre: 'Carlos Cliente',
      emisorRol: 'CLIENTE',
      contenido: 'Hola, ¿a qué hora puedes pasar?',
      enviadoAt: '2026-11-27T10:00:00Z',
      horaFormateada: 'Hoy, 10:00 AM',
      esMio: true
    }
  ];

  beforeEach(async () => {
    chatServiceMock = {
      obtenerMisConversaciones: vi.fn().mockReturnValue(of(conversacionesMock)),
      obtenerMensajesServicio: vi.fn().mockImplementation((id: number) =>
        id === 10 ? of(mensajesSrv10) : of([])
      ),
      enviarMensajeServicio: vi.fn().mockImplementation((id: number, contenido: string) =>
        of({
          id: 3,
          conversacionId: `srv-${id}`,
          emisorId: 1,
          emisorNombre: 'Carlos Cliente',
          emisorRol: 'CLIENTE',
          contenido,
          enviadoAt: '2026-11-27T10:10:00Z',
          horaFormateada: 'Hoy, 10:10 AM',
          esMio: true
        })
      ),
      obtenerMensajesPieza: vi.fn().mockReturnValue(of([])),
      enviarMensajePieza: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [
        provideRouter([]),
        { provide: ChatService, useValue: chatServiceMock },
        {
          provide: SessionService,
          useValue: {
            obtenerSesion: () => ({
              token: 'jwt-test',
              expiracion: '2099-01-01T00:00:00Z',
              usuarioId: 1,
              email: 'cliente@test.com',
              rol: 'CLIENTE'
            }),
            estaAutenticado: () => true,
            obtenerRol: () => 'CLIENTE'
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('debe crearse y ordenar cronológicamente los mensajes sin duplicados', () => {
    expect(component).toBeTruthy();
    expect(component.mensajes.length).toBe(2);
    expect(component.mensajes[0].id).toBe(1);
    expect(component.mensajes[1].id).toBe(2);
    expect(component.esMensajeMio(component.mensajes[0])).toBe(true);
    expect(component.esMensajeMio(component.mensajes[1])).toBe(false);
  });

  it('debe limpiar mensajes al cambiar de conversación para no mezclar historiales', () => {
    component.seleccionarConversacion(conversacionesMock[1]);
    fixture.detectChanges();
    expect(component.conversacionActiva?.id).toBe('srv-11');
    expect(component.mensajes.length).toBe(0);
  });

  it('debe enviar un mensaje y agregarlo al final sin duplicar', () => {
    component.nuevoMensaje = 'Perfecto, te espero';
    component.enviar();
    expect(chatServiceMock.enviarMensajeServicio).toHaveBeenCalledWith(10, 'Perfecto, te espero');
    expect(component.nuevoMensaje).toBe('');
    expect(component.mensajes.length).toBe(3);
    expect(component.mensajes[2].contenido).toBe('Perfecto, te espero');
  });

  it('debe identificar el rol real del usuario autenticado en mensajes propios aunque el backend devuelva otro rol', () => {
    const mensajeMalEtiquetado: Mensaje = {
      id: 99,
      conversacionId: 'pie-4-5',
      emisorId: 1,
      emisorNombre: 'Carlos Cliente',
      emisorRol: 'TECNICO',
      contenido: 'hola',
      enviadoAt: '2026-11-27T10:15:00Z',
      horaFormateada: 'Hoy, 10:15 AM',
      esMio: true
    };
    expect(component.esMensajeMio(mensajeMalEtiquetado)).toBe(true);
    expect(component.obtenerRolVisualMensaje(mensajeMalEtiquetado)).toBe('CLIENTE');
  });
});
