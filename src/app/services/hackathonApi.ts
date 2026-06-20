import { API_BASE_URL, api, getAccessToken } from "./apiClient";
import type { LoginRequest, RegisterRequest, LoginResponse, UserResponse } from "./authService";
import type { AwardResponse } from "./awardService";
import type { CategoryResponse } from "./categoryService";
import type { EventResponse } from "./eventService";
import type { EventRankingDTO } from "./rankingService";
import type { RoundResponse } from "./roundService";
import type { SubmissionResponse } from "./submissionService";
import type { TeamResponse } from "./teamService";

export type { LoginRequest, RegisterRequest };

export interface GuestJudgeRequest {
  email: string;
  fullName: string;
  company?: string;
}

export interface EventRequest {
  eventName: string;
  description?: string;
  location?: string;
  bannerImageUrl?: string;
  eventStatusId: string;
  registrationStart?: string;
  registrationEnd?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  maxTeamSize?: number;
  minTeamSize?: number;
}

export interface CategoryRequest {
  categoryName: string;
  description?: string;
  sortOrder?: number;
  mentorId?: string;
}

export interface RoundRequest {
  roundName: string;
  description?: string;
  roundOrder?: number;
  roundStatusId?: string;
  submissionDeadline?: string;
  judgingDeadline?: string;
  startDate?: string;
  endDate?: string;
  advancementTopN?: number;
  isCalibrationRound?: boolean;
}

export interface TeamCreateRequest {
  eventId: string;
  categoryId: string;
  teamName: string;
  memberIds?: string[];
}

export interface SubmissionRequest {
  teamId: string;
  roundId: string;
  repositoryUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  reportUrl?: string;
  slideUrl?: string;
  notes?: string;
}

export interface ScoreRequest {
  submissionId: string;
  roundCriterionId?: string;
  criterionId?: string;
  scoreValue: number;
  comment?: string;
  isCalibration?: boolean;
}

export interface AwardRequest {
  eventId: string;
  categoryId?: string;
  teamId: string;
  awardTierId: string;
  awardTitle: string;
  description?: string;
  prizeValue?: number;
  prizeCurrency?: string;
}

export interface UserProfileResponse extends UserResponse {
  role?: "MEMBER" | "LEADER" | "JUDGE" | "MENTOR" | "ADMIN" | "RESEARCH";
  status?: string;
}

export type EventDTO = EventResponse;
export type TeamDTO = TeamResponse;
export type SubmissionDTO = SubmissionResponse;

export interface ScoreDTO {
  submissionId: string;
  criterionId: string;
  criterionName?: string;
  scoreValue: number;
  maxScore?: number;
  comment?: string;
  judgeId?: string;
  judgeName?: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName?: string;
  totalScore: number;
  roundScores?: Array<{ roundId: string; roundName: string; score: number }>;
  status?: "FINALIST" | "QUALIFIED" | "ELIMINATED";
}

export interface VarianceReport {
  judgeId: string;
  judgeName: string;
  mean: number;
  stdDev: number;
  variance: number;
  submissionsScored: number;
  minScore: number;
  maxScore: number;
}

export interface NotificationDTO {
  id: string;
  notificationId?: string;
  title: string;
  message?: string;
  body?: string;
  type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  read: boolean;
  createdAt: string;
}

function unsupported<T>(feature: string): Promise<T> {
  return Promise.reject(new Error(`${feature} is not available in the current backend API mapping.`));
}

function scoreToBackend(body: ScoreRequest) {
  return {
    submissionId: body.submissionId,
    roundCriterionId: body.roundCriterionId ?? body.criterionId,
    scoreValue: body.scoreValue,
    comment: body.comment,
    isCalibration: body.isCalibration,
  };
}

