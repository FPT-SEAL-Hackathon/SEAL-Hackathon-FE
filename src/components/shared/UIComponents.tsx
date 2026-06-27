import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "motion/react";

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
  textMuted: "var(--text-muted)",
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

// Status Badge
export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; color: string; label: string; border: string }> = {
    active:        { bg: "rgba(0,148,68,0.1)",   color: "#007535", label: "Active",       border: "rgba(0,148,68,0.22)" },
    pending_approval: { bg: "rgba(245,158,11,0.1)", color: "#b45309", label: "Pending Approval", border: "rgba(245,158,11,0.22)" },
    temporary:     { bg: "rgba(244,121,32,0.1)", color: "#b25310", label: "Temporary", border: "rgba(244,121,32,0.22)" },
    unverified:    { bg: "rgba(100,70,30,0.07)", color: "#7a5c3a", label: "Unverified", border: "rgba(100,70,30,0.14)" },
    suspended:     { bg: "rgba(229,62,46,0.1)",  color: "#c0392b", label: "Suspended", border: "rgba(229,62,46,0.2)" },
    pending:       { bg: "rgba(245,158,11,0.1)", color: "#b45309", label: "Pending",      border: "rgba(245,158,11,0.22)" },
    submitted:     { bg: "rgba(244,121,32,0.1)", color: "#b25310", label: "Submitted",    border: "rgba(244,121,32,0.22)" },
    approved:      { bg: "rgba(0,148,68,0.1)",   color: "#007535", label: "Approved",     border: "rgba(0,148,68,0.22)" },
    rejected:      { bg: "rgba(229,62,46,0.1)",  color: "#c0392b", label: "Rejected",     border: "rgba(229,62,46,0.2)" },
    in_progress:   { bg: "rgba(244,121,32,0.1)", color: "#b25310", label: "In Progress",  border: "rgba(244,121,32,0.22)" },
    completed:     { bg: "rgba(0,148,68,0.1)",   color: "#007535", label: "Completed",    border: "rgba(0,148,68,0.22)" },
    draft:         { bg: "rgba(100,70,30,0.07)", color: "#7a5c3a", label: "Draft",        border: "rgba(100,70,30,0.14)" },
    disqualified:  { bg: "rgba(229,62,46,0.1)",  color: "#c0392b", label: "Disqualified", border: "rgba(229,62,46,0.2)" },
    finalist:      { bg: "rgba(245,158,11,0.1)", color: "#b45309", label: "Finalist",     border: "rgba(245,158,11,0.22)" },
    winner:        { bg: "rgba(244,121,32,0.12)", color: "#c06010", label: "Winner",      border: "rgba(244,121,32,0.3)" },
    open:          { bg: "rgba(0,148,68,0.1)",   color: "#007535", label: "Open",         border: "rgba(0,148,68,0.22)" },
    closed:        { bg: "rgba(100,70,30,0.07)", color: "#7a5c3a", label: "Closed",       border: "rgba(100,70,30,0.14)" },
    scoring:       { bg: "rgba(244,121,32,0.1)", color: "#b25310", label: "Scoring",      border: "rgba(244,121,32,0.22)" },
    calibration:   { bg: "rgba(245,158,11,0.1)", color: "#b45309", label: "Calibration",  border: "rgba(245,158,11,0.22)" },
    scheduled:     { bg: "rgba(244,121,32,0.08)", color: "#b25310", label: "Scheduled",   border: "rgba(244,121,32,0.18)" },
    upcoming:      { bg: "rgba(0,148,68,0.08)",  color: "#007535", label: "Upcoming",     border: "rgba(0,148,68,0.18)" },
  };
  const cfg = configs[status] || { bg: "rgba(100,70,30,0.07)", color: "#7a5c3a", label: status, border: "rgba(100,70,30,0.14)" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full"
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

// Stat Card
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: ReactNode;
  color?: string;
  subtitle?: string;
}
export function StatCard({ title, value, trend, icon, color = COLORS.primary, subtitle }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 16px 48px rgba(180,100,20,0.13), 0 4px 16px rgba(180,100,20,0.07), inset 0 1px 0 rgba(255,255,255,0.98)" }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl p-5"
      style={glassSurface}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 44,
            height: 44,
            background: `${color}12`,
            border: `1px solid ${color}22`,
            boxShadow: `0 4px 16px ${color}18`,
          }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{
              background: trend >= 0 ? "rgba(0,148,68,0.1)" : "rgba(229,62,46,0.1)",
              color: trend >= 0 ? "#007535" : "#c0392b",
              fontSize: 11,
              fontWeight: 600,
              border: `1px solid ${trend >= 0 ? "rgba(0,148,68,0.2)" : "rgba(229,62,46,0.2)"}`,
            }}
          >
            {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, opacity: 0.7 }}>{subtitle}</div>}
    </motion.div>
  );
}

// Card
export function Card({ children, className = "", style = {} }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ ...glassSurface, ...style }}>
      {children}
    </div>
  );
}

