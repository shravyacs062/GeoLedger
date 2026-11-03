import { useContext } from 'react';
import { AuthContext } from './auth-context';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return {
    ...context,
    isAuthenticated: Boolean(context.user),
    isAdmin: context.user?.role === 'admin',
    loginUser: (email: string, password: string) => context.login(email, password, 'user'),
    loginAdmin: (email: string, password: string) => context.login(email, password, 'admin'),
  };
}
