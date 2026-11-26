
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../services/session';

export const roleGuard: CanActivateFn = (route) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const session = sessionService.obtenerSesion();

  if (!session) {
    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data['roles'] as string[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const userRole = session.rol.toUpperCase();

  if (allowedRoles.map(role => role.toUpperCase()).includes(userRole)) {
    return true;
  }

  return router.createUrlTree(['/acceso-denegado']);
};
