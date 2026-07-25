import { api } from "@/lib/api/apiClient";

export interface RoundResponse {
  roundId: string;
  categoryId: string;
  roundName: string;
  description: string;
  roundOrder: number;
  roundStatusId: string;
  roundStatusName?: string;
  submissionDeadline: string | null;
  judgingDeadline: string | null;
  startDate: string | null;
  endDate: string | null;
  // Cửa sổ appeal (khiếu nại) — có ở BE RoundResponse và type Round; timeline dùng để vẽ.
  appealStartTime?: string | null;
  appealEndTime?: string | null;
  advancementTopN: number | null;
  isCalibrationRound: boolean;
  appealStartTime?: string;
  appealEndTime?: string;
}

export interface CreateRoundRequest {
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
  appealStartTime?: string;
  appealEndTime?: string;
}

export interface RoundCriterionResponse {
  roundCriterionId: string;
  roundId: string;
  eventCriterionId: string;
  criterionName: string;
  description: string;
  weight: number;
  maxScore: number;
  sortOrder: number;
}

export interface JudgeResponse {
  judgeId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface RoundJudgeResponse {
  roundJudgeId: string;
  roundId: string;
  judgeId: string;
  assignedAt: string;
  assignedById: string;
}

export interface CriterionTemplateResponse {
  templateId: string;
  criterionName: string;
  description: string;
  defaultWeight: number;
  maxScore: number;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventCriterionResponse {
  eventCriterionId: string;
  eventId: string;
  templateId: string;
  criterionName: string;
  description: string;
  weight: number;
  maxScore: number;
  sortOrder: number;
  isActive: boolean;
}

export const roundService = {
  getByCategory: (categoryId: string) =>
    api.get<RoundResponse[]>(`/api/v1/rounds/${categoryId}`),
  getById: (id: string) =>
    api.get<RoundResponse>(`/api/v1/round/${id}`),
  getFinal: (categoryId: string) =>
    api.get<RoundResponse>(`/api/v1/round/final/${categoryId}`),
  create: (categoryId: string, data: CreateRoundRequest) =>
    api.post<RoundResponse>(`/api/v1/round/${categoryId}`, data),
  update: (id: string, data: Partial<CreateRoundRequest>) =>
    api.put<RoundResponse>(`/api/v1/round/${id}`, data),
  delete: (id: string) =>
    api.delete(`/api/v1/round/${id}`),

  // Criteria
  getCriteria: (roundId: string) =>
    api.get<RoundCriterionResponse[]>(`/api/v1/rounds/criteria/${roundId}`),
  importCriteriaFromEvent: (roundId: string, eventCriterionIds: string[]) =>
    api.post<RoundCriterionResponse[]>(`/api/v1/rounds/criteria/import/${roundId}`, { eventCriterionIds }),

  // Judges
  getJudges: (roundId: string) =>
    api.get<JudgeResponse[]>(`/api/v1/round/judges/${roundId}`),
  assignJudges: (roundId: string, userIds: string[]) =>
    api.post<RoundJudgeResponse[]>(`/api/v1/round/judges/${roundId}`, { userIds, judgeIds: userIds }),
  disableJudge: (roundJudgeId: string, force?: boolean) =>
    api.patch(`/api/v1/round/judge/${roundJudgeId}${force ? "?force=true" : ""}`),
  getRoundsByJudge: (judgeId: string) =>
    api.get<RoundResponse[]>(`/api/v1/judge/rounds/${judgeId}`),

  // Criterion templates
  getTemplates: () =>
    api.get<CriterionTemplateResponse[]>("/api/v1/criteria/templates"),
  getTemplateById: (id: string) =>
    api.get<CriterionTemplateResponse>(`/api/v1/criteria/templates/${id}`),
  importCriteriaToEvent: (eventId: string, templateIds: string[]) =>
    api.post<EventCriterionResponse[]>(`/api/v1/event/criteria/import/${eventId}`, { templateIds }),
};
