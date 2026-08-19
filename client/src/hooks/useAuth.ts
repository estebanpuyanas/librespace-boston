import { useState } from 'react';
import { SafeDatabaseUser } from 'shared/types/user';
import { login, register } from '../services/authService';
import { applyTheme } from '../utils/theme';

interface UseAuthReturn {
  loading: boolean;
  error: string | null;
  handleLogin: (username: string, password: string) => Promise<SafeDatabaseUser | null>;
  handleRegister: (username: string, email: string, password: string) => Promise<SafeDatabaseUser | null>;
  clearError: () => void;
}

const useAuth = (): UseAuthReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (
    username: string,
    password: string
  ): Promise<SafeDatabaseUser | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await login({ username, password });
      if ('error' in result) { setError(result.error); return null; }
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      applyTheme(result.user.theme);
      return result.user;
    } catch {
      setError('Login failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    username: string,
    email: string,
    password: string
  ): Promise<SafeDatabaseUser | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await register({ username, email, password });
      if ('error' in result) { setError(result.error); return null; }
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      return result.user;
    } catch {
      setError('Registration failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, handleLogin, handleRegister, clearError: () => setError(null) };
};

export default useAuth;
