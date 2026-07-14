import { api } from "@/lib/api/apiClient";

export interface TeamMemberResponse {
  teamMemberId: string;
  userId: string;
  joinedAt: string;
  active: boolean;
}

export interface TeamResponse {
  teamId: string;
  eventId: string;
  categoryId: string;
  teamName: string;
  teamStatusId: string;
  teamStatusName?: string;
  statusName?: string;
  status?: string;
  leaderUserId: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberResponse[];
  minTeamSize?: number;
  maxTeamSize?: number;
  activeMemberCount?: number;
  teamSizeEligible?: boolean;
  membersInfoComplete?: boolean;
  canRequestApproval?: boolean;
  approvalIssues?: string[];
}

type RawTeamResponse = TeamResponse & {
  id?: string;
  name?: string;
  event?: { eventId?: string; id?: string };
  category?: { categoryId?: string; id?: string };
  statusId?: string;
  statusCode?: string;
  teamStatusCode?: string;
  teamStatus?: string | {
    teamStatusId?: string;
    statusId?: string;
    id?: string;
    statusName?: string;
    name?: string;
    code?: string;
  };
};

type BackendEnvelope<T> = {
  data?: T;
  content?: T;
  message?: string;
};

export const TEAM_STATUS_IDS = {
  FORMING: "60000000-0000-0000-0000-000000000001",
  ACTIVE: "60000000-0000-0000-0000-000000000002",
  DISQUALIFIED: "60000000-0000-0000-0000-000000000003",
  WITHDRAWN: "60000000-0000-0000-0000-000000000004",
} as const;

export type TeamStatusBadge = "forming" | "pending_approval" | "active" | "rejected" | "disqualified" | "withdrawn" | "unverified";

function normalizeStatusText(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? "";
}

export function getTeamStatusInfo(teamStatusId?: string | null, statusName?: string | null): { label: string; badge: TeamStatusBadge } {
  const normalizedStatusId = teamStatusId?.trim().toLowerCase() ?? "";
  const normalizedStatusKey = normalizeStatusText(teamStatusId);
  switch (normalizedStatusId) {
    case TEAM_STATUS_IDS.FORMING:
      return { label: "Forming", badge: "forming" };
    case TEAM_STATUS_IDS.ACTIVE:
      return { label: "Active", badge: "active" };
    case TEAM_STATUS_IDS.DISQUALIFIED:
      return { label: "Disqualified", badge: "disqualified" };
    case TEAM_STATUS_IDS.WITHDRAWN:
      return { label: "Withdrawn", badge: "withdrawn" };
  }

  switch (normalizedStatusKey) {
    case "forming":
      return { label: "Forming", badge: "forming" };
    case "pending":
    case "pending_approval":
    case "pendingapproval":
      return { label: "Pending Approval", badge: "pending_approval" };
    case "approved":
    case "active":
      return { label: "Active", badge: "active" };
    case "rejected":
      return { label: "Rejected", badge: "rejected" };
    case "disqualified":
      return { label: "Disqualified", badge: "disqualified" };
    case "withdrawn":
      return { label: "Withdrawn", badge: "withdrawn" };
  }

  const normalizedStatusName = normalizeStatusText(statusName);
  if (normalizedStatusName.includes("forming")) return { label: "Forming", badge: "forming" };
  if (normalizedStatusName.includes("pending")) return { label: "Pending Approval", badge: "pending_approval" };
  if (normalizedStatusName.includes("approved") || normalizedStatusName.includes("active")) return { label: "Active", badge: "active" };
  if (normalizedStatusName.includes("rejected")) return { label: "Rejected", badge: "rejected" };
  if (normalizedStatusName.includes("disqualified")) return { label: "Disqualified", badge: "disqualified" };
  if (normalizedStatusName.includes("withdrawn")) return { label: "Withdrawn", badge: "withdrawn" };

  return { label: "Unknown", badge: "unverified" };
}

export function getTeamStatusInfoForTeam(team?: Pick<TeamResponse, "teamStatusId" | "teamStatusName" | "statusName" | "status"> | null) {
  return getTeamStatusInfo(team?.teamStatusId, team?.teamStatusName ?? team?.statusName ?? team?.status);
}

export function isTeamActive(teamStatusId?: string | null, statusName?: string | null) {
  return getTeamStatusInfo(teamStatusId, statusName).badge === "active";
}

