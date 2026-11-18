
import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { AccesoDenegado } from './pages/acceso-denegado/acceso-denegado';
import { Inicio } from './pages/inicio/inicio';
import { Tablon } from './pages/tablon/tablon';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { DetallePublicacion } from './pages/detalle-publicacion/detalle-publicacion';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'registro',
    component: Registro
  },
  {
    path: 'inicio',
    component: Inicio,
    canActivate: [authGuard]
  },
  {
    path: 'acceso-denegado',
    component: AccesoDenegado
  },
  {
    path: 'tablon',
    component: Tablon,
    canActivate: [authGuard]
  },
  {
  path: 'detalle-publicacion/:tipo/:id',
  component: DetallePublicacion,
  canActivate: [authGuard]
},
  {
    path: 'publicar-servicio',
    loadComponent: () =>
      import('./pages/publicar-servicio/publicar-servicio')
        .then(m => m.PublicarServicio),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['CLIENTE']
    }
  },
  {
    path: 'publicar-pieza',
    loadComponent: () =>
      import('./pages/publicar-pieza/publicar-pieza')
        .then(m => m.PublicarPieza),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['TECNICO']
    }
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
