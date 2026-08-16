import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { setAuthToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('aaroham_user') || localStorage.getItem('arogya_user');
      const savedToken = localStorage.getItem('aaroham_token') || localStorage.getItem('arogya_token');
      if (savedToken) setAuthToken(savedToken);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = (userData, token) => {
    setUser(userData);
    if (token) {
      setAuthToken(token);
      localStorage.setItem('aaroham_token', token);
    }
    localStorage.setItem('aaroham_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('aaroham_token');
    localStorage.removeItem('aaroham_user');
    localStorage.removeItem('arogya_token');
    localStorage.removeItem('arogya_user');
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      setUser,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
