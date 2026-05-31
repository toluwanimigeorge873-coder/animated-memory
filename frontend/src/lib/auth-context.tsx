'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('historygpt_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (t: string) => {
    try {
      const res = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('historygpt_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API}/api/auth/login`, { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('historygpt_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await axios.post(`${API}/api/auth/register`, { email, password, name });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('historygpt_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try { await axios.post(`${API}/api/auth/logout`); } catch {}
    localStorage.removeItem('historygpt_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const loginWithGoogle = () => {
    window.location.href = `${API}/api/auth/google`;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
