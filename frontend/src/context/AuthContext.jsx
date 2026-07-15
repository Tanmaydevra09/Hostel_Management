import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('hub_token');
    const saved = localStorage.getItem('hub_user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authAPI.login({ username, password });
    if (res.data.otpRequired) {
      return res.data;
    }
    const { token, user: userData } = res.data;
    localStorage.setItem('hub_token', token);
    localStorage.setItem('hub_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  }, []);

  const verifyLogin = useCallback(async (userId, otp) => {
    const res = await authAPI.verifyOtp({ userId, otp });
    const { token, user: userData } = res.data;
    localStorage.setItem('hub_token', token);
    localStorage.setItem('hub_user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hub_token');
    localStorage.removeItem('hub_user');
    setUser(null);
  }, []);

  const isAdmin   = user?.role === 'admin';
  const isWarden  = user?.role === 'warden';
  const isStudent = user?.role === 'student';
  const canManage = isAdmin || isWarden;

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyLogin, logout, isAdmin, isWarden, isStudent, canManage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
