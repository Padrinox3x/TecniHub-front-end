
export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface RegistroClienteRequest {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  telefono: string;
  direccion?: string;
}

export interface RegistroTecnicoRequest {
  nombreCompleto: string;
  email: string;
  contrasena: string;
  telefono: string;
  tieneNegocioFisico: boolean;
  telefonoNegocio?: string;
  ubicacionEstablecimiento?: string;
  fotoIdentificacion?: string;
  redesSociales?: string;
  costoCotizacion?: number;
  evidenciaTrabajos?: string;
}

export interface AuthResponse {
  token: string;
  expiracion: string;
  usuarioId: number;
  email: string;
  rol: string;
}