// Button
interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  style?: React.CSSProperties;
}
export function Button({ children, variant = "primary", size = "md", onClick, disabled, className = "", icon, fullWidth, style }: ButtonProps) {
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "8px 16px", fontSize: 13 },
    lg: { padding: "12px 24px", fontSize: 14 },
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #F47920, #FF9040)",
      color: "white",
      border: "1px solid rgba(244,121,32,0.3)",
      boxShadow: "0 4px 16px rgba(244,121,32,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
    },
    secondary: {
      background: "linear-gradient(135deg, #009444, #00B855)",
      color: "white",
      border: "1px solid rgba(0,148,68,0.3)",
      boxShadow: "0 4px 16px rgba(0,148,68,0.3)",
    },
    outline: {
      background: "rgba(244,121,32,0.06)",
      color: "#c06010",
      border: "1px solid rgba(244,121,32,0.3)",
    },
    ghost: {
      background: "rgba(100,70,30,0.05)",
      color: "#7a5c3a",
      border: "1px solid rgba(100,70,30,0.1)",
    },
    danger: {
      background: "linear-gradient(135deg, #e53e2e, #ff6b5b)",
      color: "white",
      border: "1px solid rgba(229,62,46,0.3)",
      boxShadow: "0 4px 16px rgba(229,62,46,0.3)",
    },
  };
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-150 cursor-pointer ${fullWidth ? "w-full justify-center" : ""} ${className}`}
      style={{ ...variants[variant], ...sizes[size], opacity: disabled ? 0.4 : 1, letterSpacing: "0.01em", ...style }}
    >
      {icon && icon}
      {children}
    </motion.button>
  );
}

// Progress Bar
export function ProgressBar({ value, max = 100, color = COLORS.primary, label }: { value: number; max?: number; color?: string; label?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textPrimary }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="rounded-full overflow-hidden" style={{ height: 5, background: "rgba(244,121,32,0.1)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="rounded-full"
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 8px ${color}50`,
          }}
        />
      </div>
    </div>
  );
}

// Table
interface Column { key: string; label: string; render?: (val: any, row: any) => ReactNode }
export function DataTable({ columns, data }: { columns: Column[]; data: Record<string, any>[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl" style={glassSurface}>
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "rgba(244,121,32,0.04)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3.5"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#a07850",
                  letterSpacing: "0.08em",
                  borderBottom: "1px solid rgba(244,121,32,0.09)",
                }}
              >
                {col.label.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <motion.tr
              key={i}
              whileHover={{ background: "rgba(244,121,32,0.04)" }}
              style={{ borderBottom: i < data.length - 1 ? "1px solid rgba(244,121,32,0.07)" : "none" }}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5" style={{ fontSize: 13.5, color: COLORS.textPrimary }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Section Header
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Avatar Group
export function AvatarGroup({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const extra = names.length - max;
  const colors = [
    ["#F47920", "#FF9040"],
    ["#009444", "#00B855"],
    ["#F59E0B", "#FBBF24"],
    ["#009444", "#F47920"],
    ["#FF9040", "#009444"],
  ];
  return (
    <div className="flex -space-x-2 mt-3">
      {shown.map((name, i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded-full text-white"
          style={{
            width: 30,
            height: 30,
            background: `linear-gradient(135deg, ${colors[i % colors.length][0]}, ${colors[i % colors.length][1]})`,
            fontSize: 11,
            fontWeight: 700,
            border: "2px solid rgba(255,248,240,0.9)",
            boxShadow: `0 2px 8px ${colors[i % colors.length][0]}40`,
          }}
          title={name}
        >
          {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 30,
            height: 30,
            background: "rgba(244,121,32,0.1)",
            fontSize: 10,
            fontWeight: 700,
            color: "#a07850",
            border: "2px solid rgba(255,248,240,0.9)",
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// Empty State
export function EmptyState({ icon, title, subtitle, action }: { icon: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4" style={{ fontSize: 48, opacity: 0.25 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, maxWidth: 300 }}>{subtitle}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Tabs
export function Tabs({ tabs, activeTab, onTabChange }: { tabs: { key: string; label: string }[]; activeTab: string; onTabChange: (key: string) => void }) {
  return (
    <div
      className="flex gap-1 p-1 rounded-2xl mb-6"
      style={{
        background: "rgba(244,121,32,0.06)",
        border: "1px solid rgba(244,121,32,0.12)",
        width: "fit-content",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {tabs.map((tab) => (
        <motion.button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 rounded-xl transition-all duration-150 relative"
          style={{
            background: activeTab === tab.key ? "rgba(255,255,255,0.9)" : "transparent",
            color: activeTab === tab.key ? "#c06010" : "#a07850",
            fontSize: 13,
            fontWeight: activeTab === tab.key ? 600 : 400,
            border: activeTab === tab.key ? "1px solid rgba(244,121,32,0.2)" : "1px solid transparent",
            boxShadow: activeTab === tab.key ? "0 2px 8px rgba(244,121,32,0.12)" : "none",
          }}
        >
          {tab.label}
        </motion.button>
      ))}
    </div>
  );
}

// Score Slider
export function ScoreSlider({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.textPrimary }}>{label}</span>
        <span
          className="px-2 py-0.5 rounded-lg"
          style={{
            background: "rgba(244,121,32,0.1)",
            color: "#c06010",
            fontSize: 12,
            fontWeight: 700,
            border: "1px solid rgba(244,121,32,0.2)",
          }}
        >
          {value} / {max}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: COLORS.primary, height: 4 }}
      />
      <div className="flex justify-between" style={{ fontSize: 10, color: "rgba(100,70,30,0.45)" }}>
        <span>0</span>
        <span>{max / 2}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// Timeline Item
export function TimelineItem({ date, title, description, status, color }: { date: string; title: string; description?: string; status?: string; color?: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="rounded-full flex-shrink-0"
          style={{
            width: 10,
            height: 10,
            background: color || COLORS.primary,
            marginTop: 4,
            boxShadow: `0 0 8px ${color || COLORS.primary}60`,
          }}
        />
        <div className="flex-1 w-px mt-1" style={{ background: "rgba(244,121,32,0.15)", minHeight: 28 }} />
      </div>
      <div className="pb-5">
        <div style={{ fontSize: 11, color: "#a07850", letterSpacing: "0.01em" }}>{date}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.textPrimary, marginTop: 2 }}>{title}</div>
        {description && <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{description}</div>}
        {status && <div className="mt-2"><StatusBadge status={status} /></div>}
      </div>
    </div>
  );
}

export { COLORS };
