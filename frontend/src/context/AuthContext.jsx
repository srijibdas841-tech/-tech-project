import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api.js';

const AuthContext = createContext();

export const DEMO_ACCOUNTS = {
  admin: { email: 'admin@landrecords.gov.in', password: 'admin123', label: 'Admin (Director Land Records)' },
  officer: { email: 'officer@landrecords.gov.in', password: 'officer123', label: 'Revenue Officer' },
  reviewer: { email: 'reviewer@landrecords.gov.in', password: 'reviewer123', label: 'Cadastral Reviewer' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sih_land_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sih_land_token');
      if (storedToken) {
        try {
          const userData = await authService.me();
          setUser(userData);
        } catch (err) {
          console.warn('Session expired, logging in as default officer');
          await loginWithDemo('officer');
        }
      } else {
        // Auto-login as Officer for seamless immediate demo access
        await loginWithDemo('officer');
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('sih_land_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const loginWithDemo = async (roleKey = 'officer') => {
    const creds = DEMO_ACCOUNTS[roleKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('sih_land_token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