// Compatibility facade for older imports. New code should prefer the focused services in this folder.
export const authApi = {
  register: (body: RegisterRequest) =>
    api.post<UserResponse>("/auth/register", body, false),

  login: (body: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", body, false),

  refreshToken: (refreshToken: string) =>
    api.post<{ accessToken: string }>("/auth/refresh", { refreshToken }, false),

  getMe: () =>
    unsupported<UserProfileResponse>("GET /users/me"),
};

export const adminApi = {
  approveUser: (_id: string) =>
    unsupported<void>("User approval"),

  createGuestJudge: (_body: GuestJudgeRequest) =>
    unsupported<UserProfileResponse>("Guest judge creation"),

  computeRankings: (eventId: string) =>
    api.post<EventRankingDTO[]>(`/api/v1/admin/events/${eventId}/compute-rankings`, {}),

  disqualifyTeam: (teamId: string, reason: string) =>
    api.post<void>(`/api/v1/admin/teams/${teamId}/disqualify`, { reason }),
};

export const eventsApi = {
  list: () =>
    api.get<EventDTO[]>("/api/v1/events"),

  create: (body: EventRequest) =>
    api.post<EventDTO>("/api/v1/event", body),

  update: (id: string, body: EventRequest) =>
    api.put<EventDTO>(`/api/v1/event/${id}`, body),

  addCategory: (eventId: string, body: CategoryRequest) =>
    api.post<CategoryResponse>(`/api/v1/categories/category/${eventId}`, body),

  addRound: (categoryId: string, body: RoundRequest) =>
    api.post<RoundResponse>(`/api/v1/round/${categoryId}`, body),

  importCriteria: (eventId: string, templateIds: string[]) =>
    api.post<void>(`/api/v1/event/criteria/import/${eventId}`, { templateIds }),
};

export const criteriaApi = {
  listTemplates: () =>
    api.get("/api/v1/criteria/templates"),

  createTemplate: (_body: unknown) =>
    unsupported<void>("Criteria template creation"),
};

export const roundsApi = {
  assignJudges: (roundId: string, judgeIds: string[]) =>
    api.post<void>(`/api/v1/round/judges/${roundId}`, { userIds: judgeIds }),
};

export const teamsApi = {
  create: (body: TeamCreateRequest) =>
    api.post<TeamDTO>("/api/v1/teams", body),

  join: (teamId: string) =>
    api.post<void>(`/api/v1/teams/${teamId}/join`, {}),

  getMyTeam: () =>
    unsupported<TeamDTO>("GET /teams/my-team"),
};

export const submissionsApi = {
  submit: (body: SubmissionRequest) =>
    api.post<SubmissionDTO>("/api/v1/submissions", {
      teamId: body.teamId,
      roundId: body.roundId,
      repositoryUrl: body.repositoryUrl ?? body.githubUrl,
      demoUrl: body.demoUrl,
      reportUrl: body.reportUrl,
      slideUrl: body.slideUrl,
      notes: body.notes,
    }),
};

export const scoringApi = {
  getAssignments: () =>
    unsupported<SubmissionDTO[]>("Judge assignment listing"),

  submitScore: (body: ScoreRequest) =>
    api.post<ScoreDTO>("/api/v1/judging", [scoreToBackend(body)]),

  getLeaderboard: (eventId: string, categoryId: string) =>
    api.get<LeaderboardEntry[]>(`/api/v1/public/leaderboard/${eventId}/${categoryId}`, false),
};

export const researchApi = {
  getVarianceReport: () =>
    unsupported<VarianceReport[]>("Variance report"),

  exportCsv: () =>
    unsupported<Blob>("Research CSV export"),
};

export const awardsApi = {
  grant: (body: AwardRequest) =>
    api.post<AwardResponse>("/api/v1/awards/grandAwardToATeam", body),
};

export const notificationsApi = {
  list: () =>
    api.get<NotificationDTO[]>("/api/v1/notifications/getMyNotifications"),
};

export const downloadWithAuth = async (path: string): Promise<Blob> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  return res.blob();
};
