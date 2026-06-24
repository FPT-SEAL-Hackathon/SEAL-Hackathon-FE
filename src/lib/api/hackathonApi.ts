const BASE_URL = "http://localhost:8080/api/v1";

// ==================== REQUEST TYPES ====================

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  studentCode: string;
  university: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GuestJudgeRequest {
  email: string;
  fullName: string;
  company: string;
}

export interface EventRequest {
  eventName: string;
  startDate: string;
  endDate: string;
  maxTeamSize: number;
  status: string;
}

export interface CategoryRequest {
  categoryName: string;
  mentorId: number;
}

export interface RoundRequest {
  roundName: string;
  submissionDeadline: string;
  promotionRule: number;
}

export interface TeamCreateRequest {
  teamName: string;
  categoryId: number;
  memberIds: number[];
}

export interface SubmissionRequest {
  teamId: number;
  roundId: number;
  githubUrl: string;
  slideUrl: string;
}

export interface ScoreRequest {
  submissionId: number;
  criterionId: number;
  scoreValue: number;
  comment: string;
}

export interface AwardRequest {
  teamId: number;
  eventId: number;
  awardTier: "FIRST_PRIZE" | "SECOND_PRIZE" | "THIRD_PRIZE" | "HONORABLE_MENTION";
}

// ==================== RESPONSE TYPES ====================

export interface UserProfileResponse {
  id: number;
  email: string;
  fullName: string;
  role: "MEMBER" | "LEADER" | "JUDGE" | "MENTOR" | "ADMIN";
  studentCode?: string;
  university?: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
}

export interface EventDTO {
  id: number;
  eventName: string;
  startDate: string;
  endDate: string;
  maxTeamSize: number;
  status: "UPCOMING" | "ONGOING" | "COMPLETED";
}

export interface TeamDTO {
  id: number;
  teamName: string;
  categoryId: number;
  categoryName: string;
  members: { id: number; fullName: string; email: string; role: string }[];
  rank?: number;
}

export interface SubmissionDTO {
  id: number;
  teamId: number;
  teamName: string;
  roundId: number;
  roundName: string;
  githubUrl: string;
  slideUrl: string;
  submittedAt: string;
  status: "SUBMITTED" | "SCORED" | "DISQUALIFIED";
}

export interface ScoreDTO {
  submissionId: number;
  criterionId: number;
  criterionName: string;
  scoreValue: number;
  maxScore: number;
  comment: string;
  judgeId: number;
  judgeName: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: number;
  teamName: string;
  totalScore: number;
  roundScores: { roundId: number; roundName: string; score: number }[];
  status: "FINALIST" | "QUALIFIED" | "ELIMINATED";
}

export interface NotificationDTO {
  id: number;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
  read: boolean;
  createdAt: string;
}

// ==================== HTTP CLIENT ====================

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("seal-token");
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as unknown as Promise<T>;
}

// ==================== AUTH ====================

export const authApi = {
  register: (body: RegisterRequest) =>
    request<void>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: LoginRequest) =>
    request<{ accessToken: string; refreshToken: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  refreshToken: (refreshToken: string) =>
    request<{ accessToken: string }>("/auth/refresh-token", { method: "POST", body: JSON.stringify({ refreshToken }) }),

  getMe: () =>
    request<UserProfileResponse>("/users/me"),
};

// ==================== ADMIN ====================

export const adminApi = {
  approveUser: (id: number) =>
    request<void>(`/admin/users/${id}/approve`, { method: "PUT" }),

  createGuestJudge: (body: GuestJudgeRequest) =>
    request<UserProfileResponse>("/admin/users/guest-judge", { method: "POST", body: JSON.stringify(body) }),

  computeRankings: (eventId: number) =>
    request<void>(`/admin/events/${eventId}/compute-rankings`, { method: "POST" }),

  disqualifyTeam: (teamId: number, reason: string) =>
    request<void>(`/admin/teams/${teamId}/disqualify`, { method: "POST", body: JSON.stringify({ reason }) }),
};

// ==================== EVENTS ====================

