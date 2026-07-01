import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Bell } from "lucide-react";
import { notificationService } from "@/features/notifications/api/notificationService";
import { COLORS, roleColors, roleProfileKey } from "./constants";
import { getRoleLabel, type Role } from "@/auth/rbac/roles";

interface TopbarProps {
  userName: string;
  role: Role;
  onNavigate: (page: string) => void;
}

export function Topbar({ userName, role, onNavigate }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; senderName?: string; time: string; read: boolean }>>([]);
  const accentColor = roleColors[role] || COLORS.primary;
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2);
  const notifCount = notifications.filter(notification => !notification.read).length;

  useEffect(() => {
    notificationService.getMyNotifications(0, 5)
      .then(page => {
        setNotifications((page.content ?? []).map(notification => ({
          id: notification.notificationId,
          title: notification.title,
          body: notification.body,
          senderName: notification.senderName,
          time: new Date(notification.createdAt).toLocaleString(),
          read: notification.read,
        })));
      })
      .catch(() => {});
  }, []);

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(notification => (
      notification.id === id ? { ...notification, read: true } : notification
    )));
    try {
      await notificationService.markAsRead(id);
    } catch { /* keep local read state */ }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch { /* keep local read state */ }
  };

  useEffect(() => {
    const handleClickOutside = () => setNotifOpen(false);
    if (notifOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [notifOpen]);

  return (
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
                <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--glass-border-subtle)" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Notifications</span>
                  {notifCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      style={{ fontSize: 11, color: accentColor, fontWeight: 700 }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
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
                      className="rounded-full"
                      style={{ width: 7, height: 7, marginTop: 6, flexShrink: 0, background: n.read ? "var(--text-muted)" : accentColor }}
                    />
                    <div className="min-w-0">
                      {n.senderName && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: accentColor, marginBottom: 1 }}>
                          {n.senderName}
                        </div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.35 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{n.time}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "var(--glass-border-subtle)" }} />

        {/* User — click navigates directly to profile */}
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
  );
}
