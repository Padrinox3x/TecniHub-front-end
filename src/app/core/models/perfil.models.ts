
export interface PerfilResponse {
  usuarioId: number;
  email: string;
  rol: string;
  fechaUltimoAcceso: string | null;
  cliente: PerfilCliente | null;
  tecnico: PerfilTecnico | null;
}

export interface PerfilCliente {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion?: string | null;
}

export interface PerfilTecnico {
  id: number;
  nombreCompleto: string;
  email: string;
  telefono: string;
  tieneNegocioFisico: boolean;
  telefonoNegocio?: string | null;
  ubicacionEstablecimiento?: string | null;
  fotoIdentificacion?: string | null;
  redesSociales?: string | null;
  costoCotizacion?: number | null;
  evidenciaTrabajos?: string | null;
}
