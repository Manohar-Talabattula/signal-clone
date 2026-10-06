'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../lib/types';
import { getMeApi, loginApi, registerApi, updateProfileApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  login: (identifier: string, otp?: string) => Promise<void>;
  register: (username: string, phone: string, displayName: string, avatarUrl?: string) => Promise<void>;
  updateProfile: (data: { display_name?: string; avatar_url?: string; about?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedToken = localStorage.getItem('signal_token');
    const savedTheme = (localStorage.getItem('signal_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (savedToken) {
      setToken(savedToken);
      getMeApi()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('signal_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('signal_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const login = async (identifier: string, otp: string = '123456') => {
    const res = await loginApi(identifier, otp);
    localStorage.setItem('signal_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (username: string, phone: string, displayName: string, avatarUrl?: string) => {
    const res = await registerApi(username, phone, displayName, avatarUrl);
    localStorage.setItem('signal_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const updateProfile = async (data: { display_name?: string; avatar_url?: string; about?: string }) => {
    const updatedUser = await updateProfileApi(data);
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('signal_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, theme, toggleTheme, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
