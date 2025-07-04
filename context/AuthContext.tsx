import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio?: string;
  avatar?: string;
  accountType: 'personal' | 'business';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string, accountType?: 'personal' | 'business') => Promise<void>;
  register: (userData: Omit<User, 'id'> & { password: string, accountType: 'personal' | 'business' }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  isBusinessAccount: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadUser();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData && isMountedRef.current) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const login = async (phone: string, password: string, accountType: 'personal' | 'business' = 'personal') => {
    try {
      // Simulate API call
      const userData: User = {
        id: Date.now().toString(),
        name: 'محمد أحمد',
        email: 'mohamed@example.com',
        phone,
        bio: 'مطور تطبيقات ومهتم بالتكنولوجيا',
        avatar: '',
        accountType: accountType,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (isMountedRef.current) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password: string, accountType: 'personal' | 'business' }) => {
    try {
      // Simulate API call
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        bio: '',
        avatar: '',
        accountType: userData.accountType,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      if (isMountedRef.current) {
        setUser(newUser);
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      if (isMountedRef.current) {
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...userData };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        if (isMountedRef.current) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const isBusinessAccount = () => {
    return user?.accountType === 'business';
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    isBusinessAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
