import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getAuthToken, setAuthToken } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

export interface User {
  id: string;
  employeeId: string;
  email: string;
  name: string;
  role: 'FIELD_STAFF' | 'MINE_MANAGER' | 'CORPORATE' | 'REGULATOR' | 'ADMIN';
  phone: string;
  language: string;
  mineId?: string | null;
  sectionId?: string | null;
  departmentId?: string | null;
  mine?: any;
  section?: any;
  department?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string, language?: string) => Promise<User>;
  logout: () => Promise<void>;
  getDefaultRouteForRole: (role: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getDefaultRouteForRole = (role: string): string => {
  switch (role) {
    case 'FIELD_STAFF':
      return '/field';
    case 'MINE_MANAGER':
      return '/mine/dashboard';
    case 'CORPORATE':
      return '/corporate/dashboard';
    case 'REGULATOR':
      return '/regulator/dashboard';
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);
  const { setLanguage } = useTranslation();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          if (data.user.language) {
            setLanguage(data.user.language);
          }
        } else {
          setAuthToken(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Stored token is invalid or expired:', err);
        setAuthToken(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string, language?: string): Promise<User> => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, language }),
    });

    if (!data.success || !data.user || !data.token) {
      throw new Error(data.message || 'Login failed');
    }

    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);

    if (data.user.language) {
      setLanguage(data.user.language);
    }

    return data.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await apiFetch('/auth/logout', { method: 'POST' });
      }
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      setAuthToken(null);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        getDefaultRouteForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
