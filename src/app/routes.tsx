import { createBrowserRouter, Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { DEFAULT_PAGE_BY_ROLE, canAccessPage } from "@/auth/permissions/permissions";
import { getRoleRouteSegment, isJudge, isOrganizer, isStudent, normalizeRole, type Role } from "@/auth/rbac/roles";
import { useAuth } from "@/features/auth/store/authStore";
import { AuthPages } from "@/features/auth/pages/AuthPages";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { LandingPage } from "@/pages/landing/LandingPage";
import { Layout } from "@/components/layouts/Layout";
import { MemberDashboard } from "@/pages/member/MemberDashboard";
import { JudgeDashboard } from "@/pages/judge/JudgeDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { DevHub } from "@/pages/dev/DevHub";

function RequireAuth() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// ─── Dev Hub guard ──────────────────────────────────────────────────────────
function DevRoute() {
  const navigate = useNavigate();
  const isDevMode = localStorage.getItem("seal_dev_mode") === "true";
  if (!isDevMode) return <Navigate to="/login" replace />;

  const handleNavigate = (role: string, page: string) => {
    navigate(`/${role}/${page}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("seal_dev_mode");
    navigate("/", { replace: true });
  };

  return <DevHub onNavigate={handleNavigate} onLogout={handleLogout} />;
}

function getValidRedirectPath(role: Role, fromPath?: string): string {
  const defaultPath = getDefaultPath(role);
  if (!fromPath) return defaultPath;
  
  const roleSegment = getRoleRouteSegment(role);
  const validPrefix = `/${roleSegment}`;
  
  if (fromPath.startsWith(validPrefix + "/") || fromPath === validPrefix) {
    return fromPath;
  }
  
  return defaultPath;
}

function HomeRoute() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  if (!isAuthenticated || !role) {
    return (
      <LandingPage
        onGoToLogin={() => navigate("/login")}
        onGoToRegister={() => navigate("/register")}
      />
    );
  }
  return <Navigate to={getDefaultPath(role)} replace />;
}

function RoleRedirect() {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultPath(role)} replace />;
}

function AuthRoute({ mode }: { mode: "login" | "register" }) {
  const { isAuthenticated, role, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  if (isAuthenticated && role) {
    return <Navigate to={getValidRedirectPath(role, from)} replace />;
  }

  return (
    <AuthPages
      mode={mode}
      onBackToLanding={() => navigate("/", { replace: true })}
      onLogin={(roleOrMarker) => {
        // Dev bypass shortcut
        if (roleOrMarker === "__dev__") {
          navigate("/dev", { replace: true });
          return;
        }
        const raw = localStorage.getItem("seal_user");
        if (!raw) return;
        const user = JSON.parse(raw);
        setAuth(user);
        const nextRole = roleFromUserType(user.userType);
        navigate(getValidRedirectPath(nextRole, from), { replace: true });
      }}
      onSwitchToLogin={() => navigate("/login", { state: location.state })}
      onSwitchToRegister={() => navigate("/register", { state: location.state })}
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
    navigate("/login", { replace: true, state: null });
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
  { path: "/login", element: <AuthRoute mode="login" /> },
  { path: "/register", element: <AuthRoute mode="register" /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/403", element: <ForbiddenPage /> },
  { path: "/dev", element: <DevRoute /> },
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
