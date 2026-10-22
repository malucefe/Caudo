export type UserRole = 'usuario' | 'admin';

export interface User {
  id: string;
  nombre: string;
  email: string;
  ingresoMensual?: number | null;
  aceptaPolitica?: boolean;
  rol?: UserRole;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  aceptaPolitica: boolean;
}

export interface UpdateProfileRequest {
  nombre?: string;
  ingresoMensual?: number | null;
}

export interface ChangePasswordRequest {
  passwordActual: string;
  passwordNueva: string;
}
