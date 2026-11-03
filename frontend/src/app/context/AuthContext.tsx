import {
<<<<<<< Updated upstream
  createContext,
  useCallback,
  useContext,
=======
  useCallback,
>>>>>>> Stashed changes
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
<<<<<<< Updated upstream

import { api, setAuthToken } from '../../services/api';

export type AuthUser = {
  id: string;
  email?: string;
  role: string;
  full_name?: string;
  phone?: string;
  wallet_address?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasChecked: boolean;
  loginUser: (email: string, password: string) => Promise<AuthUser>;
  loginAdmin: (email: string, password: string) => Promise<AuthUser>;
  register: (data: {
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
    wallet_address?: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'geoledger_token';
const USER_KEY = 'geoledger_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const applySession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    const boot = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (!savedToken) {
        setHasChecked(true);
        return;
      }
      setAuthToken(savedToken);
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          /* ignore */
        }
      }
      try {
        const profile = await api.auth.me();
        if (profile) {
          setUser(profile);
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
        }
      } catch {
        clearSession();
      } finally {
        setHasChecked(true);
      }
    };
    boot();
  }, [clearSession]);

  const loginUser = useCallback(async (email: string, password: string) => {
    const result = await api.auth.login(email, password);
    applySession(result.token, result.user);
    return result.user;
  }, [applySession]);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const result = await api.auth.adminLogin(email, password);
    applySession(result.token, result.user);
    return result.user;
  }, [applySession]);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
    wallet_address?: string;
  }) => {
    const result = await api.auth.registerAccount(data);
    applySession(result.token, result.user);
    return result.user;
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    clearSession();
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    const profile = await api.auth.me();
    setUser(profile);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }, []);

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    const profile = await api.auth.updateProfile(data);
    setUser(profile);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    return profile;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: Boolean(user && ['ADMIN', 'REGISTRAR'].includes((user.role || '').toUpperCase())),
    hasChecked,
    loginUser,
    loginAdmin,
    register,
    logout,
    refreshProfile,
    updateProfile,
  }), [user, token, hasChecked, loginUser, loginAdmin, register, logout, refreshProfile, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
=======
import { api } from '../../services/api';
import { AuthContext, type AuthContextValue, type AuthUser } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.auth.me());
    } catch {
      setUser(null);
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

  const value = useMemo<AuthContextValue>(() => ({ user, hasChecked, login, register, logout, refresh }), [
    user, hasChecked, login, register, logout, refresh,
  ]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
>>>>>>> Stashed changes
