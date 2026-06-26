import { createBrowserRouter, Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { DEFAULT_PAGE_BY_ROLE, canAccessPage } from "@/auth/permissions/permissions";
import { getRoleRouteSegment, isJudge, isOrganizer, isStudent, normalizeRole, type Role } from "@/auth/rbac/roles";
import { useAuth } from "@/features/auth/store/authStore";
import { AuthPages } from "@/features/auth/pages/AuthPages";
import { LandingPage } from "@/pages/landing/LandingPage";
import { Layout } from "@/components/layouts/Layout";
import { MemberDashboard } from "@/pages/member/MemberDashboard";
import { JudgeDashboard } from "@/pages/judge/JudgeDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ForbiddenPage } from "@/pages/ForbiddenPage";

function RequireAuth() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function HomeRoute() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  if (!isAuthenticated || !role) return <LandingPage onGoToAuth={() => navigate("/login")} />;
  return <Navigate to={getDefaultPath(role)} replace />;
}

function RoleRedirect() {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultPath(role)} replace />;
}

function AuthRoute() {
  const { isAuthenticated, role, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  if (isAuthenticated && role) {
    return <Navigate to={from || getDefaultPath(role)} replace />;
  }

  return (
    <AuthPages
      onBackToLanding={() => navigate("/", { replace: true })}
      onLogin={() => {
        const raw = localStorage.getItem("seal_user");
        if (!raw) return;
        const user = JSON.parse(raw);
        setAuth(user);
        const nextRole = roleFromUserType(user.userType);
        navigate(from || getDefaultPath(nextRole), { replace: true });
      }}
    />
  );
}

function MainLayout() {
  const { role, user, signOut } = useAuth();
  const params = useParams();
  const navigate = useNavigate();

  if (!role) return <Navigate to="/login" replace />;

  const routeRole = params.role;
  const page = params.page ?? DEFAULT_PAGE_BY_ROLE[role];

  if (routeRole !== getRoleRouteSegment(role)) {
    return <Navigate to="/403" replace />;
  }

  if (!canAccessPage(role, page)) {
    return <Navigate to="/403" replace />;
  }

  const handlePageNavigate = (newPage: string) => {
    if (!canAccessPage(role, newPage)) {
      navigate("/403");
      return;
    }
    navigate(`/${getRoleRouteSegment(role)}/${newPage}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <Layout
      role={role}
      currentPage={page}
      onNavigate={handlePageNavigate}
      onRoleChange={handleLogout}
      userName={user?.fullName ?? "User"}
    >
      <DashboardByRole role={role} currentPage={page} onNavigate={handlePageNavigate} />
    </Layout>
  );
}

function DashboardByRole({ role, currentPage, onNavigate }: { role: Role; currentPage: string; onNavigate: (page: string) => void }) {
  if (isStudent(role)) {
    return <MemberDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
  if (isJudge(role)) {
    return <JudgeDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
  if (isOrganizer(role)) {
    return <AdminDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
  return null;
}

function getDefaultPath(role: Role): string {
  return `/${getRoleRouteSegment(role)}/${DEFAULT_PAGE_BY_ROLE[role]}`;
}

function roleFromUserType(userType: string): Role {
  const role = normalizeRole(userType);
  if (!role) throw new Error(`Unsupported user type: ${userType}`);
  return role;
}

export const router = createBrowserRouter([
  { path: "/", element: <HomeRoute /> },
  { path: "/login", element: <AuthRoute /> },
  { path: "/403", element: <ForbiddenPage /> },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      { path: "dashboard", element: <RoleRedirect /> },
      { path: ":role", element: <RoleRedirect /> },
      { path: ":role/:page", element: <MainLayout /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
