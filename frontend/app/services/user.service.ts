import { apiClient } from './api';
import { User } from '../types';

export const userService = {
  /**
   * Get all registered users
   */
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  /**
   * Get user profile by ID
   */
  getUserById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Get user profile by email
   */
  getUserByEmail: async (email: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/email/${encodeURIComponent(email)}`);
    return response.data;
  },
};
