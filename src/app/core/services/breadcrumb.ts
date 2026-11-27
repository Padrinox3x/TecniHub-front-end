import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { BreadcrumbItem } from '../models/breadcrumb.models';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private readonly router = inject(Router, { optional: true });

  private readonly breadcrumbsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  readonly breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  constructor() {
    if (this.router) {
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          this.actualizarDesdeRuta();
        });

      // Inicialización con la URL actual
      this.actualizarDesdeRuta();
    }
  }

  setBreadcrumbs(items: BreadcrumbItem[]): void {
    this.breadcrumbsSubject.next(items);
  }

  setUltimoLabel(nuevoLabel: string): void {
    const actuales = [...this.breadcrumbsSubject.value];
    if (actuales.length > 0) {
      actuales[actuales.length - 1] = {
        ...actuales[actuales.length - 1],
        label: nuevoLabel
      };
      this.breadcrumbsSubject.next(actuales);
    }
  }

  actualizarDesdeRuta(): void {
    if (!this.router) return;

    const rawUrl = this.router.url || '';
    const urlSinQuery = rawUrl.split('?')[0];

    // En pantallas de autenticación no mostramos breadcrumbs
    if (urlSinQuery === '/login' || urlSinQuery === '/registro' || urlSinQuery === '') {
      this.breadcrumbsSubject.next([]);
      return;
    }

    const items: BreadcrumbItem[] = [];

    // Siempre incluimos Inicio como raíz para usuarios autenticados
    items.push({ label: 'Inicio', url: '/inicio' });

    if (urlSinQuery === '/inicio') {
      this.breadcrumbsSubject.next(items);
      return;
    }

    let parsedParams: Record<string, string> = {};
    try {
      const parsed = this.router.parseUrl(rawUrl);
      parsedParams = parsed.queryParams || {};
    } catch {
      // Ignorar error al parsear url
    }

    if (urlSinQuery === '/tablon') {
      items.push({ label: 'Tablón de Publicaciones' });
    } else if (urlSinQuery.startsWith('/detalle-publicacion/')) {
      items.push({ label: 'Tablón', url: '/tablon' });
      const partes = urlSinQuery.split('/');
      const tipo = partes[2]?.toUpperCase();
      const id = partes[3];
      const tipoTexto = tipo === 'SERVICIO' ? 'Servicio' : 'Refacción';
      items.push({ label: `Detalle de ${tipoTexto} #${id || ''}` });
    } else if (urlSinQuery === '/agenda') {
      items.push({ label: 'Mi Itinerario Técnico' });
    } else if (urlSinQuery === '/chat') {
      if (parsedParams['tipo'] && parsedParams['id']) {
        items.push({ label: 'Tablón', url: '/tablon' });
        const tipoTxt = parsedParams['tipo'] === 'servicio' ? 'Servicio' : 'Pieza';
        items.push({ label: `Chat sobre ${tipoTxt} #${parsedParams['id']}` });
      } else {
        items.push({ label: 'Mensajes y Conversaciones' });
      }
    } else if (urlSinQuery === '/publicar-servicio') {
      items.push({ label: 'Tablón', url: '/tablon' });
      items.push({ label: 'Solicitar Servicio' });
    } else if (urlSinQuery === '/publicar-pieza') {
      items.push({ label: 'Tablón', url: '/tablon' });
      items.push({ label: 'Publicar Refacción' });
    } else if (urlSinQuery.startsWith('/perfil/tecnico/')) {
      const id = urlSinQuery.split('/')[3];
      items.push({ label: 'Tablón', url: '/tablon' });
      items.push({ label: `Perfil del Técnico #${id || ''}` });
    } else if (urlSinQuery.startsWith('/perfil/cliente/')) {
      const id = urlSinQuery.split('/')[3];
      items.push({ label: 'Tablón', url: '/tablon' });
      items.push({ label: `Perfil del Cliente #${id || ''}` });
    } else if (urlSinQuery === '/acceso-denegado') {
      items.push({ label: 'Acceso Denegado' });
    } else {
      const segmentos = urlSinQuery.split('/').filter(Boolean);
      let acumUrl = '';
      segmentos.forEach((seg, idx) => {
        acumUrl += `/${seg}`;
        const esUltimo = idx === segmentos.length - 1;
        const nombreFormateado = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        items.push({
          label: nombreFormateado,
          url: esUltimo ? undefined : acumUrl
        });
      });
    }

    this.breadcrumbsSubject.next(items);
  }
}
