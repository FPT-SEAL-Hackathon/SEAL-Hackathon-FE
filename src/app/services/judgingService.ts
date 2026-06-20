import { api } from "./apiClient";

export interface JudgingDTO {
  id: string;
  submissionId: string;
  roundJudgeId: string;
  judgeName: string;
  roundCriterionId: string;
  criterionName: string;
  scoreValue: number;
  comment: string;
  scoredAt: string;
  updatedAt: string;
  isCalibration: boolean;
}

export interface ScoreSubmissionDTO {
  submissionId: string;
  roundCriterionId: string;
  scoreValue: number;
  comment?: string;
  isCalibration?: boolean;
}

export interface UpdateScoreSubmissionDTO {
  judgingId: string;
  scoreValue: number;
  comment?: string;
  isCalibration?: boolean;
  reason: string;
}

export interface EvaluationAuditLogDTO {
  id: string;
  eventId: string;
  actionType: string;
  actorUserId: string;
  judgingId: string;
  teamId: string;
  submissionId: string;
  oldValue: string;
  newValue: string;
  reason: string;
  createdAt: string;
}

export const judgingService = {
  recordScores: (scores: ScoreSubmissionDTO[]) =>
    api.post<void>("/api/v1/judging", scores),
  updateScores: (updates: UpdateScoreSubmissionDTO[]) =>
    api.patch<void>("/api/v1/judging", updates),
  getBySubmission: (submissionId: string) =>
    api.get<JudgingDTO[]>(`/api/v1/judging/submission/${submissionId}`),
  getByJudge: (judgeUserId: string) =>
    api.get<JudgingDTO[]>(`/api/v1/judging/judge/${judgeUserId}`),
  getAuditLogs: (eventId: string) =>
    api.get<EvaluationAuditLogDTO[]>(`/api/v1/judging/audit-logs/event/${eventId}`),
};
