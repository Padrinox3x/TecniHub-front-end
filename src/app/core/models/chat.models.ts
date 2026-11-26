export interface Mensaje {
  id: number;
  conversacionId: string;
  emisorId: number;
  emisorNombre: string;
  emisorRol: string;
  contenido: string;
  enviadoAt: string;
  horaFormateada: string;
  esMio?: boolean;
}

export interface ConversacionResumen {
  id: string;
  tipoContexto: string; // 'SERVICIO' | 'PIEZA'
  contextoId: number;
  tituloContexto: string;
  estadoContexto: string;
  clienteUsuarioId: number;
  clienteNombre: string;
  tecnicoUsuarioId: number;
  tecnicoNombre: string;
  ultimaActividad: string;
  ultimoMensaje?: string | null;
  totalMensajes: number;
}

export interface EnviarMensajeRequest {
  contenido: string;
  remitenteUsuarioId?: number;
}
