import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AuthState {
  authenticated: boolean;
  currentRole: string | null;
  isDark: boolean;
  login: (role: string) => void;
  logout: () => void;
  toggleDark: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("seal-theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("seal-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const login = (role: string) => {
    setCurrentRole(role);
    setAuthenticated(true);
  };

  const logout = () => {
    setAuthenticated(false);
    setCurrentRole(null);
  };

  const toggleDark = () => setIsDark((prev) => !prev);

  return (
    <AuthContext.Provider value={{ authenticated, currentRole, isDark, login, logout, toggleDark }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