export function canOrganizerApproveTeam(
  team: Pick<
    TeamEligibilityReviewResponse,
    "eligibleForCompetition" | "teamSizeEligible" | "membersInfoComplete" | "approvalIssues" | "issues"
  >,
) {
  if (typeof team.eligibleForCompetition === "boolean") {
    return team.eligibleForCompetition;
  }

  const issues = team.approvalIssues?.length ? team.approvalIssues : team.issues ?? [];
  return Boolean(team.teamSizeEligible) && Boolean(team.membersInfoComplete) && issues.length === 0;
}

function unwrapTeamResponse(response: RawTeamResponse | BackendEnvelope<RawTeamResponse>) {
  if ("data" in response && response.data) return response.data;
  return response as RawTeamResponse;
}

function unwrapArray<T>(response: T[] | BackendEnvelope<T[]>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.content)) return response.content;
  throw new Error(response.message ?? "Unexpected teams response from server.");
}

function normalizeTeamResponse(response: RawTeamResponse | BackendEnvelope<RawTeamResponse>): TeamResponse {
  const raw = unwrapTeamResponse(response);
  const status = typeof raw.teamStatus === "object" ? raw.teamStatus : undefined;
  const statusText = typeof raw.teamStatus === "string" ? raw.teamStatus : undefined;
  const teamStatusId = raw.teamStatusId ?? status?.teamStatusId ?? status?.statusId ?? raw.statusId ?? status?.id ?? "";
  const teamStatusName = raw.teamStatusName
    ?? raw.statusName
    ?? raw.teamStatusCode
    ?? raw.statusCode
    ?? status?.statusName
    ?? status?.name
    ?? status?.code
    ?? statusText
    ?? raw.status
    ?? getTeamStatusInfo(teamStatusId).label;

  return {
    ...raw,
    teamId: raw.teamId ?? raw.id ?? "",
    eventId: raw.eventId ?? raw.event?.eventId ?? raw.event?.id ?? "",
    categoryId: raw.categoryId ?? raw.category?.categoryId ?? raw.category?.id ?? "",
    teamName: raw.teamName ?? raw.name ?? "",
    teamStatusId,
    teamStatusName,
    members: raw.members ?? [],
    minTeamSize: raw.minTeamSize,
    maxTeamSize: raw.maxTeamSize,
    activeMemberCount: raw.activeMemberCount,
    teamSizeEligible: raw.teamSizeEligible,
    membersInfoComplete: raw.membersInfoComplete,
    canRequestApproval: raw.canRequestApproval,
    approvalIssues: raw.approvalIssues ?? [],
  };
}

export interface TeamMemberDetailResponse {
  teamMemberId: string;
  teamId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  fptStudentCode: string;
  externalStudentCode: string;
  universityName: string;
  userTypeName: string;
  accountStatusName: string;
  joinedAt: string;
  active: boolean;
}

type RawTeamMemberDetailResponse = Partial<TeamMemberDetailResponse> & {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  studentEmail?: string;
  user?: {
    userId?: string;
    fullName?: string;
    name?: string;
    email?: string;
    phone?: string;
    fptStudentCode?: string;
    externalStudentCode?: string;
    universityName?: string;
    userTypeName?: string;
    accountStatusName?: string;
  };
};

function unwrapMemberDetail(response: RawTeamMemberDetailResponse | BackendEnvelope<RawTeamMemberDetailResponse>) {
  if ("data" in response && response.data) return response.data;
  return response as RawTeamMemberDetailResponse;
}

function normalizeMemberDetail(response: RawTeamMemberDetailResponse | BackendEnvelope<RawTeamMemberDetailResponse>): TeamMemberDetailResponse {
  const raw = unwrapMemberDetail(response);
  return {
    teamMemberId: raw.teamMemberId ?? raw.id ?? "",
    teamId: raw.teamId ?? "",
    userId: raw.userId ?? raw.user?.userId ?? "",
    fullName: raw.fullName ?? raw.name ?? raw.user?.fullName ?? raw.user?.name ?? raw.email ?? raw.user?.email ?? "",
    email: raw.email ?? raw.studentEmail ?? raw.user?.email ?? "",
    phone: raw.phone ?? raw.user?.phone ?? "",
    fptStudentCode: raw.fptStudentCode ?? raw.user?.fptStudentCode ?? "",
    externalStudentCode: raw.externalStudentCode ?? raw.user?.externalStudentCode ?? "",
    universityName: raw.universityName ?? raw.user?.universityName ?? "",
    userTypeName: raw.userTypeName ?? raw.user?.userTypeName ?? "",
    accountStatusName: raw.accountStatusName ?? raw.user?.accountStatusName ?? "",
    joinedAt: raw.joinedAt ?? "",
    active: raw.active ?? true,
  };
}

