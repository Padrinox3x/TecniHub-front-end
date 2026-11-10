import { Routes } from '@angular/router';
import { ItinerarioComponent } from './sprint3/itinerario/itinerario.component';
import { PiezasComponent } from './sprint3/piezas/piezas.component';
import { SolicitudServicioComponent } from './sprint3/solicitud-servicio/solicitud-servicio.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sprint3/servicios' },
  { path: 'sprint3/servicios', component: SolicitudServicioComponent, title: 'Solicitar servicio · TecniHub' },
  { path: 'sprint3/piezas', component: PiezasComponent, title: 'Piezas · TecniHub' },
  { path: 'sprint3/itinerario', component: ItinerarioComponent, title: 'Mi itinerario · TecniHub' },
  { path: '**', redirectTo: 'sprint3/servicios' },
];
