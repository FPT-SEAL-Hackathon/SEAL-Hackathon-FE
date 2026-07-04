import { api } from "@/lib/api/apiClient";

export interface MilestoneResponse {
  milestoneId: string;
  teamId: string;
  mentorUserId: string;
  label: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const milestoneService = {
  /** Get all milestones for a team */
  getByTeam: (teamId: string) =>
    api.get<MilestoneResponse[]>(`/api/v1/teams/${teamId}/milestones`),

  /** Create a new milestone */
  create: (teamId: string, label: string, sortOrder?: number) =>
    api.post<MilestoneResponse>(`/api/v1/teams/${teamId}/milestones`, {
      label,
      sortOrder,
    }),

  /** Toggle done/undone */
  toggle: (teamId: string, milestoneId: string) =>
    api.patch<MilestoneResponse>(
      `/api/v1/teams/${teamId}/milestones/${milestoneId}/toggle`,
      {}
    ),

  /** Delete a milestone */
  delete: (teamId: string, milestoneId: string) =>
    api.delete(`/api/v1/teams/${teamId}/milestones/${milestoneId}`),
};
