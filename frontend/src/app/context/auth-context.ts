import { createContext } from 'react';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  wallet_address: string | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  hasChecked: boolean;
  login: (email: string, password: string, role: AuthUser['role']) => Promise<AuthUser>;
  register: (data: { name: string; email: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
