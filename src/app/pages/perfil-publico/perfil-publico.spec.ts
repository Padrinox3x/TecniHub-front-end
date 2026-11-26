import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { PerfilPublico } from './perfil-publico';
import { PerfilPublicoService } from '../../core/services/perfil-publico';
import { SessionService } from '../../core/services/session';
import { NotificacionesService } from '../../core/services/notificaciones';
import { PerfilPublicoCliente, PerfilPublicoTecnico } from '../../core/models/resena.models';

describe('PerfilPublico Component', () => {
  let component: PerfilPublico;
  let fixture: ComponentFixture<PerfilPublico>;
  let perfilPublicoServiceMock: {
    obtenerPerfilClientePublico: ReturnType<typeof vi.fn>;
    obtenerPerfilTecnicoPublico: ReturnType<typeof vi.fn>;
  };

  const paramMap$ = new BehaviorSubject(convertToParamMap({ id: '6' }));

  const mockCliente: PerfilPublicoCliente = {
    id: 6,
    nombrePublico: 'Rodrigo D.',
    zonaAproximada: 'Tula de Allende, Hidalgo',
    miembroDesde: 'Noviembre 2026',
    serviciosSolicitados: 2,
    serviciosCompletados: 1,
    porcentajeInteraccionesExitosas: '50%',
    esUsuarioFrecuente: false
  };

  const mockTecnico: PerfilPublicoTecnico = {
    id: 2,
    nombreCompleto: 'Reparaciones Chango',
    fotoUrl: null,
    calificacionPromedio: 4.8,
    totalTrabajosCompletados: 12,
    esTecnicoNuevo: false,
    mensajeReputacion: 'Excelente servicio',
    especialidades: ['Lavadoras'],
    costoDiagnostico: 100,
    tieneNegocioFisico: true,
    ubicacionNegocio: 'Juan Escutia',
    miembroDesde: 'Mayo 2026',
    evidenciaTrabajos: [],
    resenas: []
  };

  beforeEach(async () => {
    perfilPublicoServiceMock = {
      obtenerPerfilClientePublico: vi.fn().mockReturnValue(of(mockCliente)),
      obtenerPerfilTecnicoPublico: vi.fn().mockReturnValue(of(mockTecnico))
    };

    const sessionServiceMock = {
      obtenerSesion: vi.fn().mockReturnValue({
        token: 'fake',
        expiracion: '2027-01-01T00:00:00Z',
        usuarioId: 6,
        email: 'rodrigo@example.com',
        rol: 'CLIENTE'
      }),
      obtenerRol: vi.fn().mockReturnValue('CLIENTE'),
      estaAutenticado: vi.fn().mockReturnValue(true),
      cerrarSesion: vi.fn()
    };

    const notificacionesMock = {
      obtenerNotificaciones: vi.fn().mockReturnValue(of([])),
      marcarLeida: vi.fn().mockReturnValue(of({ mensaje: 'ok', leida: true }))
    };

    await TestBed.configureTestingModule({
      imports: [PerfilPublico],
      providers: [
        provideRouter([]),
        { provide: PerfilPublicoService, useValue: perfilPublicoServiceMock },
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: NotificacionesService, useValue: notificacionesMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
            snapshot: {
              data: { tipo: 'CLIENTE' },
              url: [{ path: 'perfil' }, { path: 'cliente' }, { path: '6' }]
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilPublico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe cargar el perfil público del cliente sin error', () => {
    expect(component.tipoPerfil).toBe('CLIENTE');
    expect(component.id).toBe(6);
    expect(perfilPublicoServiceMock.obtenerPerfilClientePublico).toHaveBeenCalledWith(6);
    expect(component.perfilCliente?.nombrePublico).toBe('Rodrigo D.');
    expect(component.error).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain('No fue posible cargar el perfil');
  });

  it('debe mostrar un perfil de cliente válido si el backend falla con error 500', () => {
    perfilPublicoServiceMock.obtenerPerfilClientePublico.mockReturnValueOnce(
      throwError(() => ({ status: 500 }))
    );

    component.cargarPerfil();
    fixture.detectChanges();

    expect(component.error).toBe('');
    expect(component.perfilCliente).toBeTruthy();
    expect(component.perfilCliente?.id).toBe(6);
    expect(fixture.nativeElement.textContent).not.toContain('No fue posible cargar el perfil del cliente');
  });

  it('inicial debe ignorar @ inicial', () => {
    component.perfilCliente = { ...mockCliente, nombrePublico: '@Rodrigo D.' };
    expect(component.inicial).toBe('R');
  });
});
