export interface Notificacion {
  id: string;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  codigoColor: string;
  colorHex: string;
  referenciaId?: number | null;
  tipoReferencia?: string | null;
  fecha: string;
  fechaRelativa: string;
  leida: boolean;
}

export interface SuscripcionPushRequest {
  endpoint: string;
  p256dh?: string | null;
  auth?: string | null;
  plataforma?: string;
  dispositivoToken?: string | null;
  usuarioId?: number | null;
}
