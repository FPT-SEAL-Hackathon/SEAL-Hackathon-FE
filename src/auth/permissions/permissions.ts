import { JUDGE_ROLES, ORGANIZER_ROLES, ROLES, STUDENT_ROLES, type Role, isJudge, isOrganizer } from "@/auth/rbac/roles";

export type PageKey =
  | "dashboard"
  | "team"
  | "events"
  | "event-participants"
  | "leaderboard"
  | "notifications"
  | "profile"
  | "submissions"
  | "rounds"
  | "scoring"
  | "calibration"
  | "history"
  | "categories"
  | "criteria"
  | "users"
  | "assignments"
  | "rankings"
  | "reports"
  | "direct-notification"
  | "audit"
  | "awards"
  | "award-patterns"
  | "settings";

export const DEFAULT_PAGE_BY_ROLE: Record<Role, PageKey> = {
  [ROLES.FPT_STUDENT]: "dashboard",
  [ROLES.EXTERNAL_STUDENT]: "dashboard",
  [ROLES.ORGANIZER]: "dashboard",
  [ROLES.INTERNAL_JUDGE]: "rounds",
  [ROLES.GUEST_JUDGE]: "rounds",
};

export const PAGE_PERMISSIONS: Record<PageKey, Role[]> = {
  dashboard: [...STUDENT_ROLES, ...ORGANIZER_ROLES],
  team: [...STUDENT_ROLES],
  events: [...STUDENT_ROLES, ...ORGANIZER_ROLES],
  "event-participants": [...ORGANIZER_ROLES],
  leaderboard: [...STUDENT_ROLES],
  notifications: [...STUDENT_ROLES, ...ORGANIZER_ROLES],
  profile: [...STUDENT_ROLES, ...JUDGE_ROLES, ...ORGANIZER_ROLES],
  submissions: [...STUDENT_ROLES, ...JUDGE_ROLES, ...ORGANIZER_ROLES],
  rounds: [...JUDGE_ROLES, ...ORGANIZER_ROLES],
  scoring: [...JUDGE_ROLES],
  calibration: [...JUDGE_ROLES],
  history: [...JUDGE_ROLES],
  categories: [...ORGANIZER_ROLES],
  criteria: [...ORGANIZER_ROLES],
  users: [...ORGANIZER_ROLES],
  assignments: [...ORGANIZER_ROLES],
  rankings: [...ORGANIZER_ROLES],
  reports: [...ORGANIZER_ROLES],
  "direct-notification": [...ORGANIZER_ROLES],
  audit: [...ORGANIZER_ROLES],
  awards: [...ORGANIZER_ROLES],
  "award-patterns": [...ORGANIZER_ROLES],
  settings: [...ORGANIZER_ROLES],
};

export function hasRole(userRole: Role | null | undefined, role: Role): boolean {
  return userRole === role;
}

export function hasAnyRole(userRole: Role | null | undefined, roles: readonly Role[]): boolean {
  return !!userRole && roles.includes(userRole);
}

export function canAccessPage(userRole: Role | null | undefined, page: string | undefined): page is PageKey {
  if (!page) return false;
  return hasAnyRole(userRole, PAGE_PERMISSIONS[page as PageKey] ?? []);
}

export function canManageEvents(role: Role | null | undefined): boolean {
  return isOrganizer(role);
}

export function canJudge(role: Role | null | undefined): boolean {
  return isJudge(role);
}

export function canManageAwards(role: Role | null | undefined): boolean {
  return isOrganizer(role);
}

export function canBroadcastNotifications(role: Role | null | undefined): boolean {
  return isOrganizer(role);
}
