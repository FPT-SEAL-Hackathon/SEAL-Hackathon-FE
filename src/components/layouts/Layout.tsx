import { useState, useRef, useEffect } from "react";
import { getMenuForRole } from "@/auth/permissions/navigation";
import { ROLES, getRoleLabel, type Role } from "@/auth/rbac/roles";
import { notificationService } from "@/features/notifications/api/notificationService";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, Calendar, Trophy, Bell, Settings,
  FileText, Star, ClipboardList, BarChart2, Shield, Database,
  GitBranch, Clock, Award, Zap, BookOpen,
  LogOut, Search, ChevronDown,
  UserCheck, FolderOpen, UserPlus,
  Target, TrendingUp, MessageSquare, User, Wrench, AlertCircle
} from "lucide-react";
import { COLORS } from "@/components/shared/UIComponents";

const roleColors: Record<string, string> = {
  ROLE_MEMBER: COLORS.primary,
  ROLE_LEADER: COLORS.secondary,
  ROLE_JUDGE: COLORS.warning,
  ROLE_MENTOR: COLORS.success,
  ROLE_EXPERT: COLORS.success,
  ROLE_ORGANIZER: COLORS.error,
};

export { COLORS, roleColors };

function formatNotificationTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

interface LayoutProps {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  onRoleChange: () => void;
  children: React.ReactNode;
  userName?: string;
  /** Called when "Mark all read" is triggered from the dropdown, so child pages can sync their own notification state */
  onMarkAllRead?: () => void;
}

