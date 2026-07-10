import { useState } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { DEFAULT_PAGE_BY_ROLE, canAccessPage } from "@/auth/permissions/permissions";
import { getRoleRouteSegment, isJudge, isOrganizer, isStudent, normalizeRole, type Role, ROLES } from "@/auth/rbac/roles";
import { useAuth } from "@/features/auth/store/authStore";
import { AuthPages } from "@/features/auth/pages/AuthPages";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { OAuthSuccessPage } from "@/features/auth/pages/OAuthSuccessPage";
import { CompleteProfilePage } from "@/features/auth/pages/CompleteProfilePage";
import { LinkAccountPage } from "@/features/auth/pages/LinkAccountPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { LandingPage } from "@/pages/landing/LandingPage";
import { Layout } from "@/components/layouts/Layout";
import { MemberDashboard } from "@/pages/member/MemberDashboard";
import { JudgeDashboard } from "@/pages/judge/JudgeDashboard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { MentorDashboard } from "@/pages/mentor/MentorDashboard";
import { LeaderDashboard } from "@/pages/leader/LeaderDashboard";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { DevHub } from "@/pages/dev/DevHub";

function RequireAuth() {
  const { isAuthenticated, role, user } = useAuth();
  const location = useLocation();
  const isDevMode = localStorage.getItem("seal_dev_mode") === "true";

  // In dev mode, allow access without real auth (roles are injected by DevRoute handleNavigate)
  if (isDevMode && !isAuthenticated) {
    return <Outlet />;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User OAuth TEMPORARY phải hoàn thiện hồ sơ trước khi vào dashboard.
  if (user?.accountStatus?.toUpperCase() === "TEMPORARY" && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}

function RequireAuthOnly() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isDevMode = localStorage.getItem("seal_dev_mode") === "true";

  if (isDevMode && !isAuthenticated) {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// ─── Dev Hub guard ──────────────────────────────────────────────────────────
const DEV_ROLE_MAP: Record<string, string> = {
  member: "ROLE_MEMBER",
  leader: "ROLE_LEADER",
  judge: "ROLE_INTERNAL_JUDGE",
  mentor: "ROLE_MENTOR",
  admin: "ROLE_ORGANIZER",
};

function DevRoute() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const isDevMode = localStorage.getItem("seal_dev_mode") === "true";
  if (!isDevMode) return <Navigate to="/login" replace />;

  const handleNavigate = (roleName: string, page: string) => {
    // Inject mock user so auth guards pass
    const roleCode = DEV_ROLE_MAP[roleName] ?? "ROLE_MEMBER";
    setAuth({
      userId: "dev-user-id",
      fullName: `Dev ${roleName.charAt(0).toUpperCase() + roleName.slice(1)}`,
      email: "dev@seal.dev",
      role: roleCode,
      phone: "",
      studentCode: "DEV001",
      universityName: "FPT University",
      accountStatus: "ACTIVE",
    } as any);
    navigate(`/${roleName}/${page}`);
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
      onLogin={(loginPayload) => {
        // Dev bypass shortcut
        if (loginPayload === "__dev__") {
          navigate("/dev", { replace: true });
          return;
        }
        if (typeof loginPayload === "string") {
          const nextRole = roleFromUser(loginPayload);
          navigate(from || getDefaultPath(nextRole), { replace: true });
          return;
        }
        const nextRole = roleFromUser(loginPayload.role);
        if (!loginPayload.accountStatus || loginPayload.accountStatus.toUpperCase() !== "ACTIVE") {
          throw new Error("Login succeeded, but your account is not active.");
        }
        setAuth(loginPayload);
        navigate(from || getDefaultPath(nextRole), { replace: true });
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

  const [navKey, setNavKey] = useState(0);

  const handlePageNavigate = (newPage: string, options?: { state?: any }) => {
    if (newPage === page) {
      setNavKey(prev => prev + 1);
    }
    if (!canAccessPage(role, newPage)) {
      navigate("/403");
      return;
    }
    navigate(`/${getRoleRouteSegment(role)}/${newPage}`, options);
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
      <DashboardByRole role={role} currentPage={page} onNavigate={handlePageNavigate} navKey={navKey} />
    </Layout>
  );
}

function DashboardByRole({ role, currentPage, onNavigate, navKey }: { role: Role; currentPage: string; onNavigate: (page: string, options?: { state?: any }) => void; navKey?: number }) {
  if (role === ROLES.EXPERT) {
    const mentorPages = ["dashboard", "categories", "tracks", "teams", "consultations", "progress", "schedule"];
    if (mentorPages.includes(currentPage)) {
      return <MentorDashboard currentPage={currentPage} onNavigate={onNavigate} />;
    }
    return <JudgeDashboard currentPage={currentPage} onNavigate={onNavigate} navKey={navKey} />;
  }
  if (isStudent(role)) {
    return <MemberDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
  if (isJudge(role)) {
    return <JudgeDashboard currentPage={currentPage} onNavigate={onNavigate} navKey={navKey} />;
  }
  if (isOrganizer(role)) {
    return <AdminDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
  if (role === ROLES.MENTOR) {
    return <MentorDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
  if (role === ROLES.LEADER || role === ROLES.MEMBER) {
    return <LeaderDashboard currentPage={currentPage} onNavigate={onNavigate} />;
  }
  return null;
}

function getDefaultPath(role: Role): string {
  return `/${getRoleRouteSegment(role)}/${DEFAULT_PAGE_BY_ROLE[role]}`;
}

function roleFromUser(roleCode: string): Role {
  const role = normalizeRole(roleCode);
  if (!role) throw new Error("Login succeeded, but the app could not open your dashboard.");
  return role;
}

export const router = createBrowserRouter([
  { path: "/", element: <HomeRoute /> },
  { path: "/login", element: <AuthRoute mode="login" /> },
  { path: "/register", element: <AuthRoute mode="register" /> },
  { path: "/verify-email", element: <VerifyEmailPage /> },
  { path: "/oauth2/success", element: <OAuthSuccessPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/403", element: <ForbiddenPage /> },
  { path: "/dev", element: <DevRoute /> },
  {
    path: "/",
    element: <RequireAuthOnly />,
    children: [
      { path: "complete-profile", element: <CompleteProfilePage /> },
      { path: "link-account", element: <LinkAccountPage /> },
    ],
  },
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
