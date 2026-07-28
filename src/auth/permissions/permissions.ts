import { ADMIN_ROLES, JUDGE_ROLES, LEADER_ROLES, ORGANIZER_ROLES, ROLES, STUDENT_ROLES, type Role, isAdmin, isJudge, isOrganizer } from "@/auth/rbac/roles";

export type PageKey =
  | "dashboard"
  | "team"
  | "events"
  | "event-detail"
  | "event-participants"
  | "submission-repositories"
  | "leaderboard"
  | "certificates"
  | "notifications"
  | "profile"
  | "submissions"
  | "rounds"
  | "scoring"
  | "calibration"
  | "history"
  | "feedback"
  | "appeals"
  | "results"
  | "requests"
  | "categories"
  | "criteria"
  | "users"
  | "assignments"
  | "assign-mentors"
  | "rankings"
  | "reports"
  | "direct-notification"
  | "audit"
  | "awards"
  | "award-patterns"
  | "settings"
  | "schedule"
  // Mentor pages
  | "tracks"
  | "teams"
  | "consultations"
  | "progress"
  // Leader/Member pages
  | "mentor";

export const DEFAULT_PAGE_BY_ROLE: Record<Role, PageKey> = {
  [ROLES.FPT_STUDENT]: "dashboard",
  [ROLES.EXTERNAL_STUDENT]: "dashboard",
  // Admin vào thẳng User Management (không có Dashboard vận hành event).
  [ROLES.ADMIN]: "users",
  [ROLES.ORGANIZER]: "dashboard",
  [ROLES.INTERNAL_JUDGE]: "rounds",
  [ROLES.GUEST_JUDGE]: "rounds",
  [ROLES.MENTOR]: "dashboard",
  [ROLES.LEADER]: "dashboard",
  [ROLES.MEMBER]: "dashboard",
  [ROLES.EXPERT]: "dashboard",
};

const MENTOR_ROLES = [ROLES.MENTOR, ROLES.EXPERT] as Role[];
const LEADER_MEMBER_ROLES = [ROLES.LEADER, ROLES.MEMBER] as Role[];

export const PAGE_PERMISSIONS: Record<PageKey, Role[]> = {
  "event-detail": [...ORGANIZER_ROLES],
  dashboard: [...STUDENT_ROLES, ...ORGANIZER_ROLES, ...LEADER_MEMBER_ROLES, ROLES.INTERNAL_JUDGE, ...MENTOR_ROLES],
  team: [...STUDENT_ROLES, ...LEADER_MEMBER_ROLES],
  events: [...STUDENT_ROLES, ...ORGANIZER_ROLES, ...LEADER_MEMBER_ROLES],
  "event-participants": [...ORGANIZER_ROLES],
  "submission-repositories": [...ORGANIZER_ROLES],
  // Duyệt team nằm trong Event Management -> Team Management (EventTeamsSection).
  leaderboard: [...STUDENT_ROLES, ...LEADER_MEMBER_ROLES],
  certificates: [...STUDENT_ROLES, ...LEADER_MEMBER_ROLES],
  // Admin gửi thông báo toàn hệ thống, Organizer gửi trong event của mình.
  notifications: [...STUDENT_ROLES, ...ORGANIZER_ROLES, ...ADMIN_ROLES, ...LEADER_MEMBER_ROLES],
  profile: [...STUDENT_ROLES, ...JUDGE_ROLES, ...ORGANIZER_ROLES, ...ADMIN_ROLES, ...MENTOR_ROLES, ...LEADER_MEMBER_ROLES],
  submissions: [...STUDENT_ROLES, ...JUDGE_ROLES, ...ORGANIZER_ROLES, ...LEADER_MEMBER_ROLES],
  rounds: [...JUDGE_ROLES, ...ORGANIZER_ROLES],
  scoring: [...JUDGE_ROLES],
  calibration: [...JUDGE_ROLES],
  history: [...JUDGE_ROLES],
  feedback: [...LEADER_ROLES],
  appeals: [...STUDENT_ROLES, ...LEADER_MEMBER_ROLES, ...ORGANIZER_ROLES],
  results: [...STUDENT_ROLES, ...LEADER_MEMBER_ROLES],
  requests: [...LEADER_ROLES],
  categories: [...ORGANIZER_ROLES, ...MENTOR_ROLES],
  // Criteria Template là NGUYÊN LIỆU để Organizer dựng event: import template -> tiêu chí
  // của event -> tiêu chí của round -> judge chấm. Không có đường tạo tiêu chí event từ
  // số không, nên template phải thuộc Organizer, không tách sang Admin.
  criteria: [...ORGANIZER_ROLES],
  // Quản lý người dùng chuyển hẳn sang Admin.
  users: [...ADMIN_ROLES],
  assignments: [...ORGANIZER_ROLES],
  "assign-mentors": [...ORGANIZER_ROLES],
  rankings: [...ORGANIZER_ROLES],
  // Báo cáo & nhật ký: cả hai role đều xem (Admin giám sát, Organizer vận hành).
  reports: [...ORGANIZER_ROLES, ...ADMIN_ROLES],
  "direct-notification": [...ORGANIZER_ROLES],
  audit: [...ORGANIZER_ROLES, ...ADMIN_ROLES],
  awards: [...ORGANIZER_ROLES],
  "award-patterns": [...ORGANIZER_ROLES],
  // Cấu hình hệ thống -> Admin.
  settings: [...ADMIN_ROLES],
  schedule: [],
  // Mentor pages
  tracks: [...MENTOR_ROLES],
  teams: [...MENTOR_ROLES],
  consultations: [...MENTOR_ROLES, ...LEADER_MEMBER_ROLES, ...STUDENT_ROLES],
  progress: [...MENTOR_ROLES],
  // Leader/Member pages
  mentor: [...LEADER_MEMBER_ROLES, ...STUDENT_ROLES],
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
  return isOrganizer(role) || isAdmin(role);
}

/** Quản trị hệ thống: user, cấu hình, criteria template. Chỉ Admin. */
export function canAdministerSystem(role: Role | null | undefined): boolean {
  return isAdmin(role);
}
