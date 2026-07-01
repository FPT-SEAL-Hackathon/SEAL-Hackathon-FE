import { useState } from "react";
import { type Role } from "@/auth/rbac/roles";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AppSettingsModal } from "./AppSettingsModal";
import { COLORS, roleColors } from "./constants";

export { COLORS, roleColors };

interface LayoutProps {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  onRoleChange: () => void;
  children: React.ReactNode;
  userName?: string;
  isDark?: boolean;
  onToggleDark?: () => void;
}

export function Layout({
  role,
  currentPage,
  onNavigate,
  onRoleChange,
  children,
  userName = "Alex Johnson",
  isDark = false,
  onToggleDark,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState({
    dateFormat: "DD/MM/YYYY",
    itemsPerPage: "10",
    emailNotif: true,
    inAppNotif: true,
    deadlineReminder: true,
    showProfilePublic: true,
    showTeamInfo: true,
    compactMode: false,
    soundEnabled: false,
  });

  const accentColor = roleColors[role] || COLORS.primary;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
    >
      <Sidebar
        role={role}
        currentPage={currentPage}
        onNavigate={onNavigate}
        onRoleChange={onRoleChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setAppSettingsOpen={setAppSettingsOpen}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar
          userName={userName}
          role={role}
          onNavigate={onNavigate}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "transparent" }}>
          {children}
        </main>
      </div>

      <AppSettingsModal
        appSettingsOpen={appSettingsOpen}
        setAppSettingsOpen={setAppSettingsOpen}
        appSettings={appSettings}
        setAppSettings={setAppSettings}
        isDark={isDark}
        onToggleDark={onToggleDark || (() => {})}
        accentColor={accentColor}
      />
    </div>
  );
}
