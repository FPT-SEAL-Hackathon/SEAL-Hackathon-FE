import { api } from "@/lib/api/apiClient";

export interface MilestoneResponse {
  milestoneId: string;
  requestId: string;
  mentorUserId: string;
  label: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const milestoneService = {
  /** Get all milestones for a request */
  getByTeam: (requestId: string) =>
    api.get<MilestoneResponse[]>(`/api/v1/consultation-requests/${requestId}/milestones`),

  /** Create a new milestone */
  create: (requestId: string, label: string, sortOrder?: number) =>
    api.post<MilestoneResponse>(`/api/v1/consultation-requests/${requestId}/milestones`, {
      label,
      sortOrder,
    }),

  /** Toggle done/undone */
  toggle: (requestId: string, milestoneId: string) =>
    api.patch<MilestoneResponse>(
      `/api/v1/consultation-requests/${requestId}/milestones/${milestoneId}/toggle`,
      {}
    ),

  /** Delete a milestone */
  delete: (requestId: string, milestoneId: string) =>
    api.delete(`/api/v1/consultation-requests/${requestId}/milestones/${milestoneId}`),
};
