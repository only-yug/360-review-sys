'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee';
  firstName?: string; // Derived for UI
  lastName?: string;  // Derived for UI
  department?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | undefined>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);

        // Ensure firstName/lastName for UI compatibility
        if (parsedUser.full_name && (!parsedUser.firstName || !parsedUser.lastName)) {
          const names = parsedUser.full_name.trim().split(/\s+/);
          parsedUser.firstName = names[0] || '';
          parsedUser.lastName = names.slice(1).join(' ') || '';
        }

        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      let { user, token, refreshToken } = response.data.data;

      // Ensure firstName/lastName for UI compatibility
      if (user.full_name && (!user.firstName || !user.lastName)) {
        const names = user.full_name.trim().split(/\s+/);
        user.firstName = names[0] || '';
        user.lastName = names.slice(1).join(' ') || '';
      }

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    try {
      // Strictly send only requested fields
      const payload = {
        full_name: data.full_name,
        email: data.email,
        password: data.password
      };

      const response = await apiClient.post('/auth/register', payload);
      let { user, token, refreshToken } = response.data.data || response.data; // Handle both structures

      // Ensure names exist for UI
      if (user && user.full_name && !user.firstName) {
        const names = user.full_name.trim().split(/\s+/);
        user.firstName = names[0] || 'User';
        user.lastName = names.slice(1).join(' ') || '';
      }

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      console.error('Registration error details:', error.response?.data);
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Registration failed';
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