/** Reusable toggle row used inside the App Settings panel. */
function SettingsToggle({
  label,
  desc,
  value,
  accent,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  accent: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
      </div>
      <div
        className="rounded-full flex items-center cursor-pointer transition-all"
        style={{ width: 40, height: 22, background: value ? accent : "var(--glass-border-subtle)", padding: "2px", flexShrink: 0 }}
        onClick={() => onChange(!value)}
      >
        <div
          className="rounded-full bg-white"
          style={{ width: 18, height: 18, transform: value ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s ease" }}
        />
      </div>
    </div>
  );
}

export function Layout({ role, currentPage, onNavigate, onRoleChange, children, userName = "Alex Johnson", onMarkAllRead }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const [hoveredNavKey, setHoveredNavKey] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; time: string; read: boolean }>>([]);
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
  const lockRouteScroll = role === "ROLE_ORGANIZER" && (currentPage === "users" || currentPage === "event-participants");

  // Hover-delay: open sidebar only after cursor lingers 200ms to avoid accidental triggers
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startOpenTimer = () => {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
    sidebarTimerRef.current = setTimeout(() => setSidebarOpen(true), 200);
  };

  const handleSidebarLeave = () => {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
    setSidebarOpen(false);
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const menus = getMenuForRole(role) ?? [];

  // Maps icon string names (from NavItem) to actual Lucide components
  const iconRegistry: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
    LayoutDashboard, Users, Calendar, Trophy, Bell, Settings,
    FileText, Star, ClipboardList, BarChart2, Shield, Database,
    GitBranch, Clock, Award, Zap, BookOpen,
    LogOut, Search, ChevronDown,
    UserCheck, FolderOpen, UserPlus,
    Target, TrendingUp, MessageSquare, User, Wrench, AlertCircle
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const notifCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let cancelled = false;
    let stream: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const loadNotifications = () => {
      notificationService.getMyNotifications(0, 10)
        .then(page => {
          if (cancelled) return;
          setNotifications(page.content.map(item => ({
            id: item.notificationId,
            title: item.title,
            body: item.body,
            time: formatNotificationTime(item.createdAt),
            read: item.read,
          })));
        })
        .catch(() => {
          if (!cancelled) setNotifications([]);
        });
    };

    const connectStream = () => {
      if (cancelled) return;
      if (stream) {
        stream.close();
      }
      
      stream = notificationService.createStream();
      if (!stream) return;

      stream.addEventListener("message", event => {
        try {
          const item = JSON.parse(event.data);
          setNotifications(prev => [{
            id: item.notificationId ?? item.id,
            title: item.title ?? "Notification",
            body: item.body ?? "",
            time: formatNotificationTime(item.createdAt ?? item.sentAt),
            read: Boolean(item.read ?? item.isRead),
          }, ...prev].slice(0, 10));
        } catch {
          // Ignore malformed SSE payloads.
        }
      });

      stream.addEventListener("error", () => {
        if (stream?.readyState === EventSource.CLOSED) {
          // Trigger a dummy API call to refresh the token if it expired, then reconnect
          notificationService.getUnreadCount()
            .then(() => {
              if (cancelled) return;
              clearTimeout(retryTimeout);
              retryTimeout = setTimeout(connectStream, 2000);
            })
            .catch(() => {
              // If completely unauthenticated, stop retrying aggressively
            });
        }
      });
    };

    loadNotifications();
    connectStream();

    return () => {
      cancelled = true;
      clearTimeout(retryTimeout);
      stream?.close();
    };
  }, []);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationService.markAllAsRead().catch(() => {});
    // Notify parent dashboard pages to re-sync their own notification state
    onMarkAllRead?.();
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notificationService.markAsRead(id).catch(() => {});
  };

  // ── User avatar ───────────────────────────────────────────────────────────
  const initials = userName
    .split(" ")
    .map((w: any) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Maps role to the profile page key used in navigation
  const roleProfileKey: Record<string, string> = {
    ROLE_ORGANIZER: "profile",
    ROLE_MEMBER: "profile",
    ROLE_LEADER: "profile",
    ROLE_JUDGE: "profile",
    ROLE_MENTOR: "profile",
    ROLE_EXPERT: "profile",
    ROLE_FPT_STUDENT: "profile",
    ROLE_EXTERNAL_STUDENT: "profile",
    ROLE_INTERNAL_JUDGE: "profile",
    ROLE_GUEST_JUDGE: "profile",
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
    >
      {/* 64px placeholder â€” holds space in flex layout, never changes */}
      <div className="relative flex-shrink-0" style={{ width: 64, zIndex: 35 }}>

        {/* Sidebar â€” absolute, overlays content when expanded */}
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
          {/* Logo â€” icon fixed at left, text fades in-place */}
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
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5" style={{ width: 260 }}>
            {menus.map((item) => {
              const Icon = iconRegistry[item.icon] ?? LayoutDashboard;
              const isActive = currentPage === item.key;
              const isHovered = hoveredNavKey === item.key;
              const isHighlighted = isActive || isHovered;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  onMouseEnter={() => setHoveredNavKey(item.key)}
                  onMouseLeave={() => setHoveredNavKey(null)}
                  className="relative flex items-center rounded-xl transition-all duration-200 ease-out"
                  style={{
                    width: "100%",
                    height: 40,
                    paddingLeft: 12,
                    paddingRight: 12,
                    boxSizing: "border-box",
                    background: isActive ? `${accentColor}18` : isHovered ? `${accentColor}0F` : "transparent",
                    boxShadow: isActive
                      ? `inset 0 0 0 1px ${accentColor}24`
                      : isHovered
                        ? `inset 0 0 0 1px ${accentColor}18, 0 6px 18px ${accentColor}12`
                        : "none",
                  }}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {/* Active bar â€” absolutely positioned so it never affects icon */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                      style={{ width: 3, height: 20, background: accentColor, boxShadow: `0 0 8px ${accentColor}60` }}
                    />
                  )}
                  {/* Icon â€” always at same x position */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 24,
                      height: 24,
                      transform: isHovered ? "scale(1.08)" : "scale(1)",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <Icon size={17} style={{ color: isHighlighted ? accentColor : "var(--text-muted)" }} />
                  </div>
                  {/* Label â€” always mounted, fades via opacity only */}
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 13.5,
                      fontWeight: isHighlighted ? 600 : 400,
                      color: isHighlighted ? accentColor : "var(--text-secondary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      opacity: sidebarOpen ? 1 : 0,
                      transition: "opacity 0.18s ease, color 0.2s ease",
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
            {/* Back to Dev Hub */}
            <button
              onClick={onRoleChange}
              className="relative flex items-center rounded-xl transition-colors duration-150"
              style={{ width: 260, height: 40, paddingLeft: 12, paddingRight: 12 }}
              title={!sidebarOpen ? "Log Out" : undefined}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(244,121,32,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24 }}>
                <LogOut size={17} style={{ color: "#F47920" }} />
              </div>
              <span style={{ marginLeft: 10, fontSize: 13.5, fontWeight: 500, color: "#F47920", whiteSpace: "nowrap", opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.18s ease", pointerEvents: "none" }}>
                Log Out
              </span>
            </button>
          </div>
        </motion.aside>
      </div>

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
                onClick={() => setNotifOpen(v => !v)}
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
                    className="absolute right-0 top-12 rounded-2xl z-50 flex flex-col"
                    style={{
                      width: 340,
                      maxHeight: 480,
                      background: "var(--panel-surface)",
                      backdropFilter: "blur(32px) saturate(180%)",
                      WebkitBackdropFilter: "blur(32px) saturate(180%)",
                      border: "1px solid rgba(255,255,255,0.95)",
                      boxShadow: "0 24px 64px rgba(180,100,20,0.18), inset 0 1px 0 rgba(255,255,255,1)",
                    }}
                  >
                    {/* Header — fixed, never scrolls */}
                    <div className="px-4 py-3.5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--glass-border-subtle)" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Notifications</span>
                      <div className="flex items-center gap-3">
                        {notifCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            style={{ fontSize: 11, color: accentColor, fontWeight: 700 }}
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setNotifOpen(false); onNavigate("notifications"); }}
                          style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}
                        >
                          See all
                        </button>
                      </div>
                    </div>
                    {/* Scrollable list */}
                    <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: "contain" }}>
                      {notifications.length === 0 && (
                        <div className="px-4 py-5" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          No notifications yet.
                        </div>
                      )}
                      {notifications.map((n, i) => (
                        <motion.div
                          key={n.id}
                          whileHover={{ background: "rgba(244,121,32,0.04)" }}
                          className="px-4 py-3.5 cursor-pointer flex gap-3 transition-colors"
                          onClick={() => markNotificationRead(n.id)}
                          style={{
                            borderBottom: i < notifications.length - 1 ? "1px solid rgba(244,121,32,0.07)" : "none",
                            background: n.read ? "transparent" : "rgba(244,121,32,0.06)",
                          }}
                        >
                          <span
                            className="rounded-full flex-shrink-0"
                            style={{ width: 7, height: 7, marginTop: 6, background: n.read ? "var(--text-muted)" : accentColor }}
                          />
                          <div className="min-w-0">
                            <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 600, color: "var(--text-primary)" }}>{n.title}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4, wordBreak: "break-word" }}>{n.body}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{n.time}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: "var(--glass-border-subtle)" }} />

            {/* User â€” click navigates directly to profile */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate(roleProfileKey[role])}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-colors"
              style={{
                background: "rgba(244,121,32,0.05)",
                cursor: "pointer",
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
                <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.02em" }}>{getRoleLabel(role)}</div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Page content */}
        <main
          className={`flex-1 min-h-0 ${lockRouteScroll ? "overflow-hidden" : "overflow-y-auto"}`}
          style={{ background: "transparent" }}
        >
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
