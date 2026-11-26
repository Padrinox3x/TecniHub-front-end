
import { inject } from '@angular/core';
import {
  HttpInterceptorFn
} from '@angular/common/http';

import { SessionService } from '../services/session';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);

  const token = sessionService.obtenerToken();

  // Solo adjuntar el JWT a las peticiones de nuestra API.
  const isApiRequest = req.url.startsWith(
    'https://d2c9vof7dxdez3.cloudfront.net/api/'
  );

  if (!token || !isApiRequest) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authenticatedRequest);
};
