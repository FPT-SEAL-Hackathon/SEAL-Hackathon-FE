import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/features/auth/store/authStore";
import { LandingPage } from "@/pages/landing/LandingPage";
import { AuthPages } from "@/features/auth/pages/AuthPages";
import { DevHub } from "@/pages/dev/DevHub";
import { Layout } from "@/layout/Layout";
import { MemberDashboard } from "@/pages/member/MemberDashboard";
import { LeaderDashboard } from "@/pages/leader/LeaderDashboard";
import { JudgeDashboard } from "@/pages/judge/JudgeDashboard";
import { MentorDashboard } from "@/pages/mentor/MentorDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ResearchDashboard } from "@/pages/research/ResearchDashboard";
import { loadUser } from "@/lib/api/apiClient";
import type { UserResponse } from "@/features/auth/api/authService";

type AppView = "landing" | "auth" | "devhub" | "page";

function AppShell() {
  const { setAuth, signOut } = useAuth();

  const [view, setView] = useState<AppView>(() =>
    loadUser<UserResponse>() ? "devhub" : "landing"
  );
  const [activeRole, setActiveRole] = useState("admin");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isDark, setIsDark] = useState(() => localStorage.getItem("seal-theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("seal-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleLoginSuccess = () => {
    const freshUser = loadUser<UserResponse>();
    if (freshUser) setAuth(freshUser);
    setView("devhub");
  };

  const handleNavigate = (role: string, page: string) => {
    setActiveRole(role);
    setCurrentPage(page);
    setView("page");
  };

  const handleLogout = async () => {
    await signOut();
    setView("landing");
  };

  const handleBackToHub = () => setView("devhub");

  if (view === "landing") {
    return <LandingPage onGoToAuth={() => setView("auth")} />;
  }

  if (view === "auth") {
    return <AuthPages onLogin={handleLoginSuccess} />;
  }

  if (view === "devhub") {
    return <DevHub onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  // view === "page" — render the selected dashboard inside Layout
  const renderDashboard = () => {
    switch (activeRole) {
      case "member":   return <MemberDashboard currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "leader":   return <LeaderDashboard currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "judge":    return <JudgeDashboard  currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "mentor":   return <MentorDashboard currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "admin":    return <AdminDashboard  currentPage={currentPage} onNavigate={setCurrentPage} />;
      case "research": return <ResearchDashboard currentPage={currentPage} />;
      default:         return <AdminDashboard  currentPage={currentPage} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout
      role={activeRole}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onRoleChange={handleBackToHub}
      isDark={isDark}
      onToggleDark={() => setIsDark(v => !v)}
    >
      {renderDashboard()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
