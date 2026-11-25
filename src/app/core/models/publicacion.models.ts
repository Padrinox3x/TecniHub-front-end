
import { TablonItem } from './tablon.models';

export interface CrearPublicacionServicioRequest {
  titulo: string;
  tipoElectrodomestico: string;
  descripcionFalla: string;
  ubicacionAproximada: string;
  imagenReferencia?: string | null;
}

export interface CrearPublicacionPiezaRequest {
  nombrePieza: string;
  categoriaAparato: string;
  condicionPieza: string;
  tipoTransaccion: string;
  precio?: number | null;
  datosContacto: string;
  descripcionDetalle?: string | null;
  fotografia?: string | null;
}

export type PublicacionCreada = TablonItem;
