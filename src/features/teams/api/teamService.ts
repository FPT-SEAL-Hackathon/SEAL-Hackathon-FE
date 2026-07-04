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
  getMemberDetail: (teamId: string, userId: string) =>
    api.get<TeamMemberDetailResponse>(`/api/v1/teams/${teamId}/members/${userId}`),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/api/v1/teams/${teamId}/members/${userId}`),

  // Admin
  reviewEligibility: (eventId: string) =>
    api.get<TeamEligibilityReviewResponse[]>(`/api/v1/admin/events/${eventId}/teams/eligibility-review`),
  decideEligibility: (teamId: string, approved: boolean, note?: string) =>
    api.post<EligibilityDecisionResponse>(`/api/v1/admin/teams/${teamId}/eligibility-decision`, { approved, note }),
  disqualify: (teamId: string, reason: string) =>
    api.post<DisqualificationResponse>(`/api/v1/admin/teams/${teamId}/disqualify`, { reason }),
};
