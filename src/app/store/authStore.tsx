import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { loadUser, clearTokens, getAccessToken } from "../services/apiClient";
import { logout as apiLogout, userTypeToRole, type UserResponse } from "../services/authService";

interface AuthState {
  user: UserResponse | null;
  role: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserResponse) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(() => {
    // Restore session from localStorage on app load
    if (!getAccessToken()) return null;
    return loadUser<UserResponse>();
  });

  const setAuth = useCallback((newUser: UserResponse) => {
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const role = user ? userTypeToRole(user.userType) : null;

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
