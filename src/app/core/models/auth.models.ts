// Definicion de roles soportados en el sistema
export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'ASESOR';

// Modelo de datos del usuario autenticado
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
}

// Carga util para peticion de inicio de sesion
export interface LoginRequest {
  email: string;
  password: string;
}

// Respuesta devuelta por el endpoint de login
export interface AuthResponse {
  accessToken: string;
  user: User;
}
