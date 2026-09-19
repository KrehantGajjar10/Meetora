import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_organizer: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialToken] = useState<string | null>(() => localStorage.getItem('meetora_access_token'));
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(initialToken);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('meetora_access_token');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (newToken: string) => {
    localStorage.setItem('meetora_access_token', newToken);
    setToken(newToken);
    setIsLoading(true);

    try {
      const userData = await apiFetch<User>('/api/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to load authenticated user', error);
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    async function loadUser() {
      if (initialToken) {
        try {
          const userData = await apiFetch<User>('/api/auth/me');
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user", error);
          logout();
        }
      }
      setIsLoading(false);
    }
    void loadUser();
  }, [initialToken, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