export interface JoinTeamRequestResponse {
  requestId: string;
  teamId: string;
  userId: string;
  fullName: string;
  universityName: string;
  requestStatus: string;
  requestedAt: string;
  respondedAt: string;
  respondedById: string;
  responseNote: string;
}

export interface TeamEligibilityMemberResponse {
  teamMemberId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  fptStudentCode: string;
  externalStudentCode: string;
  universityName: string;
  userTypeName: string;
  accountStatusName: string;
  joinedAt: string;
  active: boolean;
  profileComplete: boolean;
  issues: string[];
}

export interface TeamEligibilityReviewResponse {
  teamId: string;
  eventId: string;
  categoryId: string;
  teamName: string;
  teamStatusId: string;
  leaderUserId: string;
  minTeamSize: number;
  maxTeamSize: number;
  activeMemberCount: number;
  teamSizeEligible: boolean;
  membersInfoComplete: boolean;
  eligibleForCompetition: boolean;
  issues: string[];
  canRequestApproval?: boolean;
  approvalIssues?: string[];
  teamStatusName?: string;
  members: TeamEligibilityMemberResponse[];
}

export interface DisqualificationResponse {
  disqualificationId: string;
  teamId: string;
  reason: string;
  disqualifiedById: string;
  disqualifiedAt: string;
  reversed: boolean;
}

export interface EligibilityDecisionResponse {
  approved: boolean;
  message: string;
  team: TeamResponse;
  disqualification: DisqualificationResponse;
}

export const teamService = {
  getById: (teamId: string) =>
    api.get<RawTeamResponse>(`/api/v1/teams/${teamId}`).then(normalizeTeamResponse),
  getByEvent: (eventId: string) =>
    api.get<RawTeamResponse[] | BackendEnvelope<RawTeamResponse[]>>(`/api/v1/events/${eventId}/teams`)
      .then(response => unwrapArray(response).map(normalizeTeamResponse)),
  create: (data: { eventId: string; categoryId: string; teamName: string }) =>
    api.post<RawTeamResponse>("/api/v1/teams", data).then(normalizeTeamResponse),

  // Join requests
  requestJoin: (teamId: string) =>
    api.post<JoinTeamRequestResponse>(`/api/v1/teams/${teamId}/join`, {}),
  getPendingRequests: (teamId: string) =>
    api.get<JoinTeamRequestResponse[] | BackendEnvelope<JoinTeamRequestResponse[]>>(`/api/v1/teams/${teamId}/requests`)
      .then(unwrapArray),
  handleJoinRequest: (requestId: string, action: "APPROVED" | "REJECTED", responseNote?: string) =>
    api.put<JoinTeamRequestResponse>(`/api/v1/teams/requests/${requestId}`, { action, responseNote }),

  // Members
  getMemberDetail: async (teamId: string, userId: string) =>
    normalizeMemberDetail(await api.get<RawTeamMemberDetailResponse | BackendEnvelope<RawTeamMemberDetailResponse>>(
      `/api/v1/teams/${teamId}/members/${userId}`,
    )),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/api/v1/teams/${teamId}/members/${userId}`),
  transferLeadership: (teamId: string, newLeaderUserId: string) =>
    api.put<RawTeamResponse>(`/api/v1/teams/${teamId}/leader`, { newLeaderUserId }).then(normalizeTeamResponse),

  // Team-first event registration: leader đăng ký cả team, organizer duyệt theo team.
  registerEvent: (teamId: string) =>
    api.post<unknown[]>(`/api/v1/teams/${teamId}/register-event`, {}),
  withdrawEvent: (teamId: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/v1/teams/${teamId}/register-event`),

  // Admin
  reviewEligibility: (eventId: string) =>
    api.get<TeamEligibilityReviewResponse[] | BackendEnvelope<TeamEligibilityReviewResponse[]>>(`/api/v1/admin/events/${eventId}/teams/eligibility-review`)
      .then(unwrapArray),
  decideEligibility: (teamId: string, approved: boolean, note?: string) =>
    api.post<EligibilityDecisionResponse>(`/api/v1/admin/teams/${teamId}/eligibility-decision`, { approved, note }),
  disqualify: (teamId: string, reason: string) =>
    api.post<DisqualificationResponse>(`/api/v1/admin/teams/${teamId}/disqualify`, { reason }),
};
