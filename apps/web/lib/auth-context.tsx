"use client";

import * as React from "react";
import type { AuthUserDTO } from "@indiamart-crm/shared";
import * as api from "@/lib/api-client";
import { clearTokens, getAccessToken, setTokens } from "@/lib/token-storage";

interface AuthContextValue {
  user: AuthUserDTO | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUserDTO | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = getAccessToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }
    api
      .getMe(stored)
      .then((me) => {
        setToken(stored);
        setUser(me);
      })
      .catch(() => {
        clearTokens();
      })
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    function handleRefreshed(e: Event) {
      setToken((e as CustomEvent<string>).detail);
    }
    function handleLogout() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener("auth:token-refreshed", handleRefreshed);
    window.addEventListener("auth:logout", handleLogout);
    return () => {
      window.removeEventListener("auth:token-refreshed", handleRefreshed);
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    setTokens(result.accessToken, result.refreshToken);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const logout = React.useCallback(() => {
    clearTokens();
    setToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
