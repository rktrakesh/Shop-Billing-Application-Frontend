import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AuthUser, Role } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateTokens: (token: string, refreshToken: string) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("rkt_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("rkt_user", JSON.stringify(user));
      localStorage.setItem("rkt_token", user.token);
      localStorage.setItem("rkt_refresh_token", user.refreshToken);
    } else {
      localStorage.removeItem("rkt_user");
      localStorage.removeItem("rkt_token");
      localStorage.removeItem("rkt_refresh_token");
    }
  }, [user]);

  const login = (authUser: AuthUser) => setUser(authUser);

  const logout = () => setUser(null);

  // Used after a silent token refresh — updates the access/refresh tokens
  // in place without re-triggering a full login.
  const updateTokens = (token: string, refreshToken: string) => {
    setUser((prev) => (prev ? { ...prev, token, refreshToken } : prev));
  };

  const isAdmin = user?.role === "ROLE_ADMIN";
  const isManager = user?.role === "ROLE_MANAGER";
  const isUser = user?.role === "ROLE_USER";

  const hasRole = (roles: Role[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateTokens,
        isAuthenticated: !!user,
        isAdmin,
        isManager,
        isUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
