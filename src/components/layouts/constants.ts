import {
  LayoutDashboard, Users, Calendar, Trophy, Bell, Settings,
  FileText, Star, ClipboardList, BarChart2, Shield, Database,
  GitBranch, Clock, Award, Zap, BookOpen,
  LogOut, Search, ChevronDown,
  UserCheck, FolderOpen, UserPlus,
  Target, TrendingUp, MessageSquare, User, Wrench
} from "lucide-react";
import { ROLES, type Role } from "@/auth/rbac/roles";

export const COLORS = {
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

export const glassSurface: React.CSSProperties = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  borderTop: "1px solid var(--glass-border)",
  borderRight: "1px solid var(--glass-border)",
  borderBottom: "1px solid var(--glass-border)",
  borderLeft: "1px solid var(--glass-border)",
  boxShadow: "var(--glass-shadow)",
};

export const iconRegistry: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  Bell,
  FileText,
  Star,
  ClipboardList,
  BarChart2,
  Shield,
  GitBranch,
  Clock,
  Award,
  BookOpen,
  UserCheck,
  UserPlus,
  FolderOpen,
  Wrench,
};

export const roleProfileKey: Record<Role, string> = {
  [ROLES.FPT_STUDENT]: "profile",
  [ROLES.EXTERNAL_STUDENT]: "profile",
  [ROLES.INTERNAL_JUDGE]: "profile",
  [ROLES.GUEST_JUDGE]: "profile",
  [ROLES.ORGANIZER]: "profile",
  [ROLES.MENTOR]: "profile",
  [ROLES.LEADER]: "profile",
  [ROLES.MEMBER]: "profile",
};

export const roleColors: Record<Role, string> = {
  [ROLES.FPT_STUDENT]: "#F47920",
  [ROLES.EXTERNAL_STUDENT]: "#009444",
  [ROLES.INTERNAL_JUDGE]: "#F59E0B",
  [ROLES.GUEST_JUDGE]: "#7C3AED",
  [ROLES.ORGANIZER]: "#e53e2e",
  [ROLES.MENTOR]: "#2563eb",
  [ROLES.LEADER]: "#16a34a",
  [ROLES.MEMBER]: "#0284c7",
};
