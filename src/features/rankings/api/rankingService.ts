import { api } from "@/lib/api/apiClient";

export interface RoundRankingDTO {
  id: string;
  roundId: string;
  categoryId: string;
  teamId: string;
  submissionId: string;
  totalScore: number;
  averageScore: number;
  rankPosition: number;
  isAdvanced: boolean;
  computedAt: string;
  isPublished?: boolean;
}

export interface EventRankingDTO {
  id: string;
  eventId: string;
  categoryId: string;
  teamId: string;
  finalScore: number;
  rankPosition: number;
  computedAt: string;
  isPublished?: boolean;
}

export const rankingService = {
  // Public leaderboard (no auth required)
  getLeaderboard: (eventId: string, categoryId: string) =>
    api.get<EventRankingDTO[]>(`/api/v1/public/leaderboard/${eventId}/${categoryId}`, false),

  // Admin compute
  computeRound: (roundId: string, categoryId: string) =>
    api.post<RoundRankingDTO[]>(`/api/v1/admin/rounds/${roundId}/compute-rankings?categoryId=${categoryId}`, {}),
  computeEvent: (eventId: string) =>
    api.post<EventRankingDTO[]>(`/api/v1/admin/events/${eventId}/compute-rankings`, {}),
  publishRound: (roundId: string, categoryId: string) =>
    api.post<void>(`/api/v1/admin/rounds/${roundId}/publish-rankings?categoryId=${categoryId}`, {}),
  publishEvent: (eventId: string, categoryId: string) =>
    api.post<void>(`/api/v1/admin/events/${eventId}/publish-rankings?categoryId=${categoryId}`, {}),
  // Admin get existing rankings
  getRoundRankings: (roundId: string, categoryId: string) =>
    api.get<RoundRankingDTO[]>(`/api/v1/admin/rounds/${roundId}/rankings?categoryId=${categoryId}`),
  getEventRankings: (eventId: string) =>
    api.get<EventRankingDTO[]>(`/api/v1/admin/events/${eventId}/rankings`),
};
