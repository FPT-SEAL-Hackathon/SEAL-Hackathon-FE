import { createBrowserRouter, Navigate, Outlet, useParams, useNavigate, useLocation } from "react-router";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { AuthPages } from "./components/auth/AuthPages";
import { Layout } from "./components/shared/Layout";
import { MemberDashboard } from "./components/member/MemberDashboard";
import { LeaderDashboard } from "./components/leader/LeaderDashboard";
import { JudgeDashboard } from "./components/judge/JudgeDashboard";
import { MentorDashboard } from "./components/mentor/MentorDashboard";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ResearchDashboard } from "./components/research/ResearchDashboard";

const roleDefaultPages: Record<string, string> = {
  member:   "dashboard",
  leader:   "dashboard",
  judge:    "rounds",
  mentor:   "tracks",
  admin:    "dashboard",
  research: "variance",
};

function RequireAuth() {
  const { authenticated, currentRole } = useAuth();
  const location = useLocation();

  if (!authenticated || !currentRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function RoleRedirect() {
  const { currentRole } = useAuth();
  if (!currentRole) return <Navigate to="/login" replace />;
  return <Navigate to={`/${currentRole}/${roleDefaultPages[currentRole] ?? "dashboard"}`} replace />;
}

function MainLayout() {
  const { currentRole, logout, isDark, toggleDark } = useAuth();
  const { page } = useParams();
  const navigate = useNavigate();

  const handlePageNavigate = (newPage: string) => {
    navigate(`/${currentRole}/${newPage}`);
  };

  const handleRoleChange = () => {
    logout();
    navigate("/login");
  };

  if (!currentRole) return null;

  const renderDashboard = () => {
    const currentPage = page || "dashboard";
    switch (currentRole) {
      case "member":
        return <MemberDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "leader":
        return <LeaderDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "judge":
        return <JudgeDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "mentor":
        return <MentorDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "admin":
        return <AdminDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
      case "research":
        return <ResearchDashboard currentPage={currentPage} />;
      default:
        return <MemberDashboard currentPage={currentPage} onNavigate={handlePageNavigate} />;
    }
  };

  return (
    <Layout
      role={currentRole}
      currentPage={page || "dashboard"}
      onNavigate={handlePageNavigate}
      onRoleChange={handleRoleChange}
      isDark={isDark}
      onToggleDark={toggleDark}
    >
      {renderDashboard()}
    </Layout>
  );
}

function AuthRoute() {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  if (authenticated) {
    return <Navigate to={from} replace />;
  }

  return <AuthPages onLogin={(role) => {
    login(role);
    navigate(`/${role}/${roleDefaultPages[role] ?? "dashboard"}`);
  }} />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        path: "login",
        element: <AuthRoute />,
      },
      {
        path: "/",
        element: <RequireAuth />,
        children: [
          { index: true, element: <RoleRedirect /> },
          { path: ":role", element: <RoleRedirect /> },
          { path: ":role/:page", element: <MainLayout /> },
        ],
      },
    ],
  },
]);
