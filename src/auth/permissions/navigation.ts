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
    { icon: "Award", label: "Certificates", key: "certificates" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.EXTERNAL_STUDENT]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Users", label: "My Team", key: "team" },
    { icon: "Calendar", label: "My Events", key: "events" },
    { icon: "FolderOpen", label: "Submission Center", key: "submissions" },
    { icon: "Trophy", label: "Leaderboard", key: "leaderboard" },
    { icon: "Award", label: "Certificates", key: "certificates" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.INTERNAL_JUDGE]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "ClipboardList", label: "Assigned Round", key: "rounds" },
    { icon: "BarChart2", label: "Calibration", key: "calibration" },
    { icon: "Clock", label: "History", key: "history" },
    { icon: "BookOpen", label: "Assigned Tracks", key: "tracks" },
    { icon: "Users", label: "Category Teams", key: "teams" },
    { icon: "MessageSquare", label: "Consultation Requests", key: "consultations" },
    { icon: "User", label: "Profile", key: "profile" },
  ],
  [ROLES.GUEST_JUDGE]: [
    { icon: "ClipboardList", label: "Assigned Round", key: "rounds" },
    { icon: "BarChart2", label: "Calibration", key: "calibration" },
    { icon: "Clock", label: "History", key: "history" },
  ],
  [ROLES.ORGANIZER]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Calendar", label: "Event Management", key: "events" },
    { icon: "BookOpen", label: "Categories", key: "categories" },
    { icon: "UserCheck", label: "Event Participants", key: "event-participants" },
    // { icon: "Users", label: "Team Approval", key: "team-approval" },
    { icon: "GitBranch", label: "Rounds", key: "rounds" },
    { icon: "Star", label: "Criteria", key: "criteria" },
    { icon: "Users", label: "Users", key: "users" },
    { icon: "UserCheck", label: "Assign Judges", key: "assignments" },
    { icon: "UserPlus", label: "Assign Mentors", key: "assign-mentors" },
    { icon: "FileText", label: "Submissions", key: "submissions" },
    { icon: "Trophy", label: "Rankings", key: "rankings" },
    { icon: "BarChart2", label: "Research & Analytics", key: "reports" },
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
    { icon: "MessageSquare", label: "My Mentor", key: "mentor" },
    { icon: "FolderOpen", label: "Submission Center", key: "submissions" },
    { icon: "Trophy", label: "Leaderboard", key: "leaderboard" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.MEMBER]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "Users", label: "My Team", key: "team" },
    { icon: "MessageSquare", label: "My Mentor", key: "mentor" },
    { icon: "FolderOpen", label: "Submission Center", key: "submissions" },
    { icon: "Trophy", label: "Leaderboard", key: "leaderboard" },
    { icon: "Bell", label: "Notifications", key: "notifications" },
  ],
  [ROLES.EXPERT]: [
    { icon: "LayoutDashboard", label: "Dashboard", key: "dashboard" },
    { icon: "ClipboardList", label: "Assigned Round", key: "rounds" },
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
