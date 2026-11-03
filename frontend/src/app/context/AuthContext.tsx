import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api } from '../../services/api';
import { AuthContext, type AuthContextValue, type AuthUser } from './auth-context';


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.auth.me());
    } finally {
      setHasChecked(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.auth.me().then((nextUser) => {
      if (active) setUser(nextUser);
    }).catch(() => {
      if (active) setUser(null);
    }).finally(() => {
      if (active) setHasChecked(true);
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email: string, password: string, role: AuthUser['role']) => {
    const result = await api.auth.login(email, password, role);
    setUser(result);
    return result;
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string }) => {
    const result = await api.auth.register(data);
    setUser(result);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    hasChecked,
    login,
    register,
    logout,
    refresh,
  }), [user, hasChecked, login, register, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
