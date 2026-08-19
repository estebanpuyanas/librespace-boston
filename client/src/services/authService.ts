import api from './axios';
import { LoginResponse, UserCredentials } from 'shared/types/user';

export const login = async (credentials: UserCredentials): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials);
  return data;
};

export const register = async (
  credentials: UserCredentials & { email: string }
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/register', credentials);
  return data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
