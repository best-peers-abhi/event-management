import { apiClient } from './api';
import { AuthResponse, LoginDto, RegisterDto, RegisterResponse } from '../types';

export const authService = {
  /**
   * Log in user and receive JWT access token + profile
   */
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', dto);
    return response.data;
  },

  /**
   * Register a new user in PostgreSQL via API Gateway
   */
  register: async (dto: RegisterDto): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', dto);
    return response.data;
  },
};
