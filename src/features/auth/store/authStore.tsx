import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { normalizeRole, type Role } from "@/auth/rbac/roles";
import { loadUser, clearTokens, getAccessToken } from "@/lib/api/apiClient";
import { logout as apiLogout, type UserResponse } from "@/features/auth/api/authService";

interface AuthState {
  user: UserResponse | null;
  role: Role | null;
  isAuthenticated: boolean;
  setAuth: (user: UserResponse) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(() => {
    // Restore session from localStorage on app load
    if (!getAccessToken()) return null;
    const storedUser = loadUser<UserResponse>();
    if (storedUser && !normalizeRole(storedUser.role)) {
      clearTokens();
      return null;
    }
    return storedUser;
  });

  const setAuth = useCallback((newUser: UserResponse) => {
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const role = user ? normalizeRole(user.role) : null;

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated: !!user, setAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
