import { User } from './user.types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface JwtPayload {
  id: number;
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}
