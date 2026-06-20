import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, Calendar, Trophy, Bell, Settings,
  FileText, Star, ClipboardList, BarChart2, Shield, Database,
  GitBranch, Clock, Award, Zap, BookOpen,
  LogOut, Search, ChevronDown,
  UserCheck, FolderOpen, Activity,
  Target, TrendingUp, PieChart, MessageSquare, User, Wrench
} from "lucide-react";


const COLORS = {
  primary: "#F47920",
  secondary: "#009444",
  accent: "#FF9040",
  success: "#009444",
  warning: "#F59E0B",
  error: "#e53e2e",
  bg: "var(--surface-bg)",
  card: "var(--glass-bg)",
  border: "var(--glass-border-subtle)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
};

const glassSurface: React.CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  borderTop: "1px solid var(--glass-border)",
  borderRight: "1px solid var(--glass-border)",
  borderBottom: "1px solid var(--glass-border)",
  borderLeft: "1px solid var(--glass-border)",
  boxShadow: "var(--glass-shadow)",
};

const roleMenus: Record<string, { icon: React.ElementType; label: string; key: string }[]> = {
  member: [
    { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
    { icon: Users, label: "My Team", key: "team" },
    { icon: Calendar, label: "Events", key: "events" },
    { icon: Trophy, label: "Leaderboard", key: "leaderboard" },
    { icon: Bell, label: "Notifications", key: "notifications" },
  ],
  leader: [
    { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
    { icon: Users, label: "Team Management", key: "team" },
    { icon: FolderOpen, label: "Submission Center", key: "submissions" },
    { icon: Trophy, label: "Rankings", key: "rankings" },
    { icon: Bell, label: "Notifications", key: "notifications" },
    { icon: MessageSquare, label: "Judge Feedback", key: "feedback" },
    { icon: Wrench, label: "Settings", key: "settings" },
  ],
  judge: [
    { icon: ClipboardList, label: "Assigned Rounds", key: "rounds" },
    { icon: FileText, label: "Submissions", key: "submissions" },
    { icon: Star, label: "Scoring", key: "scoring" },
    { icon: BarChart2, label: "Calibration", key: "calibration" },
    { icon: Clock, label: "History", key: "history" },
  ],
  mentor: [
    { icon: Target, label: "Assigned Tracks", key: "tracks" },
    { icon: Users, label: "Teams", key: "teams" },
    { icon: TrendingUp, label: "Mentoring Progress", key: "progress" },
    { icon: Calendar, label: "Schedule", key: "schedule" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Dashboard", key: "dashboard" },
    { icon: Calendar, label: "Events", key: "events" },
    { icon: BookOpen, label: "Categories", key: "categories" },
    { icon: GitBranch, label: "Rounds", key: "rounds" },
    { icon: Star, label: "Criteria", key: "criteria" },
    { icon: Users, label: "Users", key: "users" },
    { icon: UserCheck, label: "Assignments", key: "assignments" },
    { icon: Trophy, label: "Rankings", key: "rankings" },
    { icon: BarChart2, label: "Reports", key: "reports" },
    { icon: Bell, label: "Notifications", key: "notifications" },
    { icon: Shield, label: "Audit Logs", key: "audit" },
    { icon: Wrench, label: "Settings", key: "settings" },
  ],
  research: [
    { icon: Activity, label: "Variance Analytics", key: "variance" },
    { icon: PieChart, label: "Score Distribution", key: "distribution" },
    { icon: BarChart2, label: "Inter-rater Reliability", key: "reliability" },
    { icon: Database, label: "Data Export", key: "export" },
    { icon: Users, label: "Judge Comparison", key: "comparison" },
    { icon: FileText, label: "Research Stats", key: "stats" },
  ],
};

const roleProfileKey: Record<string, string | null> = {
  member: "profile",
  leader: "profile",
  judge: "profile",
  mentor: "profile",
  admin: "profile",
  research: null,
};

const roleLabels: Record<string, string> = {
  member: "Participant",
  leader: "Team Leader",
  judge: "Judge",
  mentor: "Mentor",
  admin: "Event Coordinator",
  research: "RBL Researcher",
};

const roleColors: Record<string, string> = {
  member: "#F47920",
  leader: "#009444",
  judge: "#F59E0B",
  mentor: "#009444",
  admin: "#e53e2e",
  research: "#F47920",
};

interface LayoutProps {
  role: string;
  currentPage: string;
  onNavigate: (page: string) => void;
  onRoleChange: () => void;
  children: React.ReactNode;
  userName?: string;
  isDark?: boolean;
  onToggleDark?: () => void;
}

export function Layout({ role, currentPage, onNavigate, onRoleChange, children, userName = "Alex Johnson", isDark = false, onToggleDark }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
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
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menus = roleMenus[role] || [];
  const accentColor = roleColors[role] || COLORS.primary;
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    const handleClickOutside = () => setNotifOpen(false);
    if (notifOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notifOpen]);

  const startOpenTimer = () => {
    if (sidebarOpen) return;
    openTimer.current = setTimeout(() => setSidebarOpen(true), 500);
  };

  const cancelOpenTimer = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const handleSidebarLeave = () => {
    cancelOpenTimer();
    setSidebarOpen(false);
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
    >
      {/* 64px placeholder — holds space in flex layout, never changes */}
      <div className="relative flex-shrink-0" style={{ width: 64, zIndex: 35 }}>

      {/* Sidebar — absolute, overlays content when expanded */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 64 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-0 left-0 h-full flex flex-col overflow-hidden"
        style={{
          background: "var(--sidebar-surface)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          borderRight: "1px solid var(--glass-border-subtle)",
          boxShadow: sidebarOpen
            ? "var(--sidebar-shadow-open, 4px 0 32px rgba(0,0,0,0.18))"
            : "var(--sidebar-shadow, 2px 0 8px rgba(0,0,0,0.08))",
        }}
        onMouseEnter={startOpenTimer}
        onMouseLeave={handleSidebarLeave}
      >
        {/* Logo — icon fixed at left, text fades in-place */}
        <div
          className="flex items-center flex-shrink-0"
          style={{
            borderBottom: "1px solid var(--glass-border-subtle)",
            width: 260,
            height: 72,
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          <div
            className="flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              background: "linear-gradient(135deg, #F47920, #FF9040)",
              boxShadow: "0 4px 16px rgba(244,121,32,0.4)",
            }}
          >
            <Zap size={20} color="white" />
          </div>
          <div
            style={{
              marginLeft: 12,
              opacity: sidebarOpen ? 1 : 0,
              transition: "opacity 0.18s ease",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>SEAL</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, opacity: 0.7 }}>FPT Hackathon</div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5" style={{ width: 260 }}>
          {menus.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="relative flex items-center rounded-xl transition-colors duration-150"
                style={{
                  width: 260,
                  height: 40,
                  paddingLeft: 12,
                  paddingRight: 12,
                  background: isActive ? `${accentColor}14` : "transparent",
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                {/* Active bar — absolutely positioned so it never affects icon */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                    style={{ width: 3, height: 20, background: accentColor, boxShadow: `0 0 8px ${accentColor}60` }}
                  />
                )}
                {/* Icon — always at same x position */}
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 24, height: 24 }}
                >
                  <Icon size={17} style={{ color: isActive ? accentColor : "var(--text-muted)" }} />
                </div>
                {/* Label — always mounted, fades via opacity only */}
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? accentColor : "var(--text-secondary)",
                    whiteSpace: "nowrap",
                    opacity: sidebarOpen ? 1 : 0,
                    transition: "opacity 0.18s ease",
                    pointerEvents: "none",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ borderTop: "1px solid var(--glass-border-subtle)", width: 260 }} className="py-2 space-y-0.5">
          {/* App Settings */}
          <button
            onClick={() => setAppSettingsOpen(true)}
            className="relative flex items-center rounded-xl transition-colors duration-150 hover:bg-orange-50"
            style={{ width: 260, height: 40, paddingLeft: 12, paddingRight: 12 }}
            title={!sidebarOpen ? "App Settings" : undefined}
          >
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24 }}>
              <Settings size={17} style={{ color: "var(--text-muted)" }} />
            </div>
            <span style={{ marginLeft: 10, fontSize: 13.5, color: "var(--text-secondary)", whiteSpace: "nowrap", opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.18s ease", pointerEvents: "none" }}>
              App Settings
            </span>
          </button>
          {/* Log Out */}
          <button
            onClick={onRoleChange}
            className="relative flex items-center rounded-xl transition-colors duration-150"
            style={{ width: 260, height: 40, paddingLeft: 12, paddingRight: 12 }}
            title={!sidebarOpen ? "Log Out" : undefined}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(229,62,46,0.06)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24 }}>
              <LogOut size={17} style={{ color: "#e53e2e" }} />
            </div>
            <span style={{ marginLeft: 10, fontSize: 13.5, color: "#e53e2e", whiteSpace: "nowrap", opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.18s ease", pointerEvents: "none" }}>
              Log Out
            </span>
          </button>
        </div>
      </motion.aside>
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{
            background: "var(--header-surface)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
            borderBottom: "1px solid var(--glass-border-subtle)",
            height: 64,
            boxShadow: "0 1px 0 rgba(255,255,255,0.9), 0 2px 16px rgba(180,100,20,0.05)",
            position: "relative",
            zIndex: 30,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-input)",
                  border: "1px solid var(--glass-border-subtle)",
                  color: "var(--text-primary)",
                  width: 220,
                  fontSize: 13,
                }}
                onFocus={e => {
                  e.currentTarget.style.background = "var(--glass-bg-hover, rgba(255,255,255,0.9))";
                  e.currentTarget.style.borderColor = "rgba(244,121,32,0.4)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(244,121,32,0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.background = "var(--surface-input)";
                  e.currentTarget.style.borderColor = "var(--glass-border-subtle)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { if (!notifOpen) setNotifCount(0); setNotifOpen(v => !v); }}
                className="relative flex items-center justify-center rounded-xl w-9 h-9 transition-colors"
                style={{
                  background: "var(--surface-input)",
                  border: "1px solid var(--glass-border-subtle)",
                }}
              >
                <Bell size={16} style={{ color: "var(--text-muted)" }} />
                <AnimatePresence>
                  {notifCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
                      style={{
                        width: 16,
                        height: 16,
                        background: "linear-gradient(135deg, #e53e2e, #ff6b5b)",
                        fontSize: 9,
                        fontWeight: 700,
                        boxShadow: "0 2px 8px rgba(229,62,46,0.45)",
                      }}
                    >
                      {notifCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-12 rounded-2xl z-50 overflow-hidden"
                    style={{
                      width: 320,
                      background: "var(--panel-surface)",
                      backdropFilter: "blur(32px) saturate(180%)",
                      WebkitBackdropFilter: "blur(32px) saturate(180%)",
                      border: "1px solid rgba(255,255,255,0.95)",
                      boxShadow: "0 24px 64px rgba(180,100,20,0.18), inset 0 1px 0 rgba(255,255,255,1)",
                    }}
                  >
                    <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--glass-border-subtle)" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Notifications</span>
                    </div>
                    <div className="px-4 py-6 text-center">
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>No notifications</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Account, team, and event updates will appear here.</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: "var(--glass-border-subtle)" }} />

            {/* User — click navigates directly to profile */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => { if (roleProfileKey[role]) onNavigate(roleProfileKey[role]!); }}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-colors"
              style={{
                background: "rgba(244,121,32,0.05)",
                cursor: roleProfileKey[role] ? "pointer" : "default",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full text-white"
                style={{
                  width: 32,
                  height: 32,
                  background: `linear-gradient(135deg, ${accentColor}, #FF9040)`,
                  fontSize: 13,
                  fontWeight: 700,
                  boxShadow: `0 2px 12px ${accentColor}40`,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div className="hidden md:block">
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{userName}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.02em" }}>{roleLabels[role]}</div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "transparent" }}>
          {children}
        </main>
      </div>

      {/* App Settings Panel */}
      <AnimatePresence>
        {appSettingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAppSettingsOpen(false)}
              className="fixed inset-0"
              style={{ background: "rgba(30,15,5,0.25)", backdropFilter: "blur(4px)", zIndex: 60 }}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full flex flex-col overflow-hidden"
              style={{
                width: 380,
                zIndex: 61,
                background: "var(--panel-surface)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                borderLeft: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "-24px 0 80px rgba(180,100,20,0.14)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 flex-shrink-0" style={{ height: 64, borderBottom: "1px solid var(--glass-border-subtle)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: "linear-gradient(135deg, #F47920, #FF9040)", boxShadow: "0 4px 12px rgba(244,121,32,0.35)" }}>
                    <Settings size={16} color="white" />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>App Settings</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setAppSettingsOpen(false)}
                  className="flex items-center justify-center rounded-xl w-8 h-8 transition-colors hover:bg-orange-50"
                  style={{ color: "var(--text-muted)" }}
                >
                  ✕
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

                {/* Appearance */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Appearance</div>
                  <div
                    className="flex items-center justify-between rounded-2xl px-4 py-3"
                    style={{ background: isDark ? "rgba(244,121,32,0.1)" : "rgba(244,121,32,0.05)", border: "1px solid var(--glass-border-subtle)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{ width: 36, height: 36, background: isDark ? "rgba(244,121,32,0.2)" : "rgba(30,15,5,0.08)" }}
                      >
                        <span style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Dark Mode</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{isDark ? "Dark interface is on" : "Light interface is on"}</div>
                      </div>
                    </div>
                    <motion.button
                      onClick={onToggleDark}
                      className="flex-shrink-0 rounded-full"
                      animate={{ backgroundColor: isDark ? accentColor : "rgba(180,150,120,0.25)" }}
                      style={{ width: 44, height: 24, position: "relative", cursor: "pointer", backgroundColor: isDark ? accentColor : "rgba(180,150,120,0.25)" }}
                    >
                      <motion.div
                        animate={{ x: isDark ? 22 : 2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="absolute rounded-full bg-white"
                        style={{ width: 20, height: 20, top: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
                      />
                    </motion.button>
                  </div>
                </section>

                <div style={{ height: 1, background: "var(--glass-border-subtle)" }} />

                {/* Display */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Display</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Date Format</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>How dates are displayed</div>
                      </div>
                      <select
                        value={appSettings.dateFormat}
                        onChange={e => setAppSettings(s => ({ ...s, dateFormat: e.target.value }))}
                        className="rounded-lg px-3 py-1.5 outline-none"
                        style={{ background: "var(--surface-input)", border: "1px solid var(--glass-border-subtle)", color: "var(--text-primary)", fontSize: 13 }}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Items Per Page</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Table pagination size</div>
                      </div>
                      <select
                        value={appSettings.itemsPerPage}
                        onChange={e => setAppSettings(s => ({ ...s, itemsPerPage: e.target.value }))}
                        className="rounded-lg px-3 py-1.5 outline-none"
                        style={{ background: "var(--surface-input)", border: "1px solid var(--glass-border-subtle)", color: "var(--text-primary)", fontSize: 13 }}
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                    <SettingsToggle
                      label="Compact Mode"
                      desc="Reduce spacing in tables and lists"
                      value={appSettings.compactMode}
                      accent={accentColor}
                      onChange={v => setAppSettings(s => ({ ...s, compactMode: v }))}
                    />
                  </div>
                </section>

                <div style={{ height: 1, background: "var(--glass-border-subtle)" }} />

                {/* Notifications */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Notifications</div>
                  <div className="space-y-3">
                    <SettingsToggle label="Email Notifications" desc="Receive updates via email" value={appSettings.emailNotif} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, emailNotif: v }))} />
                    <SettingsToggle label="In-App Notifications" desc="Show notification bell alerts" value={appSettings.inAppNotif} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, inAppNotif: v }))} />
                    <SettingsToggle label="Deadline Reminders" desc="Alert before submission deadlines" value={appSettings.deadlineReminder} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, deadlineReminder: v }))} />
                    <SettingsToggle label="Sound Effects" desc="Play sounds for alerts" value={appSettings.soundEnabled} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, soundEnabled: v }))} />
                  </div>
                </section>

                <div style={{ height: 1, background: "var(--glass-border-subtle)" }} />

                {/* Privacy */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Privacy</div>
                  <div className="space-y-3">
                    <SettingsToggle label="Public Profile" desc="Show your profile to other participants" value={appSettings.showProfilePublic} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, showProfilePublic: v }))} />
                    <SettingsToggle label="Show Team Info" desc="Let others see your team details" value={appSettings.showTeamInfo} accent={accentColor} onChange={v => setAppSettings(s => ({ ...s, showTeamInfo: v }))} />
                  </div>
                </section>

                <div style={{ height: 1, background: "var(--glass-border-subtle)" }} />

                {/* About */}
                <section>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>About</div>
                  <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(244,121,32,0.05)", border: "1px solid var(--glass-border-subtle)" }}>
                    <div className="flex justify-between">
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Platform</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>SEAL Hackathon</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Version</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>2.4.1</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Organization</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>FPT University</span>
                    </div>
                  </div>
                </section>

              </div>

              {/* Save button */}
              <div className="flex-shrink-0 px-6 py-4" style={{ borderTop: "1px solid var(--glass-border-subtle)" }}>
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setAppSettingsOpen(false)}
                  className="w-full py-3 rounded-xl text-white"
                  style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(244,121,32,0.4)" }}
                >
                  Save & Close
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsToggle({ label, desc, value, accent, onChange }: { label: string; desc: string; value: boolean; accent: string; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
      </div>
      <motion.button
        onClick={() => onChange(!value)}
        className="flex-shrink-0 rounded-full transition-colors"
        animate={{ background: value ? accent : "rgba(180,150,120,0.25)" }}
        style={{ width: 40, height: 22, position: "relative", cursor: "pointer" }}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute rounded-full bg-white"
          style={{ width: 18, height: 18, top: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
        />
      </motion.button>
    </div>
  );
}

export { COLORS, roleLabels, roleColors };