export const eventsApi = {
  list: () =>
    request<EventDTO[]>("/events"),

  create: (body: EventRequest) =>
    request<EventDTO>("/events", { method: "POST", body: JSON.stringify(body) }),

  update: (id: number, body: EventRequest) =>
    request<EventDTO>(`/events/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  addCategory: (eventId: number, body: CategoryRequest) =>
    request<void>(`/events/${eventId}/categories`, { method: "POST", body: JSON.stringify(body) }),

  addRound: (eventId: number, body: RoundRequest) =>
    request<void>(`/events/${eventId}/rounds`, { method: "POST", body: JSON.stringify(body) }),

  importCriteria: (eventId: number, templateIds: number[]) =>
    request<void>(`/events/${eventId}/criteria/import`, { method: "POST", body: JSON.stringify({ templateIds }) }),
};

// ==================== CRITERIA TEMPLATES ====================

export const criteriaApi = {
  listTemplates: () =>
    request<{ id: number; name: string; criteria: { name: string; maxScore: number }[] }[]>("/criteria/templates"),

  createTemplate: (body: unknown) =>
    request<void>("/criteria/templates", { method: "POST", body: JSON.stringify(body) }),
};

// ==================== ROUNDS ====================

export const roundsApi = {
  assignJudges: (roundId: number, judgeIds: number[]) =>
    request<void>(`/rounds/${roundId}/judges`, { method: "POST", body: JSON.stringify({ judgeIds }) }),
};

// ==================== TEAMS ====================

export const teamsApi = {
  create: (body: TeamCreateRequest) =>
    request<TeamDTO>("/teams", { method: "POST", body: JSON.stringify(body) }),

  join: (teamId: number) =>
    request<void>(`/teams/${teamId}/join`, { method: "POST" }),

  getMyTeam: () =>
    request<TeamDTO>("/teams/my-team"),
};

// ==================== SUBMISSIONS ====================

export const submissionsApi = {
  submit: (body: SubmissionRequest) =>
    request<SubmissionDTO>("/submissions", { method: "POST", body: JSON.stringify(body) }),
};

// ==================== SCORING ====================

export const scoringApi = {
  getAssignments: () =>
    request<SubmissionDTO[]>("/judge/assignments"),

  submitScore: (body: ScoreRequest) =>
    request<ScoreDTO>("/scores", { method: "POST", body: JSON.stringify(body) }),

  getLeaderboard: (eventId: number, categoryId: number) =>
    request<LeaderboardEntry[]>(`/public/leaderboard/${eventId}/${categoryId}`),
};

// ==================== AWARDS ====================

export const awardsApi = {
  grant: (body: AwardRequest) =>
    request<void>("/awards", { method: "POST", body: JSON.stringify(body) }),
};

// ==================== NOTIFICATIONS ====================

export const notificationsApi = {
  list: () =>
    request<NotificationDTO[]>("/notifications"),
};

// ==================== MOCK DATA ====================

export const mockUsers: UserProfileResponse[] = [
  { id: 1, email: "admin@fpt.edu.vn", fullName: "Admin User", role: "ADMIN", status: "ACTIVE" },
  { id: 2, email: "alex.j@fpt.edu.vn", fullName: "Alex Johnson", role: "MEMBER", studentCode: "FPT2021001", university: "FPT University", status: "ACTIVE" },
  { id: 3, email: "ptlan@fpt.edu.vn", fullName: "Dr. Pham Thi Lan", role: "JUDGE", university: "FPT University", status: "ACTIVE" },
  { id: 4, email: "nvminh@fpt.edu.vn", fullName: "Dr. Nguyen Van Minh", role: "MENTOR", university: "FPT University", status: "ACTIVE" },
  { id: 5, email: "htthu@fpt.edu.vn", fullName: "Hoang Thi Thu", role: "MEMBER", studentCode: "FPT2023045", university: "FPT University", status: "PENDING" },
  { id: 6, email: "tmduc@fpt.edu.vn", fullName: "Tran Minh Duc", role: "LEADER", studentCode: "FPT2022012", university: "FPT University", status: "ACTIVE" },
];

export const mockEvents: EventDTO[] = [
  { id: 1, eventName: "SEAL Fall 2025", startDate: "2025-10-01T00:00:00Z", endDate: "2025-12-01T00:00:00Z", maxTeamSize: 5, status: "ONGOING" },
  { id: 2, eventName: "FPT Web3 Challenge", startDate: "2025-11-15T00:00:00Z", endDate: "2026-01-15T00:00:00Z", maxTeamSize: 4, status: "UPCOMING" },
  { id: 3, eventName: "AI Agents Hackathon", startDate: "2026-01-01T00:00:00Z", endDate: "2026-02-28T00:00:00Z", maxTeamSize: 5, status: "UPCOMING" },
  { id: 4, eventName: "SEAL Spring 2025", startDate: "2025-04-01T00:00:00Z", endDate: "2025-07-10T00:00:00Z", maxTeamSize: 5, status: "COMPLETED" },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, teamId: 101, teamName: "AlphaCoders", totalScore: 92.1, roundScores: [{ roundId: 1, roundName: "Round 1", score: 88.5 }, { roundId: 2, roundName: "Round 2", score: 95.7 }], status: "FINALIST" },
  { rank: 2, teamId: 102, teamName: "CodeCraft Pro", totalScore: 89.5, roundScores: [{ roundId: 1, roundName: "Round 1", score: 85.2 }, { roundId: 2, roundName: "Round 2", score: 93.8 }], status: "FINALIST" },
  { rank: 3, teamId: 103, teamName: "ByteBuilders", totalScore: 87.8, roundScores: [{ roundId: 1, roundName: "Round 1", score: 90.1 }, { roundId: 2, roundName: "Round 2", score: 85.5 }], status: "FINALIST" },
  { rank: 4, teamId: 104, teamName: "InnovateFPT", totalScore: 86.3, roundScores: [{ roundId: 1, roundName: "Round 1", score: 82.0 }, { roundId: 2, roundName: "Round 2", score: 90.6 }], status: "FINALIST" },
  { rank: 5, teamId: 105, teamName: "TechStorm", totalScore: 84.9, roundScores: [{ roundId: 1, roundName: "Round 1", score: 84.9 }, { roundId: 2, roundName: "Round 2", score: 84.9 }], status: "FINALIST" },
  { rank: 12, teamId: 112, teamName: "DevDynamo", totalScore: 79.3, roundScores: [{ roundId: 1, roundName: "Round 1", score: 76.8 }, { roundId: 2, roundName: "Round 2", score: 81.8 }], status: "QUALIFIED" },
];

export const mockNotifications: NotificationDTO[] = [
  { id: 1, title: "Submission deadline in 2 days", message: "Your team DevDynamo must submit by Dec 1. Don't miss it!", type: "WARNING", read: false, createdAt: "2025-11-29T08:00:00Z" },
  { id: 2, title: "Your team was approved!", message: "DevDynamo has been approved to compete in the AI Agents track.", type: "SUCCESS", read: false, createdAt: "2025-11-29T05:00:00Z" },
  { id: 3, title: "Round 2 Finals now open", message: "Round 2 (Finals) is now accepting submissions for AI Agents.", type: "INFO", read: false, createdAt: "2025-11-28T09:00:00Z" },
  { id: 4, title: "Score update: Round 1 results", message: "Your team scored 76.8/100 in Round 1. Check the leaderboard.", type: "INFO", read: true, createdAt: "2025-11-26T14:00:00Z" },
];

export const mockMyTeam: TeamDTO = {
  id: 112,
  teamName: "DevDynamo",
  categoryId: 1,
  categoryName: "AI Agents",
  members: [
    { id: 2, fullName: "Alex Johnson", email: "alex.j@fpt.edu.vn", role: "LEADER" },
    { id: 8, fullName: "Maria Chen", email: "maria.c@fpt.edu.vn", role: "MEMBER" },
    { id: 9, fullName: "James Park", email: "james.p@fpt.edu.vn", role: "MEMBER" },
    { id: 10, fullName: "Sofia Rodriguez", email: "sofia.r@fpt.edu.vn", role: "MEMBER" },
    { id: 11, fullName: "David Kim", email: "david.k@fpt.edu.vn", role: "MEMBER" },
  ],
  rank: 12,
};

export const mockSubmissions: SubmissionDTO[] = [
  {
    id: 1, teamId: 112, teamName: "DevDynamo", roundId: 1, roundName: "Round 1 — Qualifying",
    githubUrl: "https://github.com/devdynamo/ai-task-manager",
    slideUrl: "https://slides.devdynamo.ai/round1",
    submittedAt: "2025-11-20T15:30:00Z", status: "SCORED",
  },
  {
    id: 2, teamId: 112, teamName: "DevDynamo", roundId: 2, roundName: "Round 2 — Finals",
    githubUrl: "https://github.com/devdynamo/ai-task-manager-v2",
    slideUrl: "https://slides.devdynamo.ai/round2",
    submittedAt: "2025-11-27T14:15:00Z", status: "SUBMITTED",
  },
];

export const mockJudgeAssignments: SubmissionDTO[] = [
  { id: 1, teamId: 101, teamName: "AlphaCoders", roundId: 2, roundName: "Round 2 — Finals", githubUrl: "github.com/alphacoders/ai-task", slideUrl: "slides.alphacoders.ai/r2", submittedAt: "2025-11-26T10:00:00Z", status: "SUBMITTED" },
  { id: 2, teamId: 102, teamName: "CodeCraft Pro", roundId: 2, roundName: "Round 2 — Finals", githubUrl: "github.com/codecraft/sma", slideUrl: "slides.codecraft.io/r2", submittedAt: "2025-11-26T11:00:00Z", status: "SUBMITTED" },
  { id: 3, teamId: 103, teamName: "ByteBuilders", roundId: 2, roundName: "Round 2 — Finals", githubUrl: "github.com/bytebuilders/ncr", slideUrl: "slides.bytebuilders.dev/r2", submittedAt: "2025-11-26T12:00:00Z", status: "SUBMITTED" },
  { id: 4, teamId: 112, teamName: "DevDynamo", roundId: 2, roundName: "Round 2 — Finals", githubUrl: "github.com/devdynamo/ato", slideUrl: "slides.devdynamo.ai/r2", submittedAt: "2025-11-27T14:15:00Z", status: "SCORED" },
];
