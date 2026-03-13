import { createContext, useContext, useEffect, useState } from 'react';
import { api, refreshSession } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const refreshed = await refreshSession();
      if (!refreshed) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const payload = await api.me();
        if (mounted) {
          setUser(payload.data.user);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const value = {
    user,
    loading,
    async login(credentials) {
      const payload = await api.login(credentials);
      api.setAccessToken(payload.data.accessToken);
      setUser(payload.data.user);
    },
    async register(form) {
      const payload = await api.register(form);
      api.setAccessToken(payload.data.accessToken);
      setUser(payload.data.user);
    },
    async logout() {
      await api.logout();
      api.setAccessToken(null);
      setUser(null);
    },
    async refreshUser() {
      const payload = await api.me();
      setUser(payload.data.user);
      return payload.data.user;
    },
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
