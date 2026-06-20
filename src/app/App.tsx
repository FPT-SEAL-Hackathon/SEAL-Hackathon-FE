import { useState, useEffect } from "react";
import { LanguageProvider } from "../store/languageStore";
import { AuthProvider, useAuth } from "./store/authStore";
import { LandingPage } from "./components/landing/LandingPage";
import { AuthPages } from "./components/auth/AuthPages";
import { Layout } from "../layout/Layout";
import { MemberDashboard } from "./components/member/MemberDashboard";
import { LeaderDashboard } from "./components/leader/LeaderDashboard";
import { JudgeDashboard } from "./components/judge/JudgeDashboard";
import { MentorDashboard } from "./components/mentor/MentorDashboard";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ResearchDashboard } from "./components/research/ResearchDashboard";
import { userTypeToRole } from "./services/authService";
import { loadUser } from "./services/apiClient";
import type { UserResponse } from "./services/authService";

const roleDefaultPages: Record<string, string> = {
  member:   "dashboard",
  leader:   "dashboard",
  judge:    "rounds",
  mentor:   "tracks",
  admin:    "dashboard",
  research: "variance",
};

type AppView = "landing" | "auth" | "app";

function AppShell() {
  const { user, role, setAuth, signOut } = useAuth();

  // Restore session: if tokens + user exist in localStorage, go straight to app
  const [view, setView] = useState<AppView>(() => {
    const saved = loadUser<UserResponse>();
    return saved ? "app" : "landing";
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = loadUser<UserResponse>();
    if (!saved) return "dashboard";
    return roleDefaultPages[userTypeToRole(saved.userType)] ?? "dashboard";
  });

  const [isDark, setIsDark] = useState(() => localStorage.getItem("seal-theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("seal-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleLoginSuccess = (roleOrUser: string) => {
    // Demo path: roleOrUser is a plain role string (no real user object)
    // Real API path: authService.login() already saved user; roleOrUser is derived role
    const freshUser = loadUser<UserResponse>();
    if (freshUser) setAuth(freshUser);

    const resolvedRole = typeof roleOrUser === "string" ? roleOrUser : role ?? "member";
    setCurrentPage(roleDefaultPages[resolvedRole] ?? "dashboard");
    setView("app");
  };

  const handleRoleChange = async () => {
    await signOut();
    setCurrentPage("dashboard");
    setView("landing");
  };

  const activeRole = role ?? (view === "app" ? "member" : null);

  if (view === "landing") {
    return <LandingPage onGoToAuth={() => setView("auth")} />;
  }

  if (view === "auth") {
    return <AuthPages onLogin={handleLoginSuccess} />;
  }

  const renderDashboard = () => {
    switch (activeRole) {
      case "member":   return <MemberDashboard currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "leader":   return <LeaderDashboard currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "judge":    return <JudgeDashboard  currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "mentor":   return <MentorDashboard currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "admin":    return <AdminDashboard  currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "research": return <ResearchDashboard currentPage={currentPage} />;
      default:         return <MemberDashboard currentPage={currentPage} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout
      role={activeRole!}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onRoleChange={handleRoleChange}
      isDark={isDark}
      onToggleDark={() => setIsDark(v => !v)}
      userName={user?.fullName ?? undefined}
    >
      {renderDashboard()}
    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </LanguageProvider>
  );
}
