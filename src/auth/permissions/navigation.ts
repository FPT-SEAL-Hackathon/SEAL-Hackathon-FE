import { ROLES, type Role } from "@/auth/rbac/roles";
import type { PageKey } from "@/auth/permissions/permissions";

export interface NavItem {
  icon: string;
  label: string;
  key: PageKey;
}

export const ROLE_MENUS: Record<Role, NavItem[]> = {
  [ROLES.FPT_STUDENT]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Users", label: "My Team", key: "team" },
    { icon: "Calendar", label: "My Events", key: "events" },
    { icon: "FolderOpen", label: "Submission Center", key: "submissions" },
    { icon: "Trophy", label: "Leaderboard", key: "leaderboard" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.EXTERNAL_STUDENT]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Users", label: "My Team", key: "team" },
    { icon: "Calendar", label: "My Events", key: "events" },
    { icon: "FolderOpen", label: "Submission Center", key: "submissions" },
    { icon: "Trophy", label: "Leaderboard", key: "leaderboard" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.INTERNAL_JUDGE]: [
    { icon: "ClipboardList", label: "Assigned Rounds", key: "rounds" },
    { icon: "FileText", label: "Assigned Submissions", key: "submissions" },
    { icon: "Star", label: "Scoring", key: "scoring" },
    { icon: "BarChart2", label: "Calibration", key: "calibration" },
    { icon: "Clock", label: "History", key: "history" },
  ],
  [ROLES.GUEST_JUDGE]: [
    { icon: "ClipboardList", label: "Assigned Rounds", key: "rounds" },
    { icon: "FileText", label: "Assigned Submissions", key: "submissions" },
    { icon: "Star", label: "Scoring", key: "scoring" },
    { icon: "BarChart2", label: "Calibration", key: "calibration" },
    { icon: "Clock", label: "History", key: "history" },
  ],
  [ROLES.ORGANIZER]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Calendar", label: "Event Management", key: "events" },
    { icon: "BookOpen", label: "Categories", key: "categories" },
    { icon: "GitBranch", label: "Rounds", key: "rounds" },
    { icon: "Star", label: "Criteria", key: "criteria" },
    { icon: "Users", label: "Users", key: "users" },
    { icon: "UserCheck", label: "Assignments", key: "assignments" },
    { icon: "Trophy", label: "Rankings", key: "rankings" },
    { icon: "BarChart2", label: "Research & Analytics", key: "reports" },
    { icon: "Award", label: "Awards", key: "awards" },
    { icon: "Bell", label: "Notifications Broadcast", key: "notifications" },
    { icon: "Shield", label: "Audit Logs", key: "audit" },
    { icon: "Wrench", label: "Settings", key: "settings" },
  ],
};

export function getMenuForRole(role: Role): NavItem[] {
  return ROLE_MENUS[role];
}
