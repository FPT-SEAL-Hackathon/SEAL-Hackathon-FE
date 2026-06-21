import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  authenticated: boolean;
  currentRole: string | null;
  isDark: boolean;
  login: (role: string) => void;
  logout: () => void;
  toggleDark: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("seal-theme") === "dark";
  });

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

  const toggleDark = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <AuthContext.Provider value={{ authenticated, currentRole, isDark, login, logout, toggleDark }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
