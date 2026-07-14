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
  leaderUserId: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMemberResponse[];
}

export const TEAM_STATUS_IDS = {
  FORMING: "60000000-0000-0000-0000-000000000001",
  ACTIVE: "60000000-0000-0000-0000-000000000002",
  DISQUALIFIED: "60000000-0000-0000-0000-000000000003",
  WITHDRAWN: "60000000-0000-0000-0000-000000000004",
} as const;

export function getTeamStatusInfo(teamStatusId?: string | null) {
  switch (teamStatusId?.toLowerCase()) {
    case TEAM_STATUS_IDS.FORMING:
      return { label: "Pending Approval", badge: "pending_approval" };
    case TEAM_STATUS_IDS.ACTIVE:
      return { label: "Active", badge: "active" };
    case TEAM_STATUS_IDS.DISQUALIFIED:
      return { label: "Disqualified", badge: "disqualified" };
    case TEAM_STATUS_IDS.WITHDRAWN:
      return { label: "Withdrawn", badge: "withdrawn" };
    default:
      return { label: "Unknown", badge: "unverified" };
  }
}

export function isTeamActive(teamStatusId?: string | null) {
  return teamStatusId?.toLowerCase() === TEAM_STATUS_IDS.ACTIVE;
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

type BackendEnvelope<T> = {
  data?: T;
};

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
    api.get<TeamResponse>(`/api/v1/teams/${teamId}`),
  getByEvent: (eventId: string) =>
    api.get<TeamResponse[]>(`/api/v1/events/${eventId}/teams`),
  create: (data: { eventId: string; categoryId: string; teamName: string }) =>
    api.post<TeamResponse>("/api/v1/teams", data),

  // Join requests
  requestJoin: (teamId: string) =>
    api.post<JoinTeamRequestResponse>(`/api/v1/teams/${teamId}/join`, {}),
  getPendingRequests: (teamId: string) =>
    api.get<JoinTeamRequestResponse[]>(`/api/v1/teams/${teamId}/requests`),
  handleJoinRequest: (requestId: string, action: "APPROVED" | "REJECTED", responseNote?: string) =>
    api.put<JoinTeamRequestResponse>(`/api/v1/teams/requests/${requestId}`, { action, responseNote }),

  // Members
  getMemberDetail: async (teamId: string, userId: string) =>
    normalizeMemberDetail(await api.get<RawTeamMemberDetailResponse | BackendEnvelope<RawTeamMemberDetailResponse>>(
      `/api/v1/teams/${teamId}/members/${userId}`,
    )),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/api/v1/teams/${teamId}/members/${userId}`),

  // Team-first event registration: leader đăng ký cả team, organizer duyệt theo team.
  registerEvent: (teamId: string) =>
    api.post<unknown[]>(`/api/v1/teams/${teamId}/register-event`, {}),
  withdrawEvent: (teamId: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/v1/teams/${teamId}/register-event`),

  // Admin
  reviewEligibility: (eventId: string) =>
    api.get<TeamEligibilityReviewResponse[]>(`/api/v1/admin/events/${eventId}/teams/eligibility-review`),
  decideEligibility: (teamId: string, approved: boolean, note?: string) =>
    api.post<EligibilityDecisionResponse>(`/api/v1/admin/teams/${teamId}/eligibility-decision`, { approved, note }),
  disqualify: (teamId: string, reason: string) =>
    api.post<DisqualificationResponse>(`/api/v1/admin/teams/${teamId}/disqualify`, { reason }),
};
