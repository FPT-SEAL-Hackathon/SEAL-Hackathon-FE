import { api } from "@/lib/api/apiClient";
import { type EventResponse } from "@/features/events/api/eventService";

export interface PublicHallOfFameItem {
  eventName: string;
  categoryName: string;
  teamName: string;
  awardTierName: string;
  awardTitle: string;
  leaderName: string;
}

export interface PublicSystemPrizeTotal {
  totalPrizes: Array<{ prizeCurrency: string; totalPrize: number }>;
}

export interface LandingSummaryResponse {
  events: EventResponse[];
  totalTeams: number;
  totalPrize: PublicSystemPrizeTotal;
  hallOfFame: PublicHallOfFameItem[];
}

export const publicSummaryService = {
  /**
   * Lấy toàn bộ data cần thiết cho Landing Page trong 1 request.
   * Thay thế 4 API call rải rác: getPublicEvents, countAll, getSystemPrizeTotal, getHallOfFame
   */
  getLandingSummary: (): Promise<LandingSummaryResponse> =>
    api.get<LandingSummaryResponse>("/api/v1/public/landing-summary"),
};
