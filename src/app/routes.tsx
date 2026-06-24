import { createBrowserRouter, Navigate, Outlet, useParams, useNavigate, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { useAuth, AuthProvider } from "@/features/auth/store/authStore";
import { loadUser } from "@/lib/api/apiClient";
import { AuthPages } from "@/features/auth/pages/AuthPages";
import { LandingPage } from "@/pages/landing/LandingPage";
import { DevHub } from "@/pages/dev/DevHub";
import { Layout } from "@/components/layouts/Layout";
import { MemberDashboard } from "@/pages/member/MemberDashboard";
import { LeaderDashboard } from "@/pages/leader/LeaderDashboard";
import { JudgeDashboard } from "@/pages/judge/JudgeDashboard";
import { MentorDashboard } from "@/pages/mentor/MentorDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ResearchDashboard } from "@/pages/research/ResearchDashboard";

const roleDefaultPages: Record<string, string> = {
  member:   "dashboard",
  leader:   "dashboard",
  judge:    "rounds",
  mentor:   "tracks",
  admin:    "dashboard",
  research: "variance",
};

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function HubRoute() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const handleNavigate = (role: string, page: string) => {
    navigate(`/${role}/${page}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return <DevHub onNavigate={handleNavigate} onLogout={handleLogout} />;
}

function MainLayout() {
  const { user } = useAuth();
  const { role, page } = useParams();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => localStorage.getItem("seal-theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("seal-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handlePageNavigate = (newPage: string) => {
    navigate(`/${role}/${newPage}`);
  };

  const handleRoleChange = () => {
    navigate("/hub");
  };

  if (!user || !role) return null;

  const renderDashboard = () => {
    const currentPage = page || "dashboard";
    switch (role) {
      case "member":   return <MemberDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "leader":   return <LeaderDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "judge":    return <JudgeDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "mentor":   return <MentorDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "admin":    return <AdminDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "research": return <ResearchDashboard currentPage={currentPage} />;
      default:         return <AdminDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
    }
  };

  return (
    <Layout
      role={role}
      currentPage={page || "dashboard"}
      onNavigate={handlePageNavigate}
      onRoleChange={handleRoleChange}
      isDark={isDark}
      onToggleDark={() => setIsDark(v => !v)}
    >
      {renderDashboard()}
    </Layout>
  );
}



function AuthRoute() {
  const { user, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/hub";

  if (user) {
    return <Navigate to={from} replace />;
  }

  return <AuthPages onLogin={() => {
    const freshUser = loadUser<any>();
    if (freshUser) {
      setAuth(freshUser);
    }
    navigate("/hub");
  }} />;
}

function LandingRoute() {
  const navigate = useNavigate();
  return <LandingPage onGoToAuth={() => navigate("/login")} />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        index: true,
        element: <LandingRoute />,
      },
      {
        path: "login",
        element: <AuthRoute />,
      },
      {
        path: "/",
        element: <RequireAuth />,
        children: [
          { path: "hub", element: <HubRoute /> },
          { path: ":role", element: <Navigate to="/hub" replace /> },
          { path: ":role/:page", element: <MainLayout /> },
        ],
      },
    ],
  },
]);
