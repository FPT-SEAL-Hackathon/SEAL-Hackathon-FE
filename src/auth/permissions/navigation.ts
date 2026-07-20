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
    { icon: "Award", label: "Certificates", key: "certificates" },
    { icon: "AlertCircle", label: "Appeals", key: "appeals" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.EXTERNAL_STUDENT]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Users", label: "My Team", key: "team" },
    { icon: "Calendar", label: "My Events", key: "events" },
    { icon: "FolderOpen", label: "Submission Center", key: "submissions" },
    { icon: "Award", label: "Certificates", key: "certificates" },
    { icon: "AlertCircle", label: "Appeals", key: "appeals" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.INTERNAL_JUDGE]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "ClipboardList", label: "Event", key: "rounds" },
    { icon: "BarChart2", label: "Calibration", key: "calibration" },
    { icon: "Clock", label: "History", key: "history" },
    { icon: "User", label: "Profile", key: "profile" },
  ],
  [ROLES.GUEST_JUDGE]: [
    { icon: "ClipboardList", label: "Event", key: "rounds" },
    { icon: "BarChart2", label: "Calibration", key: "calibration" },
    { icon: "Clock", label: "History", key: "history" },
  ],
  [ROLES.ORGANIZER]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Calendar", label: "Event Management", key: "events" },
    { icon: "Star", label: "Criteria", key: "criteria" },
    { icon: "FileText", label: "Submissions", key: "submissions" },
    { icon: "Trophy", label: "Judging & Rankings", key: "rankings" },
    { icon: "Users", label: "User Management", key: "users" },
    { icon: "BarChart2", label: "Research & Analytics", key: "reports" },
    { icon: "AlertCircle", label: "Appeals Management", key: "appeals" },
    { icon: "Award", label: "Awards", key: "awards" },
    { icon: "Bell", label: "Notifications Broadcast", key: "notifications" },
    { icon: "Shield", label: "Audit Logs", key: "audit" },
    { icon: "Wrench", label: "Settings", key: "settings" },
  ],
  [ROLES.MENTOR]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "BookOpen", label: "Assigned Categories", key: "categories" },
    { icon: "Users", label: "Category Teams", key: "teams" },
    { icon: "MessageSquare", label: "Consultation Requests", key: "consultations" },
    { icon: "User", label: "Profile", key: "profile" },
  ],
  [ROLES.LEADER]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Users", label: "My Team", key: "team" },
    { icon: "UserCheck", label: "Join Requests", key: "requests" },
    { icon: "MessageSquare", label: "My Mentor", key: "mentor" },
    { icon: "ClipboardList", label: "Consultation History", key: "consultations" },
    { icon: "FolderOpen", label: "Submission Center", key: "submissions" },
    { icon: "Eye", label: "Judge Feedback", key: "feedback" },
    { icon: "Trophy", label: "Leaderboard", key: "leaderboard" },
    { icon: "AlertCircle", label: "Appeals", key: "appeals" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.MEMBER]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Users", label: "My Team", key: "team" },
    { icon: "MessageSquare", label: "My Mentor", key: "mentor" },
    { icon: "ClipboardList", label: "Consultation History", key: "consultations" },
    { icon: "FolderOpen", label: "Submission Center", key: "submissions" },
    { icon: "Trophy", label: "Leaderboard", key: "leaderboard" },
    { icon: "AlertCircle", label: "Appeals", key: "appeals" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.EXPERT]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "ClipboardList", label: "Judging", key: "rounds" },
    { icon: "BarChart2", label: "Calibration", key: "calibration" },
    { icon: "BookOpen", label: "Assigned Categories", key: "categories" },
    { icon: "Users", label: "Category Teams", key: "teams" },
    { icon: "MessageSquare", label: "Consultation Requests", key: "consultations" },
    { icon: "Clock", label: "History", key: "history" },
    { icon: "User", label: "Profile", key: "profile" },
  ],
};

export function getMenuForRole(role: Role): NavItem[] {
  return ROLE_MENUS[role];
}
