import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Navbar } from './navbar';
import { SessionService } from '../../services/session';
import { NotificacionesService } from '../../services/notificaciones';

describe('Navbar Component', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let sessionServiceMock: {
    obtenerSesion: ReturnType<typeof vi.fn>;
    obtenerRol: ReturnType<typeof vi.fn>;
    estaAutenticado: ReturnType<typeof vi.fn>;
    cerrarSesion: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    sessionServiceMock = {
      obtenerSesion: vi.fn().mockReturnValue({
        token: 'fake-jwt',
        expiracion: '2027-01-01T00:00:00Z',
        usuarioId: 6,
        email: 'demonioextra@gmail.com',
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
      imports: [Navbar],
      providers: [
        provideRouter([
          { path: 'login', component: class DummyLogin {} },
          { path: 'perfil/cliente/:id', component: class DummyCliente {} },
          { path: 'perfil/tecnico/:id', component: class DummyTecnico {} }
        ]),
        { provide: SessionService, useValue: sessionServiceMock },
        { provide: NotificacionesService, useValue: notificacionesMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('debe generar rutaPerfil de cliente para usuarios CLIENTE', () => {
    expect(component.rutaPerfil).toEqual(['/perfil', 'cliente', '6']);
    expect(component.inicial).toBe('D');
  });

  it('debe generar rutaPerfil de técnico para usuarios TECNICO', () => {
    sessionServiceMock.obtenerRol.mockReturnValue('TECNICO');
    sessionServiceMock.obtenerSesion.mockReturnValue({
      token: 'fake-jwt',
      expiracion: '2027-01-01T00:00:00Z',
      usuarioId: 2,
      email: 'tecnico@gmail.com',
      rol: 'TECNICO'
    });

    expect(component.rutaPerfil).toEqual(['/perfil', 'tecnico', '2']);
  });

  it('el pill de usuario debe enlazar al perfil y no cerrar sesión, mientras el botón logout sí cierra sesión', () => {
    const pill: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.user-profile-pill');
    const logoutBtn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.logout-btn');

    expect(pill).toBeTruthy();
    expect(pill?.getAttribute('href')).toContain('/perfil/cliente/6');

    pill?.click();
    expect(sessionServiceMock.cerrarSesion).not.toHaveBeenCalled();

    logoutBtn?.click();
    expect(sessionServiceMock.cerrarSesion).toHaveBeenCalledTimes(1);
  });
});
