import { useState, useRef } from "react";
import { getMenuForRole } from "@/auth/permissions/navigation";
import { type Role } from "@/auth/rbac/roles";
import { motion } from "motion/react";
import { LayoutDashboard, Zap, LogOut, Settings } from "lucide-react";
import { COLORS, roleColors, iconRegistry } from "./constants";

interface SidebarProps {
  role: Role;
  currentPage: string;
  onNavigate: (page: string) => void;
  onRoleChange: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setAppSettingsOpen: (open: boolean) => void;
}

export function Sidebar({
  role,
  currentPage,
  onNavigate,
  onRoleChange,
  sidebarOpen,
  setSidebarOpen,
  setAppSettingsOpen
}: SidebarProps) {
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menus = getMenuForRole(role);
  const accentColor = roleColors[role] || COLORS.primary;

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
    <>
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
            <img src="/logo_trans.png" alt="SEAL Logo" className="h-12 w-auto object-contain flex-shrink-0 filter drop-shadow-md" />
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
              const Icon = iconRegistry[item.icon] ?? LayoutDashboard;
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
            {/* Logout */}
            <button
              onClick={onRoleChange}
              className="relative flex items-center rounded-xl transition-colors duration-150"
              style={{ width: 260, height: 40, paddingLeft: 12, paddingRight: 12 }}
              title={!sidebarOpen ? "Logout" : undefined}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(244,121,32,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 24, height: 24 }}>
                <LogOut size={17} style={{ color: "#F47920" }} />
              </div>
              <span style={{ marginLeft: 10, fontSize: 13.5, color: "#F47920", whiteSpace: "nowrap", opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.18s ease", pointerEvents: "none" }}>
                Logout
              </span>
            </button>
          </div>
        </motion.aside>
      </div>
    </>
  );
}
