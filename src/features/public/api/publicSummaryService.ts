import { api } from "@/lib/api/apiClient";
import { type EventResponse } from "@/features/events/api/eventService";
import { type HallOfFameResponse, type SystemAwardPrizeTotalResponse } from "@/features/awards/api/awardService";

export interface LandingSummaryResponse {
  events: EventResponse[];
  totalTeams: number;
  totalPrize: SystemAwardPrizeTotalResponse;
  hallOfFame: HallOfFameResponse[];
}

export const publicSummaryService = {
  /**
   * Lấy toàn bộ data cần thiết cho Landing Page trong 1 request.
   * Thay thế 4 API call rải rác: getPublicEvents, countAll, getSystemPrizeTotal, getHallOfFame
   */
  getLandingSummary: (): Promise<LandingSummaryResponse> =>
    api.get<LandingSummaryResponse>("/api/v1/public/landing-summary"),
};
