import { api } from "@/lib/api/apiClient";
import { type TeamResponse } from "@/features/teams/api/teamService";

export interface AssignedCategoryDto {
  categoryId: string;
  categoryName: string;
  description: string;
  eventId: string;
  eventName: string;
  teamCount: number;
  isActive: boolean;
}

export interface MentorDashboardSummary {
  assignedCategories: AssignedCategoryDto[];
  teams: TeamResponse[];
}

export const mentorDashboardService = {
  /**
   * Lấy toàn bộ data cần thiết cho Mentor Dashboard trong 1 request.
   * Thay thế ~50+ API call rải rác (getAll events → categories/event → mentor-check/category → teams/event)
   */
  getDashboardSummary: (): Promise<MentorDashboardSummary> =>
    api.get<MentorDashboardSummary>("/api/v1/mentor/dashboard-summary"),
};
