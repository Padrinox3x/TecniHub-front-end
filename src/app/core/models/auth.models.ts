
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  userId: string;
  email: string;
  role: string;
}
