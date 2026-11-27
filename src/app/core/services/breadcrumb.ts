import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { BreadcrumbItem } from '../models/breadcrumb.models';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  readonly breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  constructor() {
    this.actualizarDesdeRuta(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.actualizarDesdeRuta(event.urlAfterRedirects || event.url);
      });
  }

  setBreadcrumbs(items: BreadcrumbItem[]): void {
    this.breadcrumbsSubject.next(items);
  }

  setUltimoLabel(label: string): void {
    const limpio = label?.trim();
    if (!limpio) return;
    const actuales = this.breadcrumbsSubject.value;
    if (actuales.length === 0) return;

    const actualizados = actuales.map((item, idx) =>
      idx === actuales.length - 1 ? { ...item, label: limpio } : item
    );
    this.breadcrumbsSubject.next(actualizados);
  }

  actualizarDesdeRuta(urlCompleta: string): void {
    const [pathRaw, queryRaw] = (urlCompleta || '/').split('?');
    const path = pathRaw.replace(/\/+$/, '') || '/';
    const params = new URLSearchParams(queryRaw || '');

    if (
      path === '/' ||
      path === '/login' ||
      path === '/registro' ||
      path === '/acceso-denegado'
    ) {
      this.breadcrumbsSubject.next([]);
      return;
    }

    if (path === '/inicio') {
      this.breadcrumbsSubject.next([{ label: 'Inicio' }]);
      return;
    }

    const items: BreadcrumbItem[] = [{ label: 'Inicio', url: '/inicio' }];

    if (path === '/tablon') {
      items.push({ label: 'Tablón' });
    } else if (path.startsWith('/detalle-publicacion/')) {
      items.push({ label: 'Tablón', url: '/tablon' });
      items.push({ label: 'Detalle de publicación' });
    } else if (path === '/agenda') {
      items.push({ label: 'Mi Itinerario Técnico' });
    } else if (path === '/chat') {
      const id = params.get('id');
      const tipo = params.get('tipo')?.toLowerCase();
      if (id) {
        items.push({ label: 'Tablón', url: '/tablon' });
        const etiquetaTipo = tipo === 'pieza' ? 'Pieza' : 'Servicio';
        items.push({ label: `Chat sobre ${etiquetaTipo} #${id}` });
      } else {
        items.push({ label: 'Chat / Mensajes' });
      }
    } else if (path === '/publicar-servicio') {
      items.push({ label: 'Tablón', url: '/tablon' });
      items.push({ label: 'Publicar Servicio' });
    } else if (path === '/publicar-pieza') {
      items.push({ label: 'Tablón', url: '/tablon' });
      items.push({ label: 'Publicar Refacción' });
    } else if (
      path.startsWith('/perfil/tecnico/') ||
      path.startsWith('/perfil/cliente/') ||
      path.startsWith('/perfil-publico/')
    ) {
      items.push({ label: 'Tablón', url: '/tablon' });
      items.push({ label: 'Perfil Público' });
    } else {
      items.push({ label: 'TecniHub' });
    }

    this.breadcrumbsSubject.next(items);
  }
}
