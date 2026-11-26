export interface ResenaTecnico {
  id: string;
  clienteNombre: string;
  calificacionEstrellas: number;
  fechaRelativa: string;
  fecha: string;
  comentario: string;
  tipoServicio: string;
}

export interface CrearResenaRequest {
  servicioId: number;
  calificacion: number; // 1 a 5
  comentario?: string | null;
}

export interface CrearResenaUniversalRequest {
  idServicio: number;
  idCliente?: number;
  idTecnico?: number;
  calificacion: number;
  comentario?: string | null;
}

export interface PerfilPublicoTecnico {
  id: number;
  nombreCompleto: string;
  fotoUrl?: string | null;
  calificacionPromedio?: number | null;
  totalTrabajosCompletados: number;
  esTecnicoNuevo: boolean;
  mensajeReputacion: string;
  especialidades: string[];
  costoDiagnostico?: number | null;
  tieneNegocioFisico: boolean;
  ubicacionNegocio?: string | null;
  miembroDesde: string;
  evidenciaTrabajos: string[];
  resenas: ResenaTecnico[];
}

export interface PerfilPublicoCliente {
  id: number;
  nombrePublico: string;
  zonaAproximada: string;
  miembroDesde: string;
  serviciosSolicitados: number;
  serviciosCompletados: number;
  porcentajeInteraccionesExitosas: string;
  esUsuarioFrecuente: boolean;
}

export interface CierreServicioResponse {
  servicioId: number;
  estado: string;
  mensaje: string;
  codigoColor: string;
  colorHex: string;
  textoIndicador?: string | null;
  resenaId?: string | null;
  calificacion?: number | null;
  comentario?: string | null;
  fechaFinalizacion: string;
}

export interface ConfirmarCierreYCalificarRequest {
  servicioId: number;
  calificacion: number; // 1 a 5
  comentario?: string | null;
}
