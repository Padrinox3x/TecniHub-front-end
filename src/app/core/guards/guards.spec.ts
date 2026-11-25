import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { SessionService } from '../services/session';
import { AuthResponse } from '../models/auth.models';

describe('Pruebas de Navegación y Guards (Auth & Role Guard)', () => {
  let sessionService: SessionService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        {
          provide: Router,
          useValue: {
            createUrlTree: vi.fn((commands: string[]) => ({ toString: () => commands.join('/') } as unknown as UrlTree))
          }
        }
      ]
    });

    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('debe permitir la navegación si el usuario está autenticado', () => {
      vi.spyOn(sessionService, 'estaAutenticado').mockReturnValue(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
      );

      expect(result).toBe(true);
    });

    it('debe redirigir a /login si el usuario no tiene sesión', () => {
      vi.spyOn(sessionService, 'estaAutenticado').mockReturnValue(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).not.toBe(true);
    });
  });

  describe('roleGuard', () => {
    it('debe redirigir a /login si no hay sesión', () => {
      vi.spyOn(sessionService, 'obtenerSesion').mockReturnValue(null);

      const routeMock = { data: { roles: ['TECNICO'] } } as unknown as ActivatedRouteSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(routeMock, {} as RouterStateSnapshot)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(result).not.toBe(true);
    });

    it('debe permitir acceso si el rol del usuario coincide con los roles permitidos', () => {
      const mockSession: AuthResponse = {
        token: 'token',
        expiracion: '2026-12-31',
        usuarioId: 1,
        email: 'tec@test.com',
        rol: 'TECNICO'
      };
      vi.spyOn(sessionService, 'obtenerSesion').mockReturnValue(mockSession);

      const routeMock = { data: { roles: ['TECNICO'] } } as unknown as ActivatedRouteSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(routeMock, {} as RouterStateSnapshot)
      );

      expect(result).toBe(true);
    });

    it('debe redirigir a /acceso-denegado si el rol no tiene permisos', () => {
      const mockSession: AuthResponse = {
        token: 'token',
        expiracion: '2026-12-31',
        usuarioId: 2,
        email: 'cli@test.com',
        rol: 'CLIENTE'
      };
      vi.spyOn(sessionService, 'obtenerSesion').mockReturnValue(mockSession);

      const routeMock = { data: { roles: ['TECNICO'] } } as unknown as ActivatedRouteSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(routeMock, {} as RouterStateSnapshot)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(['/acceso-denegado']);
      expect(result).not.toBe(true);
    });
  });
});
