import { API_BASE_URL, api } from "@/lib/api/apiClient";

export interface AwardResponse {
  id: string;
  eventId: string;
  eventName: string;
  categoryId: string;
  categoryName: string;
  teamId: string;
  teamName: string;
  awardTierId: string;
  awardTierName: string;
  awardTitle: string;
  description: string;
  prizeValue: number;
  prizeCurrency: string;
  awardedAt: string;
  awardedByName: string;
  isPublished: boolean;
  publishedAt: string;
}

export interface AwardPatternResponse {
  id: string;
  eventId: string;
  eventName: string;
  categoryId: string;
  categoryName: string;
  rankPosition: number;
  awardTierId: string;
  awardTierName: string;
  awardTitle: string;
  description: string;
  prizeValue: number;
  prizeCurrency: string;
  isActive: boolean;
}

export interface AwardPatternItemRequest {
  rankPosition: number;
  awardTierId: string;
  awardTitle: string;
  description?: string;
  prizeValue?: number;
  prizeCurrency?: string;
}

export interface RankingAwardCandidateResponse {
  rankingId: string;
  roundId: string;
  roundName: string;
  categoryId: string;
  categoryName: string;
  teamId: string;
  teamName: string;
  totalScore: number;
  averageScore: number;
  rankPosition: number;
  isAdvanced: boolean;
}

export interface EventPrizeSummary {
  eventId: string;
  eventName: string;
  totalPrize: number;
  currency: string;
}

export interface TotalPrizeSummary {
  totalPrize: number;
  currency: string;
}

export const awardService = {
  getById: (id: string) =>
    api.get<AwardResponse>(`/api/v1/awards/${id}`),
  getByEvent: (eventId: string) =>
    api.get<AwardResponse[]>(`/api/v1/awards/events/${eventId}`),
  grant: (data: {
    eventId: string; categoryId?: string; teamId: string;
    awardTierId: string; awardTitle: string;
    description?: string; prizeValue?: number; prizeCurrency?: string;
  }) => api.post<AwardResponse>("/api/v1/awards/grandAwardToATeam", data),

  // Patterns
  getPatterns: (categoryId: string) =>
    api.get<AwardPatternResponse[]>(`/api/v1/awards/categories/${categoryId}/award-patterns`),
  savePatterns: (categoryId: string, patterns: AwardPatternItemRequest[]) =>
    api.post<AwardPatternResponse[]>(`/api/v1/awards/templates/categories/${categoryId}/award-patterns`, { patterns }),

  // Top ranking candidates
  getTopCandidates: (categoryId: string, roundId?: string, limit = 10) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (roundId) params.set("roundId", roundId);
    return api.get<RankingAwardCandidateResponse[]>(`/api/v1/awards/categories/${categoryId}/rankings/top?${params}`);
  },
  autoGrant: (categoryId: string, roundId?: string, limit = 10) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (roundId) params.set("roundId", roundId);
    return api.post<AwardResponse[]>(`/api/v1/awards/categories/${categoryId}/auto-grant-top?${params}`, {});
  },

  // Certificate
  getCertificateUrl: (awardId: string) =>
    `${API_BASE_URL}/api/v1/certificates/download/${awardId}`,
  downloadCertificate: (awardId: string) =>
    api.blob(`/api/v1/certificates/download/${awardId}`),

  // Public prize summary — whitelisted in SecurityConfig, no auth needed
  getTotalPrize: async (): Promise<TotalPrizeSummary> => {
    interface SystemPrizeResponse {
      totalPrizes: Array<{ prizeCurrency: string; totalPrize: number }>;
    }
    const raw = await api.get<SystemPrizeResponse>(`/api/v1/awards/events/total-prize`, false);
    if (!raw || !raw.totalPrizes || raw.totalPrizes.length === 0) {
      return { totalPrize: 0, currency: "VND" };
    }
    // Ưu tiên VND, fallback về currency đầu tiên
    const vnd = raw.totalPrizes.find(p => p.prizeCurrency?.toUpperCase() === "VND");
    const picked = vnd ?? raw.totalPrizes[0];
    return { totalPrize: Number(picked.totalPrize), currency: picked.prizeCurrency };
  },
};
