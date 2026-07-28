export const ROLES = {
  FPT_STUDENT: "ROLE_FPT_STUDENT",
  EXTERNAL_STUDENT: "ROLE_EXTERNAL_STUDENT",
  ADMIN: "ROLE_ADMIN",
  ORGANIZER: "ROLE_ORGANIZER",
  INTERNAL_JUDGE: "ROLE_INTERNAL_JUDGE",
  GUEST_JUDGE: "ROLE_GUEST_JUDGE",
  MENTOR: "ROLE_MENTOR",
  LEADER: "ROLE_LEADER",
  MEMBER: "ROLE_MEMBER",
  EXPERT: "ROLE_EXPERT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);
export const STUDENT_ROLES: Role[] = [ROLES.FPT_STUDENT, ROLES.EXTERNAL_STUDENT];
export const JUDGE_ROLES: Role[] = [ROLES.INTERNAL_JUDGE, ROLES.GUEST_JUDGE, ROLES.EXPERT];
export const ORGANIZER_ROLES: Role[] = [ROLES.ORGANIZER];
// Admin = quản trị hệ thống (user/settings/template), KHÔNG vận hành cuộc thi.
export const ADMIN_ROLES: Role[] = [ROLES.ADMIN];
export const MENTOR_ROLES: Role[] = [ROLES.MENTOR, ROLES.EXPERT];
export const LEADER_ROLES: Role[] = [ROLES.LEADER];
export const MEMBER_ROLES: Role[] = [ROLES.MEMBER];

const ROLE_ALIASES: Record<string, Role> = {
  FPT_STUDENT: ROLES.FPT_STUDENT,
  FPTSTUDENT: ROLES.FPT_STUDENT,
  STUDENT_FPT: ROLES.FPT_STUDENT,
  EXTERNAL_STUDENT: ROLES.EXTERNAL_STUDENT,
  EXTERNALSTUDENT: ROLES.EXTERNAL_STUDENT,
  STUDENT_EXTERNAL: ROLES.EXTERNAL_STUDENT,
  ADMIN: ROLES.ADMIN,
  ORGANIZER: ROLES.ORGANIZER,
  INTERNAL_JUDGE: ROLES.INTERNAL_JUDGE,
  INTERNALJUDGE: ROLES.INTERNAL_JUDGE,
  GUEST_JUDGE: ROLES.GUEST_JUDGE,
  GUESTJUDGE: ROLES.GUEST_JUDGE,
  MENTOR: ROLES.MENTOR,
  LEADER: ROLES.LEADER,
  MEMBER: ROLES.MEMBER,
  EXPERT: ROLES.EXPERT,
};

export function normalizeRole(value?: string | null): Role | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  const aliasKey = normalized.replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const compactAliasKey = aliasKey.replace(/_/g, "");
  if (ALL_ROLES.includes(normalized as Role)) return normalized as Role;
  return ROLE_ALIASES[aliasKey] ?? ROLE_ALIASES[compactAliasKey] ?? null;
}

export function isStudent(role?: Role | null): boolean {
  return !!role && STUDENT_ROLES.includes(role);
}

export function isJudge(role?: Role | null): boolean {
  return !!role && JUDGE_ROLES.includes(role);
}

export function isOrganizer(role?: Role | null): boolean {
  return role === ROLES.ORGANIZER;
}

export function isAdmin(role?: Role | null): boolean {
  return role === ROLES.ADMIN;
}

export function getRoleRouteSegment(role: Role): "student" | "judge" | "organizer" | "admin" | "mentor" | "leader" | "member" {
  if (isStudent(role)) return "student";
  if (isJudge(role)) return "judge";
  if (role === ROLES.ADMIN) return "admin";
  if (role === ROLES.MENTOR || role === ROLES.EXPERT) return "mentor";
  if (role === ROLES.LEADER) return "leader";
  if (role === ROLES.MEMBER) return "member";
  return "organizer";
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case ROLES.FPT_STUDENT:
      return "FPT Student";
    case ROLES.EXTERNAL_STUDENT:
      return "External Student";
    case ROLES.ADMIN:
      return "Admin";
    case ROLES.ORGANIZER:
      return "Organizer";
    case ROLES.INTERNAL_JUDGE:
      return "Internal Judge";
    case ROLES.GUEST_JUDGE:
      return "Guest Judge";
    case ROLES.MENTOR:
      return "Mentor";
    case ROLES.LEADER:
      return "Team Leader";
    case ROLES.MEMBER:
      return "Team Member";
    case ROLES.EXPERT:
      return "Expert";
  }
}
