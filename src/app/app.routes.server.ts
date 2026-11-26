import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'detalle-publicacion/:tipo/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'perfil/tecnico/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'perfil/cliente/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'perfil-publico/:id',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
